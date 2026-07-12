import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as dns from 'dns/promises';
import { OfacService } from './ofac.service';
import { BlockchainTagsService } from './blockchain-tags.service';

export interface RiskProfile {
  entityName: string;
  entityTypeLabel: string;
  tags: { label: string; type: 'success' | 'danger' | 'warning' | 'info' }[];
  country: string;
  riskScore: number;
  lat?: number;
  lon?: number;
  isp?: string;
}

export interface DigitalFootprintItem {
  id: string;
  domain: string;
  status: 'Activo' | 'Inactivo' | 'Sospechoso';
  registrationDate: string;
  link: string;
}

export interface RelatedEntity {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarSeed: string;
}

export interface DigitalAssetItem {
  id: string;
  network: string;
  address: string;
  balance: string;
  explorerLink: string;
  transactions?: { hash: string; value: string; timestamp: string; type: 'IN' | 'OUT' }[];
  tag?: string;
  category?: string;
}

export interface ScanPayload {
  riskProfile: RiskProfile;
  digitalFootprint: DigitalFootprintItem[];
  relatedEntities: RelatedEntity[];
  digitalAssets: DigitalAssetItem[];
  ofacAlertsCount: number;
  ofacMatches?: string[];
}

@Injectable()
export class OsintService {
  private readonly logger = new Logger(OsintService.name);

  constructor(
    private readonly ofacService: OfacService,
    private readonly tagsService: BlockchainTagsService,
  ) {}

  async scan(query: string): Promise<ScanPayload> {
    const trimmed = query.trim();

    if (this.isIPv4(trimmed) || this.isIPv6(trimmed)) {
      return this.scanIP(trimmed);
    }
    if (this.isEthereumAddress(trimmed)) {
      return this.scanEthereum(trimmed);
    }
    if (this.isBitcoinAddress(trimmed)) {
      return this.scanBitcoin(trimmed);
    }
    return this.scanDomain(trimmed);
  }

  private isIPv4(ip: string): boolean {
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
  }

  private isIPv6(ip: string): boolean {
    return /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$/.test(ip) ||
           /^([0-9a-fA-F]{1,4}:){1,7}:$/.test(ip);
  }

  private isEthereumAddress(addr: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  }

  private isBitcoinAddress(addr: string): boolean {
    return /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(addr);
  }

  private async scanIP(ip: string): Promise<ScanPayload> {
    let country = 'Desconocido';
    let isp = 'Desconocido';
    let lat: number | undefined;
    let lon: number | undefined;
    let riskScore = 15;
    const tags: RiskProfile['tags'] = [];

    try {
      const geoResponse = await axios.get(
        `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,reverse,mobile,proxy,hosting`,
        { timeout: 8000 }
      );
      const geoData = geoResponse.data;

      if (geoData.status === 'success') {
        country = geoData.country || 'Desconocido';
        isp = geoData.isp || 'Desconocido';
        lat = geoData.lat;
        lon = geoData.lon;

        if (geoData.hosting) {
          riskScore += 25;
          tags.push({ label: 'Hosting/Datacenter', type: 'danger' });
        }
        if (geoData.proxy) {
          riskScore += 20;
          tags.push({ label: 'Proxy/VPN Detectado', type: 'danger' });
        }
        if (geoData.mobile) {
          riskScore += 5;
          tags.push({ label: 'Conexión Móvil', type: 'info' });
        }
        if (!geoData.reverse) {
          riskScore += 10;
          tags.push({ label: 'Sin rDNS', type: 'warning' });
        }
        if (['RU', 'CN', 'KP', 'IR'].includes(geoData.countryCode)) {
          riskScore += 25;
          tags.push({ label: 'País de Alto Riesgo', type: 'danger' });
        }
      }
    } catch (error: unknown) {
      this.logger.warn(`Error consultando IP ${ip}:`, (error as Error).message);
    }

    // Verificar OFAC por IP (raro pero posible)
    const ofacMatches = this.ofacService.search(ip);
    if (ofacMatches.length > 0) {
      riskScore = Math.min(100, riskScore + 30);
      tags.push({ label: 'Posible Vínculo OFAC', type: 'danger' });
    }

    return {
      riskProfile: {
        entityName: ip,
        entityTypeLabel: 'DIRECCIÓN IP',
        tags: tags.length > 0 ? tags : [{ label: 'Sin alertas críticas', type: 'success' }],
        country,
        riskScore: Math.min(100, riskScore),
        lat,
        lon,
        isp,
      },
      digitalFootprint: [],
      relatedEntities: [],
      digitalAssets: [],
      ofacAlertsCount: ofacMatches.length,
      ofacMatches: ofacMatches.map(m => m.name),
    };
  }

  private async scanEthereum(address: string): Promise<ScanPayload> {
    let balance = '0 ETH';
    let transactions: DigitalAssetItem['transactions'] = [];
    let riskScore = 20;
    const tags: RiskProfile['tags'] = [];
    
    // Verificar OFAC
    const ofacMatches = this.ofacService.search(address);
    if (ofacMatches.length > 0) {
      riskScore = 95;
      tags.push({ label: 'SANCIONADO OFAC', type: 'danger' });
    }

    // Verificar etiqueta de dirección
    const addressTag = await this.tagsService.getTag(address);
    if (addressTag) {
      if (addressTag.category?.includes('Mixer')) {
        riskScore = Math.min(100, riskScore + 50);
        tags.push({ label: 'Mixer Detectado', type: 'danger' });
      }
      if (addressTag.category?.includes('Sanctioned')) {
        riskScore = Math.min(100, riskScore + 30);
        tags.push({ label: 'Dirección Sancionada', type: 'danger' });
      }
      if (addressTag.category === 'Exchange') {
        tags.push({ label: `Exchange: ${addressTag.label}`, type: 'info' });
        riskScore -= 10;
      }
    }

    try {
      const response = await axios.get(
        `https://eth.blockscout.com/api/v2/addresses/${address}`,
        { timeout: 10000 }
      );
      const data = response.data;

      if (data.coin_balance) {
        const ethBalance = parseFloat(data.coin_balance) / 1e18;
        balance = `${ethBalance.toFixed(6)} ETH`;

        if (ethBalance > 1000) {
          riskScore += 20;
          tags.push({ label: 'Balance Muy Alto', type: 'warning' });
        } else if (ethBalance > 50) {
          riskScore += 10;
          tags.push({ label: 'Balance Elevado', type: 'warning' });
        }
      }

      if (data.transactions_count && data.transactions_count > 0) {
        try {
          const txResponse = await axios.get(
            `https://eth.blockscout.com/api/v2/addresses/${address}/transactions?limit=5`,
            { timeout: 10000 }
          );
          const txData = txResponse.data;

          if (txData.items) {
            transactions = txData.items.map((tx: Record<string, unknown>) => ({
              hash: tx.hash as string,
              value: `${(parseFloat(tx.value as string) / 1e18).toFixed(6)} ETH`,
              timestamp: tx.timestamp as string,
              type: (tx.from as Record<string, string>)?.hash?.toLowerCase() === address.toLowerCase() ? 'OUT' as const : 'IN' as const,
            }));
          }
        } catch (txError: unknown) {
          this.logger.warn('Error obteniendo transacciones:', (txError as Error).message);
        }
      }
    } catch (error: unknown) {
      this.logger.warn(`Error consultando Ethereum ${address}:`, (error as Error).message);
      tags.push({ label: 'Error al consultar blockchain', type: 'warning' });
    }

    return {
      riskProfile: {
        entityName: address,
        entityTypeLabel: 'DIRECCIÓN ETHEREUM',
        tags: tags.length > 0 ? tags : [{ label: 'Sin alertas', type: 'success' }],
        country: 'Blockchain',
        riskScore: Math.min(100, riskScore),
      },
      digitalFootprint: [],
      relatedEntities: [],
      digitalAssets: [{
        id: '1',
        network: 'ETHEREUM (ERC-20)',
        address,
        balance,
        explorerLink: `https://etherscan.io/address/${address}`,
        transactions,
        tag: addressTag?.label,
        category: addressTag?.category,
      }],
      ofacAlertsCount: ofacMatches.length,
      ofacMatches: ofacMatches.map(m => m.name),
    };
  }

  private async scanBitcoin(address: string): Promise<ScanPayload> {
    let balance = '0 BTC';
    let transactions: DigitalAssetItem['transactions'] = [];
    let riskScore = 20;
    const tags: RiskProfile['tags'] = [];
    
    // Verificar OFAC
    const ofacMatches = this.ofacService.search(address);
    if (ofacMatches.length > 0) {
      riskScore = 95;
      tags.push({ label: 'SANCIONADO OFAC', type: 'danger' });
    }

    try {
      const response = await axios.get(
        `https://blockchain.info/rawaddr/${address}?limit=5`,
        { timeout: 10000 }
      );
      const data = response.data;

      const btcBalance = (data.final_balance || 0) / 1e8;
      balance = `${btcBalance.toFixed(8)} BTC`;

      if (btcBalance > 100) {
        riskScore += 20;
        tags.push({ label: 'Balance Muy Alto', type: 'warning' });
      } else if (btcBalance > 5) {
        riskScore += 10;
        tags.push({ label: 'Balance Elevado', type: 'warning' });
      }

      if (data.txs) {
        transactions = data.txs.slice(0, 5).map((tx: Record<string, unknown>) => ({
          hash: tx.hash as string,
          value: `${(Math.abs(tx.result as number) / 1e8).toFixed(8)} BTC`,
          timestamp: new Date((tx.time as number) * 1000).toISOString(),
          type: (tx.result as number) > 0 ? 'IN' as const : 'OUT' as const,
        }));
      }
    } catch (error: unknown) {
      this.logger.warn(`Error consultando Bitcoin ${address}:`, (error as Error).message);
      tags.push({ label: 'Error al consultar blockchain', type: 'warning' });
    }

    return {
      riskProfile: {
        entityName: address,
        entityTypeLabel: 'DIRECCIÓN BITCOIN',
        tags: tags.length > 0 ? tags : [{ label: 'Sin alertas', type: 'success' }],
        country: 'Blockchain',
        riskScore: Math.min(100, riskScore),
      },
      digitalFootprint: [],
      relatedEntities: [],
      digitalAssets: [{
        id: '1',
        network: 'BITCOIN MAINNET',
        address,
        balance,
        explorerLink: `https://blockchain.info/address/${address}`,
        transactions,
      }],
      ofacAlertsCount: ofacMatches.length,
      ofacMatches: ofacMatches.map(m => m.name),
    };
  }

  private async scanDomain(domain: string): Promise<ScanPayload> {
    let riskScore = 15;
    const tags: RiskProfile['tags'] = [];
    let country = 'Desconocido';
    let isp = 'Desconocido';
    let lat: number | undefined;
    let lon: number | undefined;
    const footprint: DigitalFootprintItem[] = [];
    
    // Verificar OFAC por nombre de dominio
    const ofacMatches = this.ofacService.search(domain);

    if (ofacMatches.length > 0) {
      riskScore += 40;
      tags.push({ label: 'Dominio Vinculado OFAC', type: 'danger' });
    }

    try {
      const [aRecords, mxRecords, txtRecords] = await Promise.allSettled([
        dns.resolve4(domain),
        dns.resolveMx(domain),
        dns.resolveTxt(domain),
      ]);

      if (aRecords.status === 'fulfilled' && aRecords.value.length > 0) {
        const ip = aRecords.value[0];

        try {
          const geoResponse = await axios.get(
            `http://ip-api.com/json/${ip}?fields=status,country,countryCode,lat,lon,isp,hosting,proxy`,
            { timeout: 5000 }
          );
          if (geoResponse.data.status === 'success') {
            country = geoResponse.data.country;
            isp = geoResponse.data.isp;
            lat = geoResponse.data.lat;
            lon = geoResponse.data.lon;

            if (geoResponse.data.hosting) {
  // Solo sumar riesgo si NO es un proveedor conocido y seguro
  const safeProviders = ['Google LLC', 'Google', 'Cloudflare', 'Amazon', 'AWS', 'Microsoft Corporation', 'Microsoft'];
  const isp = (geoResponse.data.isp || '').toLowerCase();
  const isSafeProvider = safeProviders.some(p => isp.includes(p.toLowerCase()));
  
  if (!isSafeProvider) {
    riskScore += 15;
    tags.push({ label: 'Hosting Cloud Desconocido', type: 'warning' });
  } else {
    tags.push({ label: 'Hosting Cloud (Proveedor Seguro)', type: 'info' });
  }
}
          }
        } catch (error: unknown) {
          this.logger.warn(`Error geolocalizando IP para ${domain}:`, (error as Error).message);
        }

        footprint.push({
          id: 'dns-a',
          domain: `${domain} → ${ip}`,
          status: 'Activo',
          registrationDate: 'Resolución DNS',
          link: '#',
        });
      } else {
        riskScore += 20;
        tags.push({ label: 'Sin resolución DNS', type: 'danger' });
      }

      if (mxRecords.status === 'fulfilled' && mxRecords.value.length > 0) {
        footprint.push({
          id: 'dns-mx',
          domain: `MX: ${mxRecords.value.map((r: { exchange: string }) => r.exchange).join(', ')}`,
          status: 'Activo',
          registrationDate: 'Configuración de correo',
          link: '#',
        });
      } else {
        riskScore += 10;
        tags.push({ label: 'Sin registros MX', type: 'warning' });
      }

      if (txtRecords.status === 'fulfilled' && txtRecords.value.length > 0) {
        const txtStrings = txtRecords.value.map((r: string[]) => r.join(''));
        const hasSPF = txtStrings.some((t: string) => t.includes('v=spf1'));
        const hasDMARC = txtStrings.some((t: string) => t.includes('v=DMARC1'));

        if (!hasSPF) {
          riskScore += 10;
          tags.push({ label: 'Sin SPF', type: 'warning' });
        }
        if (!hasDMARC) {
          riskScore += 5;
          tags.push({ label: 'Sin DMARC', type: 'info' });
        }

        footprint.push({
          id: 'dns-txt',
          domain: `TXT: ${hasSPF ? 'SPF ✓' : 'SPF ✗'} | ${hasDMARC ? 'DMARC ✓' : 'DMARC ✗'}`,
          status: 'Activo',
          registrationDate: 'Configuración de seguridad',
          link: '#',
        });
      } else {
        riskScore += 15;
        tags.push({ label: 'Sin registros TXT', type: 'warning' });
      }

    } catch (error: unknown) {
      this.logger.warn(`Error DNS para ${domain}:`, (error as Error).message);
      tags.push({ label: 'Error en resolución DNS', type: 'warning' });
    }

    try {
      const rdapResponse = await axios.get(
        `https://rdap.org/domain/${encodeURIComponent(domain)}`,
        { timeout: 8000 }
      );
      const rdapData = rdapResponse.data;

      if (rdapData.events) {
        const registration = rdapData.events.find((e: { eventAction: string }) => e.eventAction === 'registration');
        const expiration = rdapData.events.find((e: { eventAction: string }) => e.eventAction === 'expiration');

        if (registration) {
          footprint.push({
            id: 'whois-reg',
            domain: `Registrado: ${new Date(registration.eventDate).toLocaleDateString()}`,
            status: 'Activo',
            registrationDate: registration.eventDate,
            link: '#',
          });
        }

        if (expiration) {
          const daysUntilExpiry = Math.ceil((new Date(expiration.eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysUntilExpiry < 30) {
            riskScore += 10;
            tags.push({ label: `Expira en ${daysUntilExpiry} días`, type: 'warning' });
          }
        }
      }
    } catch {
      tags.push({ label: 'WHOIS no disponible', type: 'info' });
    }

    return {
      riskProfile: {
        entityName: domain,
        entityTypeLabel: 'DOMINIO/HOST',
        tags: tags.length > 0 ? tags : [{ label: 'Sin alertas críticas', type: 'success' }],
        country,
        riskScore: Math.min(100, riskScore),
        lat,
        lon,
        isp,
      },
      digitalFootprint: footprint,
      relatedEntities: [],
      digitalAssets: [],
      ofacAlertsCount: ofacMatches.length,
      ofacMatches: ofacMatches.map(m => m.name),
    };
  }
}
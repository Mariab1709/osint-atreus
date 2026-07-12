import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface OFACEntry {
  uid: string;
  name: string;
  type: string;
  addresses: string[];
  ids: string[];
}

@Injectable()
export class OfacService implements OnModuleInit {
  private readonly logger = new Logger(OfacService.name);
  private entries: OFACEntry[] = [];
  private readonly CACHE_FILE = path.join(process.cwd(), 'server', 'ofac-cache.json');
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

  async onModuleInit() {
    await this.loadOrRefreshCache();
  }

  private async loadOrRefreshCache() {
    // Verificar si existe caché y no está expirado
    if (fs.existsSync(this.CACHE_FILE)) {
      const stats = fs.statSync(this.CACHE_FILE);
      const age = Date.now() - stats.mtimeMs;
      if (age < this.CACHE_TTL) {
        try {
          this.entries = JSON.parse(fs.readFileSync(this.CACHE_FILE, 'utf-8'));
          this.logger.log(`OFAC cache cargado: ${this.entries.length} entradas`);
          return;
        } catch (err: unknown) {
          this.logger.warn('Cache corrupto, re-descargando...', (err as Error).message);
        }
      }
    }

    await this.refreshCache();
  }

  private async refreshCache() {
    try {
      this.logger.log('Descargando lista OFAC desde treasury.gov...');
      const response = await axios.get(
        'https://www.treasury.gov/ofac/downloads/sdn.csv',
        { responseType: 'text', timeout: 60000 }
      );

      const lines = response.data.split('\n');
      const entries: OFACEntry[] = [];

      // Saltar header (primera línea)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = this.parseCSVLine(line);
        if (parts.length < 12) continue;

        const uid = parts[0]?.trim() || '';
        const name = parts[1]?.trim() || '';
        const type = parts[2]?.trim() || '';
        
        // Extraer direcciones (columnas 3-8 aproximadamente)
        const addresses: string[] = [];
        for (let j = 3; j < 8 && j < parts.length; j++) {
          if (parts[j]?.trim()) addresses.push(parts[j].trim());
        }

        // Extraer IDs/documentos (columnas 8-12)
        const ids: string[] = [];
        for (let j = 8; j < 12 && j < parts.length; j++) {
          if (parts[j]?.trim()) ids.push(parts[j].trim());
        }

        entries.push({ uid, name, type, addresses, ids });
      }

      this.entries = entries;
      fs.writeFileSync(this.CACHE_FILE, JSON.stringify(entries, null, 2));
      this.logger.log(`OFAC cache actualizado: ${entries.length} entradas`);

    } catch (error: unknown) {
      this.logger.error('Error descargando OFAC:', (error as Error).message);
      // Si falla, intentar cargar caché antiguo si existe
      if (fs.existsSync(this.CACHE_FILE)) {
        try {
          this.entries = JSON.parse(fs.readFileSync(this.CACHE_FILE, 'utf-8'));
          this.logger.log(`OFAC cache antiguo cargado: ${this.entries.length} entradas`);
        } catch {
          this.entries = [];
        }
      }
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  search(query: string): OFACEntry[] {
  const q = query.toLowerCase().trim();
  
  // Lista blanca: dominios/entidades que NUNCA deben marcarse
  const whitelist = [
    'google.com', 'google', 'microsoft.com', 'microsoft',
    'apple.com', 'apple', 'amazon.com', 'amazon',
    'facebook.com', 'meta.com', 'meta', 'twitter.com', 'x.com',
    'cloudflare.com', 'cloudflare', 'github.com', 'github',
    'linkedin.com', 'linkedin', 'youtube.com', 'youtube'
  ];
  
  if (whitelist.includes(q)) {
    return []; // Nunca marcar como sancionado
  }

  return this.entries.filter(entry => {
    const name = entry.name.toLowerCase();
    
    // Para dominios: coincidencia exacta o muy cercana
    if (q.includes('.')) {
      // Es un dominio - requerir coincidencia exacta del nombre
      return name === q || 
             name === q.replace('.com', '') ||
             entry.addresses.some(a => a.toLowerCase() === q) ||
             entry.ids.some(id => id.toLowerCase() === q);
    }
    
    // Para otros queries: búsqueda más estricta
    return name === q ||
           name.startsWith(q + ' ') ||
           name.endsWith(' ' + q) ||
           name.includes(' ' + q + ' ');
  }).slice(0, 10);
}
}
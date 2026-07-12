import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface TaggedAddress {
  address: string;
  label: string;
  category: string;
  source: string;
}

@Injectable()
export class BlockchainTagsService {
  private readonly logger = new Logger(BlockchainTagsService.name);
  
  // Base de datos local de direcciones etiquetadas conocidas
  private readonly knownTags: Map<string, TaggedAddress> = new Map([
    // Exchanges - Ethereum
    ['0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be', { 
      address: '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be', 
      label: 'Binance Hot Wallet', 
      category: 'Exchange', 
      source: 'public' 
    }],
    ['0xdac17f958d2ee523a2206206994597c13d831ec7', { 
      address: '0xdac17f958d2ee523a2206206994597c13d831ec7', 
      label: 'Tether (USDT)', 
      category: 'Token', 
      source: 'public' 
    }],
    ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', { 
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 
      label: 'USD Coin (USDC)', 
      category: 'Token', 
      source: 'public' 
    }],
    ['0x2170ed0880ac9a755fd29b2688956bd959f933f8', { 
      address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8', 
      label: 'Binance ETH', 
      category: 'Exchange', 
      source: 'public' 
    }],
    
    // Tornado Cash (sancionado OFAC) - Ethereum
    ['0x910cbd523d972eb0a6f4ce6213daf0a8eee90fce', { 
      address: '0x910cbd523d972eb0a6f4ce6213daf0a8eee90fce', 
      label: 'Tornado Cash: 10 ETH', 
      category: 'Mixer/Sanctioned', 
      source: 'OFAC' 
    }],
    ['0x47ce0c6ed5b0ce3d3a51fd1d35ea30b49b6f8f91', { 
      address: '0x47ce0c6ed5b0ce3d3a51fd1d35ea30b49b6f8f91', 
      label: 'Tornado Cash: 1 ETH', 
      category: 'Mixer/Sanctioned', 
      source: 'OFAC' 
    }],
    ['0x830bd73e4184cef727b8f3a40e13c0d63fb620d5', { 
      address: '0x830bd73e4184cef727b8f3a40e13c0d63fb620d5', 
      label: 'Tornado Cash: 0.1 ETH', 
      category: 'Mixer/Sanctioned', 
      source: 'OFAC' 
    }],
    
    // Exchanges - Bitcoin
    ['1a1zp1ep5qgefi2dmptftl5slmv7divfna', { 
      address: '1a1zp1ep5qgefi2dmptftl5slmv7divfna', 
      label: 'Genesis Block (Satoshi)', 
      category: 'Historical', 
      source: 'public' 
    }],
  ]);

  async fetchEtherscanTags(address: string): Promise<TaggedAddress | null> {
    try {
      const response = await axios.get(
        `https://eth.blockscout.com/api/v2/addresses/${address}`,
        { timeout: 5000 }
      );
      
      const data = response.data;
      if (data.name || data.token) {
        return {
          address,
          label: data.name || data.token?.name || 'Unknown',
          category: data.token ? 'Token' : 'Contract',
          source: 'blockscout',
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async getTag(address: string): Promise<TaggedAddress | null> {
    const lower = address.toLowerCase();
    
    // Buscar en base local primero
    for (const [key, value] of this.knownTags) {
      if (key.toLowerCase() === lower) return value;
    }

    // Intentar fetch remoto
    return await this.fetchEtherscanTags(address);
  }

  isExchange(address: string): boolean {
    const tag = this.getTagSync(address);
    return tag?.category === 'Exchange';
  }

  isMixerOrSanctioned(address: string): boolean {
    const tag = this.getTagSync(address);
    return tag?.category?.includes('Mixer') || tag?.category?.includes('Sanctioned') || false;
  }

  private getTagSync(address: string): TaggedAddress | undefined {
    const lower = address.toLowerCase();
    for (const [key, value] of this.knownTags) {
      if (key.toLowerCase() === lower) return value;
    }
    return undefined;
  }

  addTag(address: string, label: string, category: string, source: string): void {
    this.knownTags.set(address.toLowerCase(), {
      address: address.toLowerCase(),
      label,
      category,
      source,
    });
  }
}
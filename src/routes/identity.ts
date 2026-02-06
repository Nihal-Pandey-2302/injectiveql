import { Router, Request, Response } from 'express';
import { InjectiveService } from '@config/injective';
import { CacheService } from '@config/redis';

const router = Router();

interface NFTVerificationRequest {
  address: string;
  signature?: string;
}

interface NFTVerificationResponse {
  verified: boolean;
  tier: 'default' | 'standard' | 'premium';
  nftCount: number;
  expiresAt: string;
}

export class N1NJ4Verifier {
  private static readonly NFT_CONTRACT = process.env.N1NJ4_CONTRACT || '';
  private static readonly PREMIUM_THRESHOLD = parseInt(process.env.N1NJ4_PREMIUM_THRESHOLD || '3');
  private static readonly CACHE_TTL = parseInt(process.env.CACHE_IDENTITY || '3600');

  static async verifyOwnership(address: string): Promise<NFTVerificationResponse> {
    // Check cache first
    const cacheKey = `n1nj4:${address}`;
    const cached = await CacheService.get<NFTVerificationResponse>(cacheKey);
    if (cached) return cached;

    let verified = false;
    let nftCount = 0;
    let tier: 'default' | 'standard' | 'premium' = 'default';

    try {
      if (this.NFT_CONTRACT) {
        // Query NFT ownership
        const response = await InjectiveService.queryNFTOwnership(this.NFT_CONTRACT, address);
        
        // Parse response (format depends on CW721 implementation)
        const data = JSON.parse(Buffer.from(response.data).toString());
        nftCount = data.tokens?.length || 0;

        if (nftCount > 0) {
          verified = true;
          tier = nftCount >= this.PREMIUM_THRESHOLD ? 'premium' : 'standard';
        }
      }
    } catch (error) {
      console.error(`Error verifying N1NJ4 ownership for ${address}:`, error);
    }

    const result: NFTVerificationResponse = {
      verified,
      tier,
      nftCount,
      expiresAt: new Date(Date.now() + this.CACHE_TTL * 1000).toISOString(),
    };

    // Cache result
    await CacheService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }
}

// POST /api/v1/identity/verify
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { address, signature }: NFTVerificationRequest = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    // TODO: Validate signature for authentication
    // For now, we just verify ownership

    const result = await N1NJ4Verifier.verifyOwnership(address);

    res.json(result);
  } catch (error) {
    console.error('Error in identity verification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

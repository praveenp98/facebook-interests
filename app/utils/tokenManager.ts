import axios from 'axios';

const FACEBOOK_API_VERSION = 'v18.0';
const BASE_URL = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;

interface TokenInfo {
  access_token: string;
  expiration_date?: number;
  token_type?: string;
}

export class TokenManager {
  private static instance: TokenManager;
  private tokenInfo: TokenInfo | null = null;

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  async getValidToken(): Promise<string> {
    try {
      // If we have a valid token that's not expired
      if (
        this.tokenInfo?.access_token &&
        this.tokenInfo?.expiration_date &&
        this.tokenInfo.expiration_date > Date.now() + (24 * 60 * 60 * 1000) // 24 hours buffer
      ) {
        return this.tokenInfo.access_token;
      }

      // Otherwise, try to refresh the token
      return await this.refreshToken();
    } catch (error) {
      console.error('Error in getValidToken:', error);
      // Fallback to current token if refresh fails
      return process.env.FACEBOOK_ACCESS_TOKEN || '';
    }
  }

  private async refreshToken(): Promise<string> {
    try {
      const currentToken = process.env.FACEBOOK_ACCESS_TOKEN;
      const appId = process.env.FACEBOOK_APP_ID;
      const appSecret = process.env.FACEBOOK_APP_SECRET;

      if (!currentToken || !appId || !appSecret) {
        throw new Error('Missing required credentials');
      }

      // First, exchange short-lived token for long-lived token
      const response = await axios.get(`${BASE_URL}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: currentToken
        }
      });

      if (!response.data.access_token) {
        throw new Error('Failed to get long-lived token');
      }

      // Get debug information about the token
      const debugResponse = await axios.get(`${BASE_URL}/debug_token`, {
        params: {
          input_token: response.data.access_token,
          access_token: `${appId}|${appSecret}`
        }
      });

      const tokenData = debugResponse.data.data;

      this.tokenInfo = {
        access_token: response.data.access_token,
        expiration_date: tokenData.expires_at ? tokenData.expires_at * 1000 : undefined,
        token_type: tokenData.type
      };

      console.log('Token refreshed successfully. Expires:', new Date(this.tokenInfo.expiration_date!));
      return this.tokenInfo.access_token;

    } catch (error: any) {
      console.error('Token refresh error:', error.response?.data || error.message);
      throw error;
    }
  }

  async forceRefreshToken(): Promise<string> {
    this.tokenInfo = null; // Clear current token info
    return this.refreshToken();
  }
}

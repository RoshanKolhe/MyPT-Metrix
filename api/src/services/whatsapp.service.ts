import {BindingScope, injectable} from '@loopback/core';
import axios, {AxiosInstance} from 'axios';
import jwt from 'jsonwebtoken'; // you’ll need: npm install jsonwebtoken

@injectable({scope: BindingScope.SINGLETON})
export class WhatsAppService {
  private token: string | null = null;
  private tokenExpiry: number | null = null;
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: 'https://apis.rmlconnect.net',
      timeout: 10000,
    });
  }

  // 1. Get or refresh token
  private async getToken(): Promise<string> {
    const now = Date.now();

    // Refresh if no token or expired
    if (!this.token || !this.tokenExpiry || now >= this.tokenExpiry) {
      console.log('[WhatsApp] Fetching new RML token...');
      const res = await this.http.post('/auth/v1/login', {
        username: process.env.RML_USERNAME,
        password: process.env.RML_PASSWORD,
      });

      console.log('[WhatsApp] Token response:', res.data);

      this.token = res.data.JWTAUTH;

      if (!this.token) {
        throw new Error('Token is missing');
      }

      // Decode JWT expiry instead of assuming
      try {
        const decoded: any = jwt.decode(this.token);
        if (decoded?.exp) {
          // exp is in seconds, convert to ms
          this.tokenExpiry = decoded.exp * 1000 - 60000; // refresh 1 min early
        } else {
          // fallback: 1 hr validity if exp missing
          this.tokenExpiry = now + 3600 * 1000 - 60000;
        }
      } catch (err) {
        console.warn('[WhatsApp] Could not decode JWT, fallback expiry 1h');
        this.tokenExpiry = now + 3600 * 1000 - 60000;
      }
    }

    return this.token!;
  }

  // 2. Send WhatsApp message
  public async sendMessage(payload: any): Promise<any> {
    try {
      const token = await this.getToken();

      const res = await this.http.post('/wba/v1/messages', payload, {
        headers: {
          Authorization: `${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[WhatsApp] Message sent:', res.data);
      return res.data;
    } catch (err: any) {
      console.error(
        '[WhatsApp] Send error:',
        err.response?.data || err.message,
      );
      throw err;
    }
  }
}

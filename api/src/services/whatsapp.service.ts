import {BindingScope, injectable} from '@loopback/core';
import axios, {AxiosInstance} from 'axios';

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
    if (!this.token || !this.tokenExpiry || now >= this.tokenExpiry) {
      console.log('[WhatsApp] Fetching new RML token...');
      const res = await this.http.post('/auth/v1/login', {
        username: process.env.RML_USERNAME,
        password: process.env.RML_PASSWORD,
      });

      this.token = res.data.data.token; // RML returns token under data.token
      const expiresIn = res.data.data.expires_in || 3600; // fallback 1hr
      this.tokenExpiry = now + expiresIn * 1000 - 60000; // refresh 1min early
    }
    return this.token!;
  }

  // 2. Send WhatsApp message
  public async sendMessage(payload: any): Promise<any> {
    try {
      const token = await this.getToken();

      const res = await this.http.post('/wba/v1/messages', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
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

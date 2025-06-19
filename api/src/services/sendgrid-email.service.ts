import sgMail from '@sendgrid/mail';
import {injectable} from '@loopback/core';
import {TWILIO_SITE_SETTINGS} from '../utils/config';

export interface SendGridMail {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    content: string; // base64-encoded string
    filename: string;
    type?: string;
    disposition?: string;
  }>;
}

@injectable()
export class SendGridEmailService {
  constructor() {
    sgMail.setApiKey(TWILIO_SITE_SETTINGS.sendgrid.apiKey);
  }

  async sendMail(mailObj: SendGridMail): Promise<object> {
    const msg = {
      ...mailObj,
      from: mailObj.from || TWILIO_SITE_SETTINGS.sendgrid.fromEmail,
    };

    return sgMail.send(msg);
  }
}

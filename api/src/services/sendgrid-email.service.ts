import sgMail from '@sendgrid/mail';
import {injectable} from '@loopback/core';
import {getTwilioSettings} from '../utils/config';

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
    const {sendgrid} = getTwilioSettings();
    sgMail.setApiKey(sendgrid.apiKey);
  }

  async sendMail(mailObj: SendGridMail): Promise<object> {
    const {sendgrid} = getTwilioSettings();
    const msg = {
      ...mailObj,
      from: mailObj.from || sendgrid.fromEmail,
    };

    return sgMail.send(msg);
  }
}

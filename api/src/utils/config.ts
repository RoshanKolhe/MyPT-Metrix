const SITE_SETTINGS = {
  email: {
    type: 'smtp',
    host: 'smtp.hostinger.com',
    secure: true,
    port: 465,
    tls: {
      rejectUnauthorized: false,
    },
    auth: {
      user: 'thanepetfest@nimblenest.co',
      pass: 'ThanePetFest#2024',
    },
  },
  fromMail: 'thanepetfest@nimblenest.co',
};
export default SITE_SETTINGS;

export const getTwilioSettings = () => ({
  sendgrid: {
    apiKey: process.env.TWILIO_MAIL_API_KEY ?? '',
    fromEmail: 'noreply@sqonefitness.com',
  },
});

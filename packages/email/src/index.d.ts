declare module '@auth/email' {
  interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text: string;
  }

  export function sendEmail(options: SendEmailOptions): Promise<any>; // TODO: Add proper return type
  export { sendVerificationEmail } from './templates/verification'; // Re-export from the template's d.ts
  const _default: {
    sendEmail: typeof sendEmail;
    sendVerificationEmail: typeof sendVerificationEmail;
  };
  export default _default;
}
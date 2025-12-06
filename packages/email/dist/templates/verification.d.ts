declare module '@auth/email/templates/verification' {
  interface User {
    id: string;
    name: string;
    email: string;
  }
  type TFunction = (key: string, options?: Record<string, any>) => string;

  export function sendVerificationEmail(user: User, token: string, t: TFunction): Promise<any>; // TODO: Add proper return type
  const _default: {
    sendVerificationEmail: typeof sendVerificationEmail;
  };
  export default _default;
}
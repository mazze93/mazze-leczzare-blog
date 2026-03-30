declare module 'cloudflare:email' {
  export class EmailMessage {
    constructor(from: string, to: string | null | undefined, raw: string);
  }
}

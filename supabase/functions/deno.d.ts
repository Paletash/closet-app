// Type declarations for Deno & Supabase Edge Functions in VS Code / TypeScript LSP

declare module "https://*" {
  export const serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  const content: any;
  export default content;
  export const [key: string]: any;
}

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    toObject(): Record<string, string>;
  };
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

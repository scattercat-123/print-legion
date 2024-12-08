import 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      slack_id: string;
      printer_has: boolean;
      Assigned_YSWS: string[];
      available_ysws: string[];
      coins: number;
    }
  }

  interface Profile {
    id: string;
    name: string;
    email: string;
    image?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    slack_id?: string;
    printer_has?: boolean;
    Assigned_YSWS?: string[];
    available_ysws: string[];
  }
} 
import NextAuth, { AuthOptions } from 'next-auth';
import SlackProvider from 'next-auth/providers/slack';
import { getUser } from '@/lib/airtable';

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
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    slack_id?: string;
    printer_has?: boolean;
    Assigned_YSWS?: string[];
    sub?: string;  // Slack user ID
  }
}

const authOptions: AuthOptions = {
  providers: [
    SlackProvider({
      clientId: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_SLACK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid profile email',
          user_scope: 'identity.basic identity.email identity.avatar identity.team',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account && profile) {
        const slackUserId = profile.sub || token.sub;
        if (slackUserId) {
          const airtableUser = await getUser(slackUserId);
          if (airtableUser) {
            token.id = airtableUser.id;
            token.slack_id = airtableUser.slack_id;
            token.printer_has = airtableUser.printer_has;
            token.Assigned_YSWS = airtableUser.Assigned_YSWS;
          } else {
            token.slack_id = slackUserId;
            token.printer_has = false;
            token.Assigned_YSWS = [];
          }
        }
      }
      return token;
    },
    async session({ session, token }: { session: any, token: any }) {
      const slack_id = token.slack_id || token.sub || '';
      session.user = {
        ...session.user,
        id: token.id || '',
        slack_id,
        printer_has: token.printer_has || false,
        Assigned_YSWS: token.Assigned_YSWS || [],
      };
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: 'jwt',
  },
  debug: true,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST, authOptions };
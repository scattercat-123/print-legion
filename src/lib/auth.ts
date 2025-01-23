import NextAuth from "next-auth";
import Slack from "next-auth/providers/slack";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Slack({
      clientId: process.env.SLACK_CLIENT_ID,
      clientSecret: process.env.SLACK_CLIENT_SECRET,
      authorization: {
        params: {
          user_scope: "identity.basic identity.email identity.avatar identify",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        token.id = profile["https://slack.com/user_id"];
        token.team_id = profile["https://slack.com/team_id"];
        token.sub = profile["https://slack.com/user_id"] as string;
      }
      return token;
    },

    async session({ session, user, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
});

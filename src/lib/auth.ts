import NextAuth from "next-auth";
import Slack from "next-auth/providers/slack";
import Credentials from "next-auth/providers/credentials";
import { getSlackUserInfo } from "./slack";
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Slack({
      clientId: process.env.SLACK_CLIENT_ID,
      clientSecret: process.env.SLACK_CLIENT_SECRET,
      // authorization: {
      //   params: {
      //     // user_scope: "identity.basic identity.email identity.avatar identify",
      //     // user_scope: "openid profile email",
      //   },
      // },
    }),

    ...(process.env.NODE_ENV === "development"
      ? [
          Credentials({
            name: "Credentials",
            credentials: {
              impersonateId: { label: "Slack ID", type: "text" },
            },
            async authorize(credentials) {
              const id = credentials.impersonateId;
              if (!id) return null;

              const user = await getSlackUserInfo(id as string);
              if (!user) return null;
              return {
                id: user.id,
                team_id: user.team_id,
                impersonateId: user.id,
                name: user.real_name,
                image: user.profile.image_original,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        token.id = profile["https://slack.com/user_id"];
        token.team_id = profile["https://slack.com/team_id"];
        token.sub = profile["https://slack.com/user_id"] as string;
      }

      if (token.impersonateId ?? token.sub) {
        token.id = token.impersonateId ?? token.sub;
        token.impersonateId = null;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
});

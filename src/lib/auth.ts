import NextAuth from "next-auth";
import Slack from "next-auth/providers/slack";
import Credentials from "next-auth/providers/credentials";
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
            async authorize(credentials, request) {
              console.log({ credentials });
              const id = credentials.impersonateId;
              if (!id) return null;

              const data = await fetch(
                `https://slack.com/api/users.info?user=${id}`,
                {
                  headers: {
                    Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
                  },
                }
              );
              const json = await data.json();
              console.log({ json });
              if (!json.ok) return null;
              return {
                id: id as string,
                team_id: json.team_id,
                impersonateId: id as string,
                name: json.user.real_name,
                image: json.user.profile.image_original,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, profile, session }) {
      console.log("jwt", { token, profile, session });

      if (profile) {
        token.id = profile["https://slack.com/user_id"];
        token.team_id = profile["https://slack.com/team_id"];
        token.sub = profile["https://slack.com/user_id"] as string;
      }

      if (token.impersonateId) {
        token.id = token.impersonateId;
        token.impersonateId = null;
      }
      return token;
    },

    async session({ session, user, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
});

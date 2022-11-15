import NextAuth, { NextAuthOptions } from "next-auth";
// import GithubProvider from "next-auth/providers/github"
import EmailProvider from "next-auth/providers/email";
import { prisma } from "../../../db";
import { PayVCPrismaAdapter } from "../../../server/next-auth-prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";

export const NEXT_AUTH_OPTIONS: NextAuthOptions = {
	// Configure one or more authentication providers
	providers: [
		// GithubProvider({
		//     clientId: process.env.GITHUB_ID,
		//     clientSecret: process.env.GITHUB_SECRET,
		// }),
		EmailProvider({
			server: {
				host: process.env.EMAIL_SERVER_HOST,
				port: process.env.EMAIL_SERVER_PORT,
				auth: {
					user: process.env.EMAIL_SERVER_USER,
					pass: process.env.EMAIL_SERVER_PASSWORD,
				},
			},
			from: process.env.EMAIL_FROM,
		}),
		CredentialsProvider({
			// The name to display on the sign in form (e.g. 'Sign in with...')
			name: "TEST EMAIL",
			// The credentials is used to generate a suitable form on the sign in page.
			// You can specify whatever fields you are expecting to be submitted.
			// e.g. domain, username, password, 2FA token, etc.
			// You can pass any HTML attribute to the <input> tag through the object.
			credentials: {
				email: { label: "Email [TEST]", type: "text", placeholder: "Email for user" },
			},

			async authorize(credentials, req) {
				if (process.env.NODE_ENV === "production") {
					return null;
				}
				const user = await prisma.user.findUnique({
					where: {
						email: credentials.email,
					},
				});

				// If no error and we have user data, return it
				if (user) {
					return user;
				}
				// Return null if user data could not be retrieved
				return null;
			},
		}),
	],
	callbacks: {
		async session({ session, token, user }) {
			// When useing JWT, the user is not fetched from the database. We therefor have to do this here.
			if (!user) {
				// console.log("Fetching user from DB as we had an JWT login");
				user = await prisma.user.findFirst({
					where: {
						email: token.email,
					},
					include: {
						businesses: true,
					},
				});
			}
			// Dont return return anything if the email cant be found
			if (!user?.email) {
				throw Error("No user or user.email found");
			}
			return Promise.resolve({
				...session,
				user: {
					email: user.email,
					name: user.name,
					// @ts-ignore
					roles: user.roles,
					id: user.id,
					// @ts-ignore
					businesses: user.businesses,
				},
			});
		},
	},
	adapter: PayVCPrismaAdapter(prisma),
	secret: process.env.NEXTAUTH_SECRET,
	session: {
		strategy: process.env.NODE_ENV === "production" ? "database" : "jwt",
	},
	// When we want to customize the signin form we can uncomment this.
	// pages: {
	//   signIn: "/auth/signin",
	// }
};
export default NextAuth(NEXT_AUTH_OPTIONS);

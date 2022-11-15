import NextAuth from "next-auth";
import type { prisma } from "database";

declare module "next-auth" {
	/**
	 * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
	 */
	interface Session {
		user: {
			/** The user's postal address. */
			roles: string[];
			email: string;
			name?: string;
			id: string;
			businesses: prisma.Business[];
		};
	}
}

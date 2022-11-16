import NextAuth from "next-auth";
import type { prisma } from "database";
import { Business, Prisma } from "@prisma/client";
import { type } from "os";

declare module "next-auth" {
	/**
	 * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
	 */
	interface Session {
		user: User;
	}
	interface SessionWithSelectedBusiness {
		user: UserWithSelectedBusiness;
	}
	type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

	type User = {
		roles: string[];
		email: string;
		name?: string;
		id: string;
		selectedBusiness?: Business;
	};

	type UserWithSelectedBusiness = WithRequired<User, "selectedBusiness">;
}

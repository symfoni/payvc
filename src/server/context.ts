/* eslint-disable @typescript-eslint/no-unused-vars */
import * as trpc from "@trpc/server";
import { TRPCError } from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { Session, unstable_getServerSession } from "next-auth";
import { NEXT_AUTH_OPTIONS } from "../pages/api/auth/[...nextauth]";

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export async function createContext(opts: trpcNext.CreateNextContextOptions) {
	// for API-response caching see https://trpc.io/docs/caching
	// Dont require session for healthcheck
	if (opts.req.url === "/api/trpc/healthcheck") {
		return {};
	}
	// Handle apikeys
	let session = await getServerSessionFromAPIKey(opts);
	// handle regular sessions with clients
	if (!session) {
		session = await unstable_getServerSession(opts.req, opts.res, NEXT_AUTH_OPTIONS);
	}
	return {
		session,
	};
}

export type Context = trpc.inferAsyncReturnType<typeof createContext>;

async function getServerSessionFromAPIKey(opts: trpcNext.CreateNextContextOptions): Promise<Session | null> {
	if (opts.req.headers["x-auth-key"] && typeof opts.req.headers["x-auth-key"] === "string") {
		if (opts.req.headers["x-auth-email"] && typeof opts.req.headers["x-auth-email"] === "string") {
			const business = await prisma.business.findFirst({
				where: {
					apikey: opts.req.headers["x-auth-key"],
				},
			});
			if (business) {
				const user = await prisma.user.findUnique({
					where: {
						email: opts.req.headers["x-auth-email"],
					},
				});
				if (user) {
					const session: Session = {
						user: {
							roles: user.roles,
							email: user.email,
							name: user.name,
							id: user.id,
							selectedBusiness: business,
						},
						// TODO - Add expiry to apkey
						expires: "",
					};
					return session;
				} else {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: `Did not find user with email ${opts.req.headers["x-auth-email"]} for this business.`,
					});
				}
			} else {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: `Did not find business with apikey ${opts.req.headers["x-auth-key"]}.`,
				});
			}
		} else {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "You must provide an email address to use the API.",
			});
		}
	} else {
		return null;
	}
}

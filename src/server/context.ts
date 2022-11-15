/* eslint-disable @typescript-eslint/no-unused-vars */
import * as trpc from "@trpc/server";
import { TRPCError } from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { unstable_getServerSession } from "next-auth";
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
	if (opts.req.headers["X-Auth-Key"] && typeof opts.req.headers["X-Auth-Key"] === "string") {
		if (opts.req.headers["X-Auth-Email"] && typeof opts.req.headers["X-Auth-Email"] === "string") {
			const business = await prisma.business.findFirst({
				where: {
					apikey: opts.req.headers["X-Auth-Key"],
				},
			});
			if (business) {
				const user = await prisma.user.findUnique({
					where: {
						email: opts.req.headers["X-Auth-Email"],
					},
				});
				if (user) {
					return {
						session: {
							user: {
								...user,
								businesses: [business],
							},
						},
					};
				} else {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: `Did not find user with email ${opts.req.headers["X-Auth-Email"]} for this business.`,
					});
				}
			} else {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: `Did not find business with apikey ${opts.req.headers["X-Auth-Key"]}.`,
				});
			}
		} else {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "You must provide an email address to use the API.",
			});
		}
	}
	// handle regular sessions with clients
	const session = await unstable_getServerSession(opts.req, opts.res, NEXT_AUTH_OPTIONS);

	return {
		session,
	};
}

export type Context = trpc.inferAsyncReturnType<typeof createContext>;

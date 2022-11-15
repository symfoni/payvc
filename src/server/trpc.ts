/**
 * This is your entry point to setup the root configuration for tRPC on the server.
 * - `initTRPC` should only be used once per app.
 * - We export only the functionality that we use so we can enforce which base procedures should be used
 *
 * Learn how to create protected base procedures and other things below:
 * @see https://trpc.io/docs/v10/router
 * @see https://trpc.io/docs/v10/procedures
 */

import { Context } from "./context";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";

const t = initTRPC.context<Context>().create({
	/**
	 * @see https://trpc.io/docs/v10/data-transformers
	 */
	transformer: superjson,
	/**
	 * @see https://trpc.io/docs/v10/error-formatting
	 */
	errorFormatter({ shape }) {
		return shape;
	},
});

/**
 * Reusable middleware that checks if users are admin of the given business
 **/
const isBusinessAdmin = t.middleware(({ next, ctx, rawInput }) => {
	if (!ctx.session?.user?.email) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You must be logged in",
		});
	}

	const shape = z.object({ businessId: z.string() });
	const result = shape.safeParse(rawInput);
	if (!result.success) {
		throw new TRPCError({ code: "BAD_REQUEST" });
	}
	const { businessId } = result.data;

	if (!ctx.session.user.businesses.some((b) => b.id === businessId)) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You are not authorized to perform this action because you are not an administrator of this business.",
		});
	}

	return next({
		ctx: {
			// Infers the `session` as non-nullable
			session: ctx.session,
		},
	});
});

/**
 * Reusable middleware that checks if users are loggedin in
 **/
const isUser = t.middleware(({ next, ctx }) => {
	if (!ctx.session?.user?.email) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You are not logged inn",
		});
	}

	if (!(Array.isArray(ctx.session?.user?.roles) && ctx.session?.user?.roles.includes("USER"))) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You must have a ROLE of USER to interact with the API.",
		});
	}

	return next({
		ctx: {
			// Infers the `session` as non-nullable
			session: ctx.session,
		},
	});
});

/**
 * Create a router
 * @see https://trpc.io/docs/v10/router
 */
export const router = t.router;

/**
 * Create an unprotected procedure
 * @see https://trpc.io/docs/v10/procedures
 **/
export const publicProcedure = t.procedure;

/**
 * Is Business Admin procedure
 **/
export const businessAdminProcedure = t.procedure.use(isBusinessAdmin);

/**
 * Create an protected procedure
 **/
export const protectedProcedure = t.procedure.use(isUser);

/**
 * @see https://trpc.io/docs/v10/middlewares
 */
export const middleware = t.middleware;

/**
 * @see https://trpc.io/docs/v10/merging-routers
 */
export const mergeRouters = t.mergeRouters;

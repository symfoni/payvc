import { Context } from "./context";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { Business } from "@prisma/client";
import { Session, SessionWithSelectedBusiness } from "next-auth";

const t = initTRPC.context<Context>().create({
	transformer: superjson,
	errorFormatter({ shape }) {
		return shape;
	},
});
const isBusinessAdmin = t.middleware(async ({ next, ctx, rawInput }) => {
	if (!ctx.session?.user?.email) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You must be logged in",
		});
	}
	const session = await ensureSelectedBusiness(ctx.session, rawInput);
	return next({
		ctx: {
			session,
		},
	});
});
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
export const router = t.router;
export const publicProcedure = t.procedure;
export const businessAdminProcedure = t.procedure.use(isBusinessAdmin);
export const protectedProcedure = t.procedure.use(isUser);
export const middleware = t.middleware;
export const mergeRouters = t.mergeRouters;

const ensureSelectedBusiness = async (session: Session, rawInput: unknown): Promise<SessionWithSelectedBusiness> => {
	if (session.user.selectedBusiness) {
		return session as SessionWithSelectedBusiness;
	} else {
		// is apikey or session did not provide selectedBusiness, try to get it from params

		const business = await getSelectedBusinessFromParams(rawInput, session.user.email);
		if (business) {
			session.user.selectedBusiness = business;
			return session as SessionWithSelectedBusiness;
		} else {
			throw new TRPCError({ code: "UNAUTHORIZED", message: "You are not admin of this business." });
		}
	}
};

const getSelectedBusinessFromParams = async (rawInput: unknown, userEmail: string): Promise<Business | null> => {
	const shape = z.object({ businessId: z.string() });
	const result = shape.safeParse(rawInput);
	if (!result.success) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "User not selected business, must select business through session, apikey or param.",
		});
	}
	const { businessId } = result.data;
	const business = await prisma.business.findFirst({
		where: {
			id: businessId,
			AND: {
				users: {
					some: {
						email: userEmail,
					},
				},
			},
		},
		select: {
			name: true,
			id: true,
			slug: true,
			apikey: true,
			did: true,
			invoiceInfo: true,
		},
	});
	if (!business) {
		return null;
	}
	return business;
};

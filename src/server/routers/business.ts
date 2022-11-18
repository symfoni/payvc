/**
 *
 * This is an example router, you can delete this file and then update `../pages/api/trpc/[trpc].tsx`
 */
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { prisma } from "../../db";
import { z } from "zod";
import { businessAdminProcedure, protectedProcedure, publicProcedure, router } from "../trpc";

/**
 * Default selector for Post.
 * It's important to always explicitly say which fields you want to return in order to not leak extra information
 * @see https://github.com/prisma/prisma/issues/9353
 */
const exposedFields = Prisma.validator<Prisma.BusinessSelect>()({
	id: true,
	name: true,
	slug: true,
	invoiceInfo: false,
	did: true,
	users: true,
	payments: false,
	transactions: true,
	credentialOffers: true,
	requsitions: false,
});

export const businessRouter = router({
	list: protectedProcedure // As long as this returns users, this should be protected
		.input(
			z
				.object({
					limit: z.number().min(1).max(100).default(10),
					cursor: z.string().nullish(),
				})
				.default({}),
		)
		.query(async ({ input, ctx }) => {
			if (!ctx.session.user.roles.includes("ADMIN")) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "Not admin" });
			}
			const { cursor, limit } = input;
			const items = await prisma.business.findMany({
				select: exposedFields,
				// get an extra item at the end which we'll use as next cursor
				take: limit + 1,
				where: {},
				cursor: cursor
					? {
							id: cursor,
					  }
					: undefined,
				orderBy: {
					id: "desc",
				},
			});
			let nextCursor: typeof cursor | undefined = undefined;
			if (items.length > limit) {
				// Remove the last item and use it as next cursor

				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const nextItem = items.pop()!;
				nextCursor = nextItem.id;
			}
			console.log(items);
			return {
				items: items.reverse(),
				nextCursor,
			};
		}),
	addUser: businessAdminProcedure
		.input(
			z.object({
				email: z.string().email(),
				businessId: z.string().cuid(),
			}),
		) // Check at den som spør er admin
		.mutation(async ({ ctx, input }) => {
			// check if the user with input.email exists in db
			const user = await prisma.user.findUnique({
				where: {
					email: input.email,
				},
				select: {
					id: true,
				},
			});

			if (!user.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "The email address you provided does not match any in our records. Please try again",
				});
			}

			const business = await prisma.business.update({
				where: {
					id: input.businessId,
				},
				data: {
					users: {
						connect: {
							email: input.email,
						},
					},
				},
				select: exposedFields,
			});
			return business;
		}),
	removeUser: businessAdminProcedure
		.input(
			z.object({
				email: z.string().email(),
				businessId: z.string().cuid(),
			}),
		) // Check at den som spør er admin
		.mutation(async ({ ctx, input }) => {
			// TODO This check shouldnt be a copy/paste in this function and the one above
			const usersInBusiness = await prisma.business.findUnique({
				where: {
					id: input.businessId,
				},
				select: {
					users: { select: { email: true } },
				},
			});

			// flatten
			const emails = usersInBusiness.users.map((u) => u.email);

			// check if user making the request is admin of the given business
			if (!emails.includes(ctx.session.user.email)) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "Not admin of this business" });
			}
			// ------------------------------todo stop

			const business = await prisma.business.update({
				where: {
					id: input.businessId,
				},
				data: {
					users: {
						disconnect: {
							email: input.email,
						},
					},
				},
				select: exposedFields,
			});
			return business;
		}),
	find: protectedProcedure // As long as this returns users, this should be protected
		.input(
			z.object({
				slug: z.string(),
			}),
		)
		.query(async ({ input }) => {
			const business = await prisma.business.findUnique({
				where: {
					slug: input.slug,
				},
				select: exposedFields,
			});
			return business;
		}),
});

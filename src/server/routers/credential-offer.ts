/**
 *
 * This is an example router, you can delete this file and then update `../pages/api/trpc/[trpc].tsx`
 */
import { router, publicProcedure } from "../trpc";

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma, Prisma } from "../../db";

/**
 * Default selector for Post.
 * It's important to always explicitly say which fields you want to return in order to not leak extra information
 * @see https://github.com/prisma/prisma/issues/9353
 */
const exposedFields = Prisma.validator<Prisma.CredentialOfferSelect>()({
	id: true,
	name: true,
	issuer: true,
	status: true,
	requirements: true,
	price: true,
	createdAt: true,
});

export const credentialOfferRouter = router({
	list: publicProcedure
		.input(
			z
				.object({
					limit: z.number().min(1).max(100).default(10),
					cursor: z.string().nullish(),
				})
				.default({}),
		)
		.query(async ({ input, ctx }) => {
			const { cursor, limit } = input;

			const userBusinesses = await prisma.user.findUnique({
				where: {
					id: ctx.session.user.id,
				},
				select: {
					businesses: {
						select: {
							id: true,
						},
					},
				},
			});
			const businessIds = userBusinesses.businesses.flatMap((b) => b.id);
			const items = await prisma.credentialOffer.findMany({
				select: exposedFields,
				// get an extra item at the end which we'll use as next cursor
				take: limit + 1,
				where: {
					issuerId: {
						in: businessIds,
					},
				},
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

			return {
				items: items.reverse(),
				nextCursor,
			};
		}),
});

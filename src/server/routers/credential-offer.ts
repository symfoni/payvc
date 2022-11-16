/**
 *
 * This is an example router, you can delete this file and then update `../pages/api/trpc/[trpc].tsx`
 */
import { router, publicProcedure, protectedProcedure, businessAdminProcedure } from "../trpc";

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma, Prisma } from "../../db";
import { CredentialOfferStatus, TransactionRequsitionStatus, TransactionStatus } from "@prisma/client";

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
	selectIssuer: businessAdminProcedure
		.input(
			z.object({
				credentialOfferId: z.string(),
				requsitionId: z.string(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const { credentialOfferId, requsitionId } = input;
			const credentialOffer = await prisma.credentialOffer.findFirst({
				where: {
					id: credentialOfferId,
					AND: {
						credentialType: {
							requsitions: {
								some: {
									id: requsitionId,
								},
							},
						},
					},
				},
				select: exposedFields,
			});
			if (!credentialOffer) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Credential offer not found or not linked to requsition",
				});
			}
			if (credentialOffer.status !== CredentialOfferStatus.APPROVED) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Credential offer is not approved",
				});
			}
			const tx = await prisma.transaction.create({
				data: {
					transactionRequsitionStatus: TransactionRequsitionStatus.REQUESTED_BY_WALLET,
					transactionStatus: TransactionStatus.CREATED,
					wallet: {
						connect: {
							id: ctx.session.user.selectedBusiness.id,
						},
					},
					requsition: {
						connect: {
							id: requsitionId,
						},
					},
					credentialOffer: {
						connect: {
							id: credentialOffer.id,
						},
					},
				},
			});
			return tx;
		}),
	issuers: publicProcedure
		.input(
			z.object({
				requsitionId: z.string(),
				limit: z.number().min(1).max(100).default(10),
				cursor: z.string().nullish(),
			}),
		)
		.query(async ({ input, ctx }) => {
			const { requsitionId, cursor, limit } = input;
			const requsition = await prisma.requsition.findUnique({
				where: {
					id: requsitionId,
				},
			});
			if (!requsition) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No requsition found",
				});
			}
			const items = await prisma.credentialOffer.findMany({
				where: {
					status: CredentialOfferStatus.APPROVED,
					credentialType: {
						requsitions: {
							some: {
								id: requsition.id,
							},
						},
					},
				},
				take: limit + 1,
				cursor: cursor
					? {
							id: cursor,
					  }
					: undefined,
				orderBy: {
					id: "desc",
				},
			});
			if (!items || items.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No credentialOffers found",
				});
			}
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
	list: protectedProcedure
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
				where: {
					issuerId: {
						in: businessIds,
					},
				},
				take: limit + 1,
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

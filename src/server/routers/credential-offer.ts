/**
 *
 * This is an example router, you can delete this file and then update `../pages/api/trpc/[trpc].tsx`
 */
import { router, publicProcedure, protectedProcedure, businessAdminProcedure } from "../trpc";

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma, Prisma } from "../../db";
import { CredentialOfferStatus, TransactionRequsitionStatus, TransactionStatus } from "@prisma/client";
import { randomUUID } from "crypto";

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
	selectIssuer: publicProcedure // REVIEW - Security risk, how can we limit this when evry instance of the wallet app has semi-public code.
		.input(
			z.object({
				credentialOfferId: z.string(),
				requsitionId: z.string(),
				walletId: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			const { credentialOfferId, requsitionId, walletId } = input;
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
				include: {
					credentialType: {
						include: {
							requsitions: true,
						},
					},
				},
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
			if (!credentialOffer.credentialType.requsitions[0]) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Credential offer is not linked to requsition",
				});
			}
			const random = randomUUID();
			const tx = await prisma.transaction.create({
				data: {
					transactionRequsitionStatus: TransactionRequsitionStatus.REQUESTED_BY_WALLET,
					transactionStatus: TransactionStatus.CREATED,
					price: credentialOffer.credentialType.requsitions[0].price,
					wallet: {
						connectOrCreate: {
							where: {
								id: walletId,
							},
							create: {
								name: `Created when selecting ${credentialOffer.name}`,
								slug: random,
							},
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
	listBy: publicProcedure
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
	listMy: businessAdminProcedure
		.input(
			z
				.object({
					limit: z.number().min(1).max(100).default(10),
					cursor: z.string().nullish(),
				})
				.default({}),
		)
		.query(async ({ input, ctx }) => {
			const items = await prisma.credentialOffer.findMany({
				// select: exposedFields,
				where: {
					issuerId: {
						in: ctx.session.user.selectedBusiness.id,
					},
				},
				take: input.limit + 1,
				cursor: input.cursor
					? {
							id: input.cursor,
					  }
					: undefined,
				orderBy: {
					id: "desc",
				},
				include: {
					transactions: {
						where: {
							transactionRequsitionStatus: TransactionRequsitionStatus.FULLFILLED,
						},
					},
				},
			});
			console.log("items.length ", items.length);
			let nextCursor: typeof input.cursor | undefined = undefined;
			if (items.length > input.limit) {
				const nextItem = items.pop()!;
				nextCursor = nextItem.id;
			}
			return {
				items: items.reverse(),
				nextCursor,
			};
		}),
});

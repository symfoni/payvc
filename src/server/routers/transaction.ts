/**
 *
 * This is an example router, you can delete this file and then update `../pages/api/trpc/[trpc].tsx`
 */
import { Prisma, TransactionRequsitionStatus, TransactionStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { prisma } from "../../db";
import { z } from "zod";
import { businessAdminProcedure, protectedProcedure, publicProcedure, router } from "../trpc";

/**
 * Default selector for Post.
 * It's important to always explicitly say which fields you want to return in order to not leak extra information
 * @see https://github.com/prisma/prisma/issues/9353
 */
const exposedFields = Prisma.validator<Prisma.TransactionSelect>()({
	id: true,
	createdAt: true,
	transactionRequsitionStatus: true,
	transactionStatus: true,
});

export const transactionRouter = router({
	valid: businessAdminProcedure.input(z.object({ transactionId: z.string() })).query(async ({ input, ctx }) => {
		const { transactionId } = input;
		return (await transactionReadyForFullfillment(transactionId, ctx.session.user.selectedBusiness.id)) ? true : false;
	}),
	fullfill: businessAdminProcedure.input(z.object({ transactionId: z.string() })).mutation(async ({ input, ctx }) => {
		const { transactionId } = input;
		if (await transactionReadyForFullfillment(transactionId, ctx.session.user.selectedBusiness.id)) {
			await prisma.transaction.update({
				where: {
					id: transactionId,
				},
				data: {
					transactionStatus: TransactionStatus.RESERVED,
					transactionRequsitionStatus: TransactionRequsitionStatus.FULLFILLED,
				},
			});
			return true;
		}
		return false;
	}),
	verify: publicProcedure
		.input(z.object({ transactionId: z.string(), proof: z.string().min(3) }))
		.mutation(async ({ input }) => {
			const { transactionId, proof } = input;
			const transaction = await prisma.transaction.update({
				where: {
					id: transactionId,
				},
				data: {
					proof: proof,
					transactionStatus: TransactionStatus.FULLFILLED,
				},

				select: exposedFields,
			});
			if (!transaction) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Transaction not found",
				});
			}
			return transaction;
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
			const items = await prisma.transaction.findMany({
				// select: exposedFields,
				where: {
					OR: [
						{
							credentialOffer: {
								issuerId: ctx.session.user.selectedBusiness.id,
							},
						},
						{
							requsition: {
								verifierId: ctx.session.user.selectedBusiness.id,
							},
						},
						{
							walletId: {
								equals: ctx.session.user.selectedBusiness.id,
							},
						},
					],
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
					credentialOffer: {
						include: {
							credentialType: true,
						},
					},
				},
			});
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

const transactionReadyForFullfillment = async (transactionId: string, crendentialOfferId: string) => {
	const transaction = await prisma.transaction.findFirst({
		where: {
			id: transactionId,
			AND: {
				credentialOffer: {
					issuerId: crendentialOfferId,
				},
			},
		},
	});
	if (!transaction) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Transaction not found",
		});
	}
	if (transaction.transactionRequsitionStatus !== TransactionRequsitionStatus.REQUESTED_BY_WALLET) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Requisition not requested by wallet",
		});
	}
	if (transaction.transactionStatus !== TransactionStatus.CREATED) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Transaction should be in created state",
		});
	}
	return true;
};

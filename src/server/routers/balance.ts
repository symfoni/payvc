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
import { initiateDeposit, initiateWithdrawel, verifyDeposit, verifyWithdrawel } from "../services/bankService";

/**
 * Default selector for Post.
 * It's important to always explicitly say which fields you want to return in order to not leak extra information
 * @see https://github.com/prisma/prisma/issues/9353
 */
const exposedFields = Prisma.validator<Prisma.BalanceSelect>()({
	id: true,
	amount: true,
	currency: true,
	logs: true,
});

export const balanceRouter = router({
	testDeposit: businessAdminProcedure
		.input(
			z.object({
				amount: z.number().min(100),
				currency: z.enum(["USD", "EUR", "ETH"]),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const payment = await initiateDeposit(input.amount, input.currency, ctx.session.user.selectedBusiness.id);
			const verify = await verifyDeposit(payment.id);
			return verify;
		}),
	testWithdraw: businessAdminProcedure
		.input(
			z.object({
				amount: z.number().min(100),
				currency: z.enum(["USD", "EUR", "ETH"]),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const payment = await initiateWithdrawel(input.amount, input.currency, ctx.session.user.selectedBusiness.id);
			const verify = await verifyWithdrawel(payment.id);
			return verify;
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
			const items = await prisma.balance.findMany({
				// select: exposedFields,
				where: {
					businessId: {
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

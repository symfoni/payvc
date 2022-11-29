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
const exposedFields = Prisma.validator<Prisma.RequsitionSelect>()({
	id: true,
	price: true,
	createdAt: true,
	credentialType: true,
});

export const requsitionRouter = router({
	create: businessAdminProcedure.input(z.object({ credentialTypeId: z.string() })).mutation(async ({ input, ctx }) => {
		const credentialType = await prisma.credentialType.findUnique({
			where: {
				id: input.credentialTypeId,
			},
		});
		if (!credentialType) {
			throw new Error("Credential type not found");
		}
		const requsition = await prisma.requsition.create({
			data: {
				credentialType: {
					connect: {
						id: input.credentialTypeId,
					},
				},
				price: credentialType.price,
				verifier: {
					connect: {
						id: ctx.session.user.selectedBusiness.id,
					},
				},
			},
		});
		if (!requsition) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Could not find requsition",
			});
		}
		return requsition;
	}),
	get: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
		const requsition = await prisma.requsition.findUnique({
			where: {
				id: input.id,
			},
			select: exposedFields,
		});
		if (!requsition) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Could not find requsition",
			});
		}
		return requsition;
	}),
	getAll: publicProcedure
		.input(
			z.object({
				slug: z.string(),
			}),
		)
		.query(async ({ input, ctx }) => {
			const requisition = await prisma.requsition.findMany({
				where: {
					verifier: {
						slug: input.slug,
					},
				},
				include: {
					credentialType: true,
					verifier: true,
				},
			});
			if (!requisition) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Credential offer not found",
				});
			}
			return requisition;
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
		.output(z.object({ items: z.array(z.any()), cursor: z.string().nullish() }))
		.query(async ({ input, ctx }) => {
			const items = await prisma.requsition.findMany({
				where: {
					verifier: {
						id: ctx.session.user.selectedBusiness.id,
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
					credentialType: true,
					transactions: {
						where: {
							transactionStatus: TransactionStatus.FULLFILLED,
						},
						select: {
							price: true,
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

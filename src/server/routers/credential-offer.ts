/**
 *
 * This is an example router, you can delete this file and then update `../pages/api/trpc/[trpc].tsx`
 */
import { router, publicProcedure, protectedProcedure, businessAdminProcedure } from "../trpc";

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma, Prisma } from "../../db";
import { CredentialOfferStatus, ExchangeType, TransactionRequsitionStatus, TransactionStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import { intiateTransfer } from "../services/bankService";
import { VCIssuer } from "@symfoni/vc-tools";

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
	types: publicProcedure.input(z.object({}).nullish()).query(async () => {
		return await prisma.credentialType.findMany();
	}),
	create: businessAdminProcedure
		.input(
			z.object({
				credentialTypeId: z.string(),
				price: z.number(),
				name: z.string(),
				requirementId: z.string().nullish(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const res = await prisma.credentialOffer.create({
				data: {
					issuer: {
						connect: {
							id: ctx.session.user.selectedBusiness.id,
						},
					},
					credentialType: {
						connect: {
							id: input.credentialTypeId,
						},
					},
					name: input.name,
					price: input.price,
					status: CredentialOfferStatus.WAITING_APPROVAL,
					parentRequirement: input.requirementId
						? {
								connect: {
									id: input.requirementId,
								},
						  }
						: undefined,
					exchange: {
						connect: {
							type: ExchangeType.WEB,
						},
					},
				},
			});
			return res;
		}),
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
			let wallet = await prisma.business.findUnique({
				where: {
					id: walletId,
				},
			});
			if (!wallet) {
				wallet = await prisma.business.create({
					data: {
						id: walletId,
						name: `Created when selecting ${credentialOffer.name}`,
						slug: random,
					},
				});
			}
			const tx = await intiateTransfer({
				amount: credentialOffer.credentialType.requsitions[0].price,
				currency: "EUR",
				walletId: wallet.id,
				credentialOfferId: credentialOffer.id,
				requisitionId: credentialOffer.credentialType.requsitions[0].id,
				issuerId: credentialOffer.issuerId,
				verifierId: credentialOffer.credentialType.requsitions[0].verifierId,
			});
			return tx;
		}),
	issueCredentialTest: publicProcedure
		.input(
			z.object({
				slug: z.string(),
				phone: z.string(),
			}),
		)
		.query(async ({ input, ctx }) => {
			const issuer = await VCIssuer.init({
				chains: [
					{
						chainId: 5,
						default: true,
						provider: {
							url: "https://eth-goerli.g.alchemy.com/v2/MWv0hh54YO82ISYuwhzpQdn8BbwwheJt",
						},
					},
				],
				dbName: `issuer-${input.slug}`,
				walletSecret: "0xc3c2ccfc2adec51ca4a441714f01db02095c0ea7450664cd00d3787a0d4e1839", // 0xdddD62cA4f31F34d9beE49B07717a920DCCEa949
			});
			const credential = await issuer.createVC({
				type: ["VerifiableCredential", "PhoneCredential"],
				credentialSubject: {
					phoneNumber: input.phone,
				},
				"@context": ["https://www.w3.org/2018/credentials/v1", "https://www.w3.org/2018/credentials/examples/v1"],
				issuer: (await issuer).identifier.did,
				expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
			});
			return credential.proof.jwt as string;
		}),
	get: publicProcedure
		.input(
			z.object({
				slug: z.string(),
			}),
		)
		.query(async ({ input, ctx }) => {
			const credentialOffer = await prisma.credentialOffer.findMany({
				where: {
					issuer: {
						slug: input.slug,
					},
				},
				select: exposedFields,
			});
			if (!credentialOffer) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Credential offer not found",
				});
			}
			return credentialOffer;
		}),
	listAll: publicProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(100).default(10),
				cursor: z.string().nullish(),
			}),
		)
		.query(async ({ input, ctx }) => {
			const { cursor, limit } = input;
			const items = await prisma.credentialOffer.findMany({
				where: {
					status: CredentialOfferStatus.APPROVED,
				},
				include: {
					issuer: true,
					parentRequirement: {
						include: {
							credentialType: true,
							issuer: true,
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
				include: {
					issuer: true,
					parentRequirement: {
						include: {
							credentialType: true,
							issuer: true,
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
						// where: {
						// 	transactionRequsitionStatus: TransactionRequsitionStatus.FULLFILLED,
						// },
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

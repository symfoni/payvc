/**
 *
 * This is an example router, you can delete this file and then update `../pages/api/trpc/[trpc].tsx`
 */
import { prisma, Prisma } from "../../db";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

/**
 * Default selector for Post.
 * It's important to always explicitly say which fields you want to return in order to not leak extra information
 * @see https://github.com/prisma/prisma/issues/9353
 */
const exposedFields = Prisma.validator<Prisma.UserSelect>()({
	name: true,
	email: true,
	id: true,
	roles: true,
	accounts: true,
	businesses: {
		select: {
			name: true,
			id: true,
		},
	},
});

export const accountRouter = router({
	me: protectedProcedure.input(z.object({}).nullish).query(async ({ input, ctx }) => {
		const items = await prisma.user.findUniqueOrThrow({
			select: exposedFields,
			where: {
				email: ctx.session.user.email,
			},
		});

		return items;
	}),
	update: protectedProcedure
		.input(
			z.object({
				name: z.string().min(3).max(50).nullish(),
				addBusiness: z.string().nullish(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const user = await prisma.user.update({
				where: {
					email: ctx.session.user.email,
				},
				data: {
					name: input.name ? input.name : undefined,
					businesses: input.addBusiness
						? {
								connect: {
									id: input.addBusiness,
								},
						  }
						: undefined,
				},
				select: exposedFields,
			});
			return user;
		}),
});

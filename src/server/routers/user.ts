/**
 *
 * This is an example router, you can delete this file and then update `../pages/api/trpc/[trpc].tsx`
 */
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma } from "../../db";

/**
 * Default selector for Post.
 * It's important to always explicitly say which fields you want to return in order to not leak extra information
 * @see https://github.com/prisma/prisma/issues/9353
 */
const defaultUserSelect = Prisma.validator<Prisma.UserSelect>()({
	id: true,
	name: true,
	email: true,
});

export const userRouter = router({
	list: protectedProcedure // TODO Getting user data must be protected in a way. Requiering a the user to have a role isnt really enough
		.input(
			z.object({
				limit: z.number().min(1).max(100).nullish(),
				cursor: z.string().nullish(),
			}),
		)
		.query(async ({ input }) => {
			/**
			 * For pagination docs you can have a look here
			 * @see https://trpc.io/docs/useInfiniteQuery
			 * @see https://www.prisma.io/docs/concepts/components/prisma-client/pagination
			 */

			const limit = input.limit ?? 50;
			const { cursor } = input;

			const items = await prisma.user.findMany({
				select: defaultUserSelect,
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

			return {
				items: items.reverse(),
				nextCursor,
			};
		}),
	byId: publicProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.query(async ({ input }) => {
			const { id } = input;
			const post = await prisma.user.findUnique({
				where: { id },
				select: defaultUserSelect,
			});
			if (!post) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: `No post with id '${id}'`,
				});
			}
			return post;
		}),
	byEmail: protectedProcedure // TODO Getting user data must be protected in a way. Requiering a the user to have a role isnt really enough
		.input(
			z.object({
				email: z.string(),
			}),
		)
		.query(async ({ input }) => {
			const { email } = input;
			const post = await prisma.user.findUnique({
				where: { email },
				select: {
					id: true,
					name: true,
					email: true,
					roles: true,
					businesses: true,
				},
			});
			if (!post) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: `No post with email '${email}'`,
				});
			}
			return post;
		}),
	add: publicProcedure
		.input(
			z.object({
				email: z.string().email("Ikke gyldig eposts"),
				name: z.string().min(3),
			}),
		)
		.mutation(async ({ input }) => {
			const user = await prisma.user.create({
				data: {
					email: input.email,
					name: input.name,
				},
				select: defaultUserSelect,
			});
			return user;
		}),
});

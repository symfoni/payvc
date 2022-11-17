/**
 * This file contains the root router of your tRPC-backend
 */
import { publicProcedure, router } from "../trpc";
import { accountRouter } from "./account";
import { adminRouter } from "./admin";
import { businessRouter } from "./business";
import { credentialOfferRouter } from "./credential-offer";
import { transactionRouter } from "./transaction";
import { userRouter } from "./user";

export const appRouter = router({
	healthcheck: publicProcedure.query(() => "yay!"),
	credentialOffer: credentialOfferRouter,
	user: userRouter,
	account: accountRouter,
	business: businessRouter,
	admin: adminRouter,
	transaction: transactionRouter,
});

export type AppRouter = typeof appRouter;

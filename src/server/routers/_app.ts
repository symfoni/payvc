/**
 * This file contains the root router of your tRPC-backend
 */
import { publicProcedure, router } from "../trpc";
import { adminRouter } from "./admin";
import { balanceRouter } from "./balance";
import { businessRouter } from "./business";
import { credentialOfferRouter } from "./credential-offer";
import { paymentRouter } from "./payment";
import { requsitionRouter } from "./requsition";
import { transactionRouter } from "./transaction";
import { userRouter } from "./user";

export const appRouter = router({
	// healthcheck: publicProcedure.query(() => "yay!"),
	// credentialOffer: credentialOfferRouter,
	// user: userRouter,
	// business: businessRouter,
	// admin: adminRouter,
	// transaction: transactionRouter,
	// payment: paymentRouter,
	requsition: requsitionRouter,
	// balance: balanceRouter,
});

export type AppRouter = typeof appRouter;

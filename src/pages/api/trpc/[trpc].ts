/**
 * This file contains tRPC's HTTP response handler
 */
import * as trpcNext from "@trpc/server/adapters/next";
import { createContext } from "./../../../server/context";
import { appRouter } from "./../../../server/routers/_app";

export default trpcNext.createNextApiHandler({
	router: appRouter,

	createContext,

	onError({ error }) {
		if (error.code === "INTERNAL_SERVER_ERROR") {
			// send to bug reporting
			console.error("Something went wrong", error);
		}
	},

	batching: {
		enabled: true,
	},
	responseMeta() {
		// TODO - unsafe
		return {
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "POST, PUT, DELETE, GET, OPTIONS",
				"Access-Control-Allow-Headers": "*",
				"Access-Control-Request-Method": "*",
			},
			status: 200,
		};
	},
});

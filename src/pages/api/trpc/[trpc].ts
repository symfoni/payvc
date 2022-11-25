/**
 * This file contains tRPC's HTTP response handler
 */
import * as trpcNext from "@trpc/server/adapters/next";
import { NextApiRequest, NextApiResponse } from "next";
import { createOpenApiNextHandler } from "trpc-openapi";
import { createContext } from "./../../../server/context";
import { appRouter } from "./../../../server/routers/_app";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	// Setup CORS

	// Handle incoming OpenAPI requests
	return createOpenApiNextHandler({
		router: appRouter,
		createContext,
		onError({ error }) {
			if (error.code === "INTERNAL_SERVER_ERROR") {
				// send to bug reporting
				console.error("Something went wrong", error);
			}
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
	})(req, res);
};

export default handler;

// export default trpcNext.createNextApiHandler({
// 	router: appRouter,
// 	createContext,
// 	onError({ error }) {
// 		if (error.code === "INTERNAL_SERVER_ERROR") {
// 			// send to bug reporting
// 			console.error("Something went wrong", error);
// 		}
// 	},
// 	batching: {
// 		enabled: true,
// 	},
// 	responseMeta() {
// 		// TODO - unsafe
// 		return {
// 			headers: {
// 				"Access-Control-Allow-Origin": "*",
// 				"Access-Control-Allow-Methods": "POST, PUT, DELETE, GET, OPTIONS",
// 				"Access-Control-Allow-Headers": "*",
// 				"Access-Control-Request-Method": "*",
// 			},
// 			status: 200,
// 		};
// 	},
// });

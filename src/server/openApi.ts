import { generateOpenApiDocument } from "trpc-openapi";
import { appRouter } from "./routers/_app";

/* 👇 */
export const openApiDocument = generateOpenApiDocument(appRouter, {
	title: "tRPC OpenAPI",
	version: "1.0.0",
	baseUrl: "http://localhost:3000/api",
});

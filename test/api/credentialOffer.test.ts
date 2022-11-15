import { expect, test } from "@playwright/test";
import { appRouter } from "../../src/server/routers/_app";

// Dont think we need this kinf of API mock testing

test("List credential offers", async ({ baseURL, request }) => {
	const caller = appRouter.createCaller({
		session: {
			expires: new Date().toISOString(),
			user: {
				name: "Jon",
				roles: ["USER", "ADMIN"],
				email: "jon@symfoni.xyz",
				id: "1",
				businesses: [
					{
						id: "1",
						name: "Symfoni AS",
						slug: "symfoni",
						invoiceInfo: "Operagata 49 0189 OSLO Norge",
						did: "did:ethr:0x234",
					},
				],
			},
		},
	});
	const list = await caller.credentialOffer.list({ limit: 3 });
	expect(list).toBeTruthy();
	expect(list.items.length).toBeGreaterThan(0);
});

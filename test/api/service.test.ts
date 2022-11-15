import { test, expect } from "@playwright/test";

test("healthcheck as regular GET request", async ({ request, baseURL }) => {
	const req = await request.get(`${baseURL}/api/trpc/healthcheck`);
	const json = await req.json();
	expect(json.error).toBeUndefined();
	expect(json.result.data.json).toBe("yay!");
});

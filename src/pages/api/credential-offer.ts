import type { NextApiRequest, NextApiResponse } from "next";
import { appRouter } from "../../server/routers/_app";

// TODO - Remove this, just a quik way to get public route because trpc open api not wokring on latest
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === "GET") {
		const requisitionId = req.query.requisitionId as string;
		const caller = appRouter.createCaller({});
		const result = await caller.credentialOffer.listBy({ requsitionId: requisitionId });
		return res.status(200).json(result);
	}
}

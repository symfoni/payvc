import { TRPCError } from "@trpc/server";
import path from "path";
import { protectedProcedure, router } from "../trpc";
const { execSync } = require("child_process");

export const adminRouter = router({
	seed: protectedProcedure.mutation(async ({ ctx }) => {
		if (!ctx.session.user.roles.includes("ADMIN")) {
			throw new TRPCError({ code: "UNAUTHORIZED", message: "Not admin" });
		}

		await execSync("yarn tsx src/seed.ts", {
			stdio: "inherit",
			cwd: path.resolve(process.cwd(), "../../packages/database"),
			env: process.env,
			encoding: "utf-8",
			error: (err: any) => console.log(err),
			stderr: (err: any) => console.log(err),
		});

		return true;
	}),
});

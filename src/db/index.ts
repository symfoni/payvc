import { PrismaClient } from "@prisma/client";
export { Prisma } from "@prisma/client";

declare global {
	var prisma: PrismaClient | undefined;
}

// export let prisma: PrismaClient;

// if (process.env.NODE_ENV === "production") {
// 	prisma = new PrismaClient({
// 		log: ["error"],
// 	});
// } else {
// 	if (!global.prisma) {
// 		global.prisma = new PrismaClient({
// 			log: ["query", "error", "warn"],
// 		});
// 	}
// 	prisma = global.prisma;
// }

export const prisma =
	global.prisma ||
	new PrismaClient({
		log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
	});

if (process.env.NODE_ENV !== "production") {
	global.prisma = prisma;
}

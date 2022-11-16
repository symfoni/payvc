import {
	CredentialOfferStatus,
	ExchangeType,
	TransactionRequsitionStatus,
	TransactionStatus,
	User,
	UserRole,
} from "@prisma/client";
import { prisma } from ".";
const { execSync } = require("child_process");

async function main() {
	console.log("Emptying database");

	await execSync("yarn prisma migrate reset -f", {
		stdio: "inherit",
		cwd: __dirname,
		env: process.env,
		encoding: "utf-8",
		error: (err: any) => console.log(err),
		stderr: (err: any) => console.log(err),
	});

	console.log("Done emptying database");

	console.log("Start seeding ...");

	const nationalIdentityCredentialType = await prisma.credentialType.create({
		data: {
			name: "NationalIdentityCredential",
			price: 200,
		},
	});
	const boardDirectorCredentialType = await prisma.credentialType.create({
		data: {
			name: "BoardDirectorNO",
			price: 800,
		},
	});
	const exchangeTypeWeb = await prisma.credentialExchange.create({
		data: {
			type: ExchangeType.WEB,
		},
	});

	const jon = await prisma.user.create({
		data: {
			id: "1",
			name: "Jon Symfoni",
			email: "jon@symfoni.xyz",
			roles: [UserRole.USER, UserRole.ADMIN],
			businesses: {
				create: {
					name: "Symfoni AS",
					slug: "symfoni",
					invoiceInfo: "Operagata 49 0189 OSLO Norge",
					did: "did:ethr:0x234",
					credentialOffers: {
						create: {
							name: "NationalIdentityNO",
							price: 100,
							status: CredentialOfferStatus.APPROVED,
							exchange: {
								connect: {
									id: exchangeTypeWeb.id,
								},
							},
							credentialType: {
								connect: {
									id: nationalIdentityCredentialType.id,
								},
							},
						},
					},
				},
			},
		},
		include: {
			businesses: true,
		},
	});
	if (jon.businesses.length < 1) {
		throw new Error("jon.businesses.length < 1");
	}
	const robin = await prisma.user.create({
		data: {
			id: "2",
			name: "Robin PayVC",
			email: "robin@payvc.xyz",
			roles: [UserRole.USER, UserRole.ADMIN],
			businesses: {
				connect: {
					id: jon.businesses[0].id,
				},
			},
		},
	});
	const nationalIdentityCrendentialOffer = await prisma.credentialOffer.findFirst({
		where: {
			name: "NationalIdentityNO",
		},
	});
	if (!nationalIdentityCrendentialOffer) {
		throw Error("Could not find NationalIdentityNO credential offer");
	}
	const andreas = await prisma.user.create({
		data: {
			id: "3",
			name: "Andreas BR",
			email: "andreas@brreg.xyz",
			businesses: {
				create: {
					name: "Registerenheten i Brønnøysund",
					slug: "brreg",
					invoiceInfo: "Postboks 900 8910 BRØNNØYSUND Norge",
					did: "did:ethr:0x123",
					credentialOffers: {
						create: {
							name: "BoardDirectorNO",
							price: 800,
							status: CredentialOfferStatus.WAITING_APPROVAL,
							credentialType: {
								connect: {
									name: boardDirectorCredentialType.name,
								},
							},
							exchange: {
								connect: {
									id: exchangeTypeWeb.id,
								},
							},
							parentRequirement: {
								connect: {
									id: nationalIdentityCrendentialOffer.id,
								},
							},
						},
					},
				},
			},
		},
	});
	const boardDirectorNOCrendentialOffer = await prisma.credentialOffer.findFirst({
		where: {
			name: "BoardDirectorNO",
		},
	});
	if (!boardDirectorNOCrendentialOffer) {
		throw Error("Could not find BoardDirectorNO credential offer");
	}
	const alice = await prisma.user.create({
		data: {
			id: "4",
			name: "Alice Foundry",
			email: "alice@foundry.xyz",
			businesses: {
				create: {
					name: "Foundry inc.",
					slug: "foundry",
					invoiceInfo: "Example st 1 0189 NY USA",
					did: "did:ethr:0x345",
					requsitions: {
						create: {
							price: boardDirectorNOCrendentialOffer.price,
							credentialType: {
								connect: {
									name: boardDirectorCredentialType.name,
								},
							},
						},
					},
				},
			},
		},
	});
	const boardDirectorRequisition = await prisma.requsition.findFirst({
		where: {
			credentialType: {
				name: "BoardDirectorNO",
			},
		},
	});
	if (!boardDirectorRequisition) {
		throw new Error("Could not find BoardDirectorNO requisition");
	}
	const tale = await prisma.user.create({
		data: {
			name: "Tale Holder",
			email: "tale@holder.xyz",
		},
	});

	const elon = await prisma.user.create({
		data: {
			id: "5",
			name: "Elon Starswallet",
			email: "elon@starswallet.xyz",
			businesses: {
				create: {
					name: "Starswallet inc.",
					slug: "starswallet",
				},
			},
		},
		include: {
			businesses: true,
		},
	});

	if (elon.businesses.length < 1) {
		throw new Error("elon.businesses.length < 1");
	}
	const tx = await prisma.transaction.create({
		data: {
			transactionRequsitionStatus: TransactionRequsitionStatus.NEW,
			requsition: {
				connect: {
					id: boardDirectorRequisition?.id,
				},
			},
			transactionStatus: TransactionStatus.CREATED,
			wallet: {
				connect: {
					id: elon.businesses[0].id,
				},
			},
		},
	});

	console.log("Seeding finished.");
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});

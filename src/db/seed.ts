import {
	CredentialOfferStatus,
	ExchangeType,
	PaymentStatus,
	PaymentType,
	TransactionRequsitionStatus,
	TransactionStatus,
	User,
	UserRole,
} from "@prisma/client";
import { prisma } from ".";
import { fullfillTransfer, initiateDeposit, intiateTransfer, verifyDeposit } from "../server/services/bankService";
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
			price: 900,
		},
	});
	const exchangeTypeWeb = await prisma.credentialExchange.create({
		data: {
			type: ExchangeType.WEB,
		},
	});

	const payVC = await prisma.business.create({
		data: {
			name: "PayVC",
			slug: "payvc",
			balance: {
				createMany: {
					data: [
						{
							currency: "ETH",
							amount: 0,
						},
						{
							currency: "EUR",
							amount: 0,
						},
						{
							currency: "USD",
							amount: 0,
						},
					],
				},
			},
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
	// await initiateDeposit(20000, "EUR", jon.businesses[0].id).then((deposit) => {
	// 	verifyDeposit(deposit.id);
	// });
	// await initiateDeposit(5000, "EUR", jon.businesses[0].id).then((deposit) => {
	// 	verifyDeposit(deposit.id);
	// });
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
			selectedBusiness: {
				connect: {
					id: jon.businesses[0].id,
				},
			},
		},
	});
	await prisma.user.update({
		where: {
			id: jon.id,
		},
		data: {
			selectedBusiness: {
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
							price: 500,
							status: CredentialOfferStatus.APPROVED,
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
							price: boardDirectorCredentialType.price,
							id: "req1",
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
		include: {
			businesses: true,
		},
	});

	await initiateDeposit(3000, "EUR", alice.businesses[0].id).then((deposit) => {
		verifyDeposit(deposit.id);
	});
	await initiateDeposit(1000, "EUR", alice.businesses[0].id).then((deposit) => {
		verifyDeposit(deposit.id);
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

	// let tx1 = await intiateTransfer({
	// 	amount: nationalIdentityCredentialType.price,
	// 	credentialOfferId: nationalIdentityCrendentialOffer?.id,
	// 	currency: "EUR",
	// 	issuerId: nationalIdentityCrendentialOffer.issuerId,
	// 	requisitionId: boardDirectorRequisition.id,
	// 	verifierId: boardDirectorRequisition.verifierId,
	// 	walletId: elon.businesses[0].id,
	// });

	// await fullfillTransfer({ transactionId: tx1.id, proof: "JUST TEST" });

	let tx2 = await intiateTransfer({
		amount: boardDirectorCredentialType.price,
		credentialOfferId: boardDirectorNOCrendentialOffer?.id,
		currency: "EUR",
		issuerId: boardDirectorNOCrendentialOffer.issuerId,
		requisitionId: boardDirectorRequisition.id,
		verifierId: boardDirectorRequisition.verifierId,
		walletId: elon.businesses[0].id,
	});

	await fullfillTransfer({ transactionId: tx2.id, proof: "JUST TEST 2" });

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

import { test, expect, APIRequestContext } from "@playwright/test";
import { CredentialOfferStatus, RequsitionStatus, TransactionStatus, User, UserRole } from "@prisma/client";
import { prisma } from "../../src/db";
import { VCIssuer } from "@symfoni/vc-tools";

type T = {
	baseURL: string;
	request: APIRequestContext;
};
test("flow test", async ({ request, baseURL }) => {
	const RANDOM_NUMBER = Math.floor(Math.random() * 99999) + 1;

	// create credential type
	const phoneNumberCredentialType = await prisma.credentialType.upsert({
		create: {
			name: "PhoneNumberNO",
			price: 200,
		},
		where: {
			name: "PhoneNumberNO",
		},
		update: {},
	});

	// issuer set up account
	// isser set up credential and requirements for credential
	// isser set up issuer service

	const issuer = await VCIssuer.init({
		chains: [
			{
				default: true,
				chainId: 5,
				provider: { url: "https://eth-goerli.g.alchemy.com/v2/MWv0hh54YO82ISYuwhzpQdn8BbwwheJt" },
			},
		],
		dbName: `issuer-db-${RANDOM_NUMBER}`,
		walletSecret: "0x1e5b057989b1affaed68d10310a95f28801dd672dac64a4f85748b4432b6c959",
	});
	const ISSUER_APIKEY = "123";

	const issuerAccount = await prisma.user.create({
		data: {
			name: `Issuer-${RANDOM_NUMBER}`,
			email: `issuer@${RANDOM_NUMBER}.com`,
			businesses: {
				connectOrCreate: {
					where: {
						did: issuer.identifier.did,
					},
					create: {
						name: `Company ${RANDOM_NUMBER} issue inc.`,
						slug: `${RANDOM_NUMBER}-inc`,
						invoiceInfo: "Postbox ${RANDOM_NUMBER} US",
						did: issuer.identifier.did,
						apikey: ISSUER_APIKEY,
						credentialOffers: {
							create: {
								name: "PhoneNumberTestCredential",
								price: 300,
								status: CredentialOfferStatus.APPROVED,
								credentialType: {
									connect: {
										id: phoneNumberCredentialType.id,
									},
								},
							},
						},
					},
				},
			},
		},
		include: {
			businesses: {
				include: {
					credentialOffers: true,
				},
			},
		},
	});

	// do the same for any issuers with sub-credentials

	const verifier = await VCIssuer.init({
		chains: [
			{
				default: true,
				chainId: 5,
				provider: { url: "https://eth-goerli.g.alchemy.com/v2/MWv0hh54YO82ISYuwhzpQdn8BbwwheJt" },
			},
		],
		dbName: `issuer-db-${RANDOM_NUMBER}`,
		walletSecret: "0x04778ccc723afe7762862e6ae6c9793e10f61be537df1e2e7044e6735e38a836",
	});
	const VERFIER_APIKEY = "456";

	const verifierAccount = await prisma.user.create({
		data: {
			name: `Verifier-${RANDOM_NUMBER}`,
			email: `verifier@${RANDOM_NUMBER}.com`,
			businesses: {
				connectOrCreate: {
					where: {
						did: verifier.identifier.did,
					},
					create: {
						name: `Company ${RANDOM_NUMBER} verify inc.`,
						slug: `${RANDOM_NUMBER}-inc`,
						invoiceInfo: "Postbox ${RANDOM_NUMBER} US",
						did: verifier.identifier.did,
						apikey: VERFIER_APIKEY,
						requsitions: {
							create: {
								price: 300,
								credentialType: {
									connect: {
										id: phoneNumberCredentialType.id,
									},
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

	const requst = await verfierApp({ baseURL, request }, phoneNumberCredentialType.name, {
		apikey: verifierAccount.businesses[0].apikey,
		email: verifierAccount.email,
	});
	expect(requst).toBeTruthy();

	// verifier set up account
	// verifier set up requisites for a credential
	// verfier set up verifier service and checks it can buy a credential

	await issuer.removeStore();
	await verifier.removeStore();
});

async function verfierApp(t: T, credentialName: string, verifierCredentials: { apikey: string; email: string }) {
	// Show wallet connect info
	// show what crendential the verifier requires
	// communicate verifier, credential to wallet.
	const requst = await wallet(t, credentialName, verifierCredentials);
}

async function wallet(t: T, credentialName: string, verifierCredentials: { apikey: string; email: string }) {
	const req = await t.request.get(`${t.baseURL}/api/trpc/healthcheck`);
	const json = await req.json();
	console.log(json);
	expect(json.error).toBeUndefined();
	expect(json.result.data.json).toBe("yay!");
}
// async function verifierService(user: User, wallet: Wallet, trustedIssuers: string[]) {
// 	// Please provide is with verification of phone number
// 	// we trust the following issuers
// }

// interface User {
// 	phone: string;
// }
// interface Wallet {
// 	id: string;
// 	userRequiresCredentialId: string;
// }

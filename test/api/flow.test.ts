import { test, expect, APIRequestContext } from "@playwright/test";
import { CredentialOfferStatus, ExchangeType, Transaction } from "@prisma/client";
import { prisma } from "../../src/db";
import { VCIssuer } from "@symfoni/vc-tools";
import type { AppRouter } from "../../src/server/routers/_app";
import { createTRPCNext } from "@trpc/next";
import { createTRPCProxyClient, httpBatchLink, httpLink } from "@trpc/client";
import superjson from "superjson";

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
	const exchangeTypeWeb = await prisma.credentialExchange.upsert({
		create: {
			type: ExchangeType.WEB,
		},
		where: {
			type: ExchangeType.WEB,
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
	const ISSUER_SERVICE_GET_CREDENTIAL = async (subjectDID: string) => {
		return issuer.createVC({
			credentialSubject: {
				id: subjectDID,
				phoneNumberNO: "12345678",
			},
		});
	};
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
								exchange: {
									connect: {
										id: exchangeTypeWeb.id,
									},
								},
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
			businesses: {
				include: {
					requsitions: true,
				},
			},
		},
	});
	const WALLET_APIKEY = "777";
	const walletAccount = await prisma.user.create({
		data: {
			name: `Wallet-${RANDOM_NUMBER}`,
			email: `wallet@${RANDOM_NUMBER}.com`,
			businesses: {
				connectOrCreate: {
					where: {
						apikey: WALLET_APIKEY,
					},
					create: {
						name: `Company ${RANDOM_NUMBER} Wallet inc.`,
						slug: `${RANDOM_NUMBER}-inc`,
						invoiceInfo: "PostWallet ${RANDOM_NUMBER} US",
						apikey: WALLET_APIKEY,
					},
				},
			},
		},
	});

	const verifierApp = new VerifierApp({ requsitionId: verifierAccount.businesses[0].requsitions[0].id });
	const wallet = new Wallet({ apikey: WALLET_APIKEY, email: walletAccount.email });
	await verifierApp.userConnectWallet();
	await verifierApp.requestCredentialFromWallet({ baseURL, request }, wallet);

	// const verifierApp = {
	// 	name: "Verifier App",
	// 	onUserRequestAttestation: async () => {
	// 		console.log(this.name, "requested connection with wallet");
	// 	},
	// };

	// const requst = await verfierApp({ baseURL, request }, verifierAccount.businesses[0].requsitions[0].id, {
	// 	apikey: verifierAccount.businesses[0].apikey,
	// 	email: verifierAccount.email,
	// });
	expect(wallet).toBeTruthy();

	// verifier set up account
	// verifier set up requisites for a credential
	// verfier set up verifier service and checks it can buy a credential

	await issuer.removeStore();
	await verifier.removeStore();
});

class VerifierApp {
	constructor(readonly params: { requsitionId: string }) {
		// No body necessary
	}
	userConnectWallet = async () => {
		console.log("Connected to wallet");
	};
	requestCredentialFromWallet = async (t: T, wallet: Wallet) => {
		wallet.handleRequsitionRequestFromWallet(t, this.params.requsitionId);
	};
}

class Wallet {
	private transactions: Transaction[] = [];
	constructor(readonly params: { apikey: string; email: string }) {
		// No body necessary
	}
	handleRequsitionRequestFromWallet = async (t: T, requsitionId: string) => {
		// Just do a healtcheck fist
		const req = await t.request.get(`${t.baseURL}/api/trpc/healthcheck`);
		const json = await req.json();
		console.log(json);
		expect(json.error).toBeUndefined();
		expect(json.result.data.json).toBe("yay!");

		const client = createTRPCProxyClient<AppRouter>({
			links: [
				httpBatchLink({
					url: `${t.baseURL}/api/trpc`,
					headers() {
						return {
							"X-Auth-Key": this.params.apikey,
							"X-Auth-Email": this.params.email,
						};
					},
				}),
			],
			transformer: superjson,
		});
		const res = await client.credentialOffer.issuers.query({ requsitionId: requsitionId });
		// get possible issuers from the credential type
		expect(res.items.length).toBeGreaterThan(0);
		const selectedCredentialOffer = res.items[0];
		const tx = await client.credentialOffer.selectIssuer.mutate({
			credentialOfferId: selectedCredentialOffer.id,
		});
		this.transactions.push(tx);
		return;
		// TODO check for any requirements
		// Get the crendetial from issuer

		// Possible interactions here are:
		/* 
		- We need you to go to a webpage, input your number, we send sms with code, you send us code, we verify the code. 
		- We also need you to sign the request to us so we can issue the credential to your indentifier.
		- We can therefor just redirect them to the page where they can get the credential.
		- This site also need to be able to set up a channel with the wallet where the crendetial can be received. We also need to make sure that the request is waiting for the channel input and continues the request flow. 
	*/
		// lets just mock this by receiving a jwt as
	};
}

class IssuerService {
	constructor() {
		// No body necessary
	}
}

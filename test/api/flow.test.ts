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
		dbName: `tmp-issuer-db-${RANDOM_NUMBER}`,
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
						slug: `${RANDOM_NUMBER}-issuer-inc`,
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
		dbName: `tmp-verifier-db-${RANDOM_NUMBER}`,
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
						slug: `${RANDOM_NUMBER}-verify-inc`,
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
						slug: `${RANDOM_NUMBER}-wallet-inc`,
						invoiceInfo: "PostWallet ${RANDOM_NUMBER} US",
						apikey: WALLET_APIKEY,
					},
				},
			},
		},
		include: {
			businesses: true,
		},
	});
	const t = { baseURL, request };
	const verifierApp = new VerifierApp({ requsitionId: verifierAccount.businesses[0].requsitions[0].id });
	const wallet = new Wallet({ walletId: walletAccount.businesses[0].id });
	const issuerService = new IssuerService({ apikey: ISSUER_APIKEY, email: issuerAccount.email, issuer: issuer });
	await verifierApp.userConnectWallet();
	const requsitionId = await verifierApp.requestCredentialFromWallet(t, wallet);
	const tx = await wallet.handleRequsitionRequestFromWallet(t, requsitionId);
	const vc = await issuerService.handleRequestFromWallet(t, tx);
	const an = await wallet.handleResponseFromIssuer(t, vc, tx.id);
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
		return this.params.requsitionId;
	};
}

class Wallet {
	private transactions: Transaction[] = [];
	private vcs: string[] = [];
	constructor(readonly params: { walletId: string }) {
		// No body necessary
	}
	handleRequsitionRequestFromWallet = async (t: T, requsitionId: string) => {
		// Just do a healtcheck fist
		const req = await t.request.get(`${t.baseURL}/api/trpc/healthcheck`);
		const json = await req.json();
		console.log(json);
		expect(json.error).toBeUndefined();
		expect(json.result.data.json).toBe("yay!");

		// create a client
		const client = createTRPCProxyClient<AppRouter>({
			links: [
				httpBatchLink({
					url: `${t.baseURL}/api/trpc`,
				}),
			],
			transformer: superjson,
		});
		const credentialOffersList = await client.credentialOffer.listBy.query({ requsitionId: requsitionId });
		// get possible issuers from the credential type
		expect(credentialOffersList.items.length).toBeGreaterThan(0);
		const selectedCredentialOffer = credentialOffersList.items[0];
		const tx = await client.credentialOffer.selectIssuer.mutate({
			credentialOfferId: selectedCredentialOffer.id,
			requsitionId: requsitionId,
			walletId: this.params.walletId,
		});
		this.transactions.push(tx);
		expect(tx.id).toBeTruthy();
		return tx;
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
	handleResponseFromIssuer = async (t: T, jwt: string, transactionId: string) => {
		// TODO - Check that the VC is correct
		// save vc

		// send vc to verifier
		// VCS - can be sent to
		/* 
		- PayVC - Saved in database
		- Verifier backend
		- Verifier frontend
		 */
		const client = createTRPCProxyClient<AppRouter>({
			links: [
				httpBatchLink({
					url: `${t.baseURL}/api/trpc`,
				}),
			],
			transformer: superjson,
		});
		// lets just save this to payvc for now
		const tx = await client.transaction.verify.mutate({ proof: jwt, transactionId: transactionId });
		expect(tx.transactionStatus).toBe("FULLFILLED");
		return true;
	};
}

class IssuerService {
	constructor(readonly params: { apikey: string; email: string; issuer: VCIssuer }) {
		// No body necessary
	}

	async handleRequestFromWallet(t: T, tx: Transaction) {
		// create a client
		const client = createTRPCProxyClient<AppRouter>({
			links: [
				httpBatchLink({
					url: `${t.baseURL}/api/trpc`,
					headers: {
						"X-Auth-Key": this.params.apikey,
						"X-Auth-Email": this.params.email,
					},
				}),
			],
			transformer: superjson,
		});
		const valid = await client.transaction.valid.query({ transactionId: tx.id });
		expect(valid).toBe(true);
		const vc = await this.params.issuer.createVC({
			credentialSubject: {
				phoneNumberNO: "+4799999999",
			},
			issuer: {
				id: this.params.issuer.identifier.did,
			},
			type: ["VerifiableCredential", "PhoneNumberCredential"],
			"@context": ["https://www.w3.org/2018/credentials/v1", "https://www.w3.org/2018/credentials/examples/v1"],
		});
		const fullfilled = await client.transaction.fullfill.mutate({ transactionId: tx.id });
		expect(fullfilled).toBe(true);
		return vc.proof.jwt as string;
		// What is requested
		// Do attestation
		// return proof
	}
}

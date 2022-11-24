import React, { useEffect, useState } from "react";
import { Button, Card, Col, Container, Grid, Input, Row, Spacer, Spinner, Text } from "@nextui-org/react";
import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";
import SignClient from "@walletconnect/sign-client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import { SessionTypes, ISignClientEvents } from "@walletconnect/types";
import { VCIssuer, VCVerifier } from "@symfoni/vc-tools";

interface Props {}

const IssuerPage: React.FC<Props> = ({ ...props }) => {
	const router = useRouter();
	const slug = Array.isArray(router.query.id) ? router.query.id[0] : router.query.id;
	const { data, isLoading, error } = trpc.credentialOffer.get.useQuery(
		{
			slug,
		},
		{ retry: false },
	);
	const [nationalIdNumber, setNationalIdNumber] = useState("");
	const [orgNr, setOrgNr] = useState("");
	const [signClient, setSignClient] = useState<SignClient>();
	const [session, setSession] = useState<SessionTypes.Struct>();
	const [verifiedNationalIdentityNumber, setVerifiedNationalIdentityNumber] = useState();

	// WalletConnect
	useEffect(() => {
		let subscribed = true;
		const doAsync = async () => {
			const signClient = await SignClient.init({
				projectId: "fbc3e41dc977f569fed85715965fbd31",
				metadata: {
					name: `Issuer ${slug}`,
					description: `issuer service for ${slug}`,
					url: `${router.basePath}${router.asPath}`,
					icons: ["https://walletconnect.com/walletconnect-logo.png"],
				},
			});

			if (subscribed) {
				setSignClient(signClient);
				// signClient.on("session_update", ({ topic, params }) => {
				// 	const { namespaces } = params;
				// 	const _session = signClient.session.get(topic);
				// 	// Overwrite the `namespaces` of the existing session with the incoming one.
				// 	const updatedSession = { ..._session, namespaces };
				// 	// Integrate the updated session state into your dapp state.
				// 	console.log("updatedSession", updatedSession);
				// 	setSession(updatedSession);
				// });
				// signClient.on("session_delete", () => {
				// 	// Session was deleted -> reset the dapp state, clean up from user session, etc.
				// 	setSession(undefined);
				// });
			}
		};
		doAsync();
		return () => {
			console.log("Cleanup");
			subscribed = false;
			setSignClient(undefined);
			setSession(undefined);
			// if (event) {
			// 	event.removeListener("session_update", event);
			// }
		};
	}, [setSession, setSignClient]);

	async function connect() {
		try {
			if (!signClient) {
				throw new Error("SignClient not initialized");
			}
			const { uri, approval } = await signClient.connect({
				// Provide the namespaces and chains (e.g. `eip155` for EVM-based chains) we want to use in this session.
				requiredNamespaces: {
					eip155: {
						methods: ["eth_sign", "present_credential", "receive_credential"],
						chains: ["eip155:5"],
						events: [],
					},
				},
			});
			if (signClient.session.length) {
				const lastKeyIndex = signClient.session.keys.length - 1;
				const _session = signClient.session.get(signClient.session.keys[lastKeyIndex]);
				console.log("RESTORED SESSION:", _session);
				setSession(_session);
				return;
			}
			// Open QRCode modal if a URI was returned (i.e. we're not connecting an existing pairing).
			if (uri) {
				QRCodeModal.open(uri, () => {
					console.log("EVENT", "QR Code Modal closed");
					QRCodeModal.close();
				});
			}
			// Await session approval from the wallet.
			const session = await approval();
			setSession(session);
			QRCodeModal.close();
		} catch (error) {
			console.error(error);
		} finally {
			// Close the QRCode modal in case it was open.
			QRCodeModal.close();
		}
	}

	async function resetConnection() {
		console.log(signClient);
		if (signClient) {
			await signClient.session.getAll().forEach(async (session) => {
				console.log("disconnecting", session.topic);
				await signClient.disconnect({
					topic: session.topic,
					reason: {
						message: "Initiated from app",
						code: 0,
					},
				});
				await signClient.session.delete(session.topic, { code: 0, message: "Initiated from app" });
				console.log("disconnected", session.topic);
			});
		}
		setSession(undefined);
	}

	async function presentNationalIdentityCredential() {
		if (!signClient) {
			throw new Error("signClient not initialized");
		}
		if (!session) {
			throw new Error("session not initialized");
		}
		console.log("presentNationalIdentityCredential ");
		const result = await signClient.request({
			topic: session.topic,
			chainId: "eip155:5",
			request: {
				method: "present_credential",
				params: ["NationalIdentityNO"],
			},
		});
		console.log(result);
		if (typeof result[0] !== "string") {
			throw new Error("Expected jwt from present_credential");
		}
		const jwt = result[0] as string;
		const verifier = await VCVerifier.init({
			chains: [
				{
					chainId: 5,
					default: true,
					provider: {
						url: "https://eth-goerli.g.alchemy.com/v2/MWv0hh54YO82ISYuwhzpQdn8BbwwheJt",
					},
				},
			],
			dbName: `verifier-${slug}`,
			walletSecret: "0xc3c2ccfc2adec51ca4a441714f01db02095c0ea7450664cd00d3787a0d4e1839", // 0xdddD62cA4f31F34d9beE49B07717a920DCCEa949
		});
		const verifyResult = await verifier.verifyVC({
			credential: jwt,
			policies: {
				audience: false,
				expiry: false,
			},
		});
		if (!verifyResult.verified) {
			throw new Error("Verification failed");
		}
		setVerifiedNationalIdentityNumber(verifyResult.verifiableCredential.credentialSubject.nationalIdentityNO);
	}

	async function getNationalIdentityCredential() {
		if (!signClient) {
			throw new Error("signClient not initialized");
		}
		if (!session) {
			throw new Error("session not initialized");
		}
		const issuer = await VCIssuer.init({
			chains: [
				{
					chainId: 5,
					default: true,
					provider: {
						url: "https://eth-goerli.g.alchemy.com/v2/MWv0hh54YO82ISYuwhzpQdn8BbwwheJt",
					},
				},
			],
			dbName: `issuer-${slug}`,
			walletSecret: "0xc3c2ccfc2adec51ca4a441714f01db02095c0ea7450664cd00d3787a0d4e1839", // 0xdddD62cA4f31F34d9beE49B07717a920DCCEa949
		});
		const credential = await issuer.createVC({
			type: ["VerifiableCredential", "NationalIdentityCredential"],
			credentialSubject: {
				nationalIdentityNO: nationalIdNumber,
			},
			"@context": ["https://www.w3.org/2018/credentials/v1", "https://www.w3.org/2018/credentials/examples/v1"],
			issuer: issuer.identifier.did,
			expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
		});
		const jwt = credential.proof.jwt as string;
		const result = await signClient.request({
			topic: session.topic,
			chainId: "eip155:5",
			request: {
				method: "receive_credential",
				params: [jwt],
			},
		});
	}

	async function getBoardDirectorCredential() {
		if (!signClient) {
			throw new Error("signClient not initialized");
		}
		if (!session) {
			throw new Error("session not initialized");
		}
		const issuer = await VCIssuer.init({
			chains: [
				{
					chainId: 5,
					default: true,
					provider: {
						url: "https://eth-goerli.g.alchemy.com/v2/MWv0hh54YO82ISYuwhzpQdn8BbwwheJt",
					},
				},
			],
			dbName: `issuer-${slug}`,
			walletSecret: "0xc3c2ccfc2adec51ca4a441714f01db02095c0ea7450664cd00d3787a0d4e1839", // 0xdddD62cA4f31F34d9beE49B07717a920DCCEa949
		});
		const credential = await issuer.createVC({
			type: ["VerifiableCredential", "BoardDirectorNO"],
			credentialSubject: {
				nationalIdentityNO: verifiedNationalIdentityNumber,
				boardDirectorOf: orgNr,
			},
			"@context": ["https://www.w3.org/2018/credentials/v1", "https://www.w3.org/2018/credentials/examples/v1"],
			issuer: issuer.identifier.did,
			expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
		});
		const jwt = credential.proof.jwt as string;
		const result = await signClient.request({
			topic: session.topic,
			chainId: "eip155:5",
			request: {
				method: "receive_credential",
				params: [jwt],
			},
		});
	}

	if (isLoading) {
		return <Spinner />;
	}

	if (error) {
		return <Text>{error.message}</Text>;
	}

	return (
		<Container>
			<Text h2>Issuer Service</Text>
			{data?.map((credentialOffers) => (
				<Card key={credentialOffers.id}>
					<Card.Header>
						<Row>
							<Col>
								<Text h4>{credentialOffers.name}</Text>
								{session && (
									<Button onPress={() => resetConnection()} size={"xs"}>
										Reset Connection
									</Button>
								)}
								{!session && (
									<Button onPress={() => connect()} size={"xs"}>
										Connect
									</Button>
								)}
							</Col>
						</Row>
					</Card.Header>
					<Card.Body>
						<Container>
							{credentialOffers.name === "NationalIdentityNO" && (
								<Row>
									<Col>
										<Input
											placeholder="Identity Number (NO) [TESTING]"
											label="National id number (NO)"
											value={nationalIdNumber}
											onChange={(e) => setNationalIdNumber(e.target.value)}
										></Input>
										<Spacer></Spacer>
										{!session && (
											<Button disabled={!nationalIdNumber} onPress={() => connect()}>
												Connect
											</Button>
										)}
										{session && (
											<Button disabled={!nationalIdNumber} onPress={() => getNationalIdentityCredential()}>
												Get credential
											</Button>
										)}
									</Col>
								</Row>
							)}
							{credentialOffers.name === "BoardDirectorNO" && (
								<>
									<Row>
										<Col>
											<Text h6>
												We need a Norwegian National identity credential to attest a board director credential.{" "}
											</Text>
											<Button onPress={() => presentNationalIdentityCredential()}>
												Present Norwegian National Identity credential
											</Button>
											<Spacer></Spacer>
											{verifiedNationalIdentityNumber && (
												<Input
													label="Your verified Natioanl Identity number"
													readOnly
													value={verifiedNationalIdentityNumber}
												></Input>
											)}
										</Col>
									</Row>
									<Spacer></Spacer>
									{verifiedNationalIdentityNumber && (
										<Row>
											<Col>
												<Input
													placeholder="Orgnr (NO) [TESTING]"
													label="Orgnr (NO)"
													value={orgNr}
													onChange={(e) => setOrgNr(e.target.value)}
												></Input>
												<Spacer></Spacer>
												<Button disabled={!(orgNr && session)} onPress={() => getBoardDirectorCredential()}>
													{session ? "Get board director credential" : "Connect first"}
												</Button>
											</Col>
										</Row>
									)}
								</>
							)}
						</Container>
					</Card.Body>
				</Card>
			))}
		</Container>
	);
};
export default IssuerPage;

import React, { useEffect, useState } from "react";
import { Button, Card, Col, Container, Grid, Input, Row, Spacer, Spinner, Text } from "@nextui-org/react";
import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";
import SignClient from "@walletconnect/sign-client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import { SessionTypes, ISignClientEvents } from "@walletconnect/types";
import { VCIssuer } from "@symfoni/vc-tools";

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
	const [signClient, setSignClient] = useState<SignClient>();
	const [session, setSession] = useState<SessionTypes.Struct>();

	useEffect(() => {
		let subscribed = true;
		let event: ISignClientEvents | undefined = undefined;
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
				event = signClient.on("session_update", ({ topic, params }) => {
					const { namespaces } = params;
					const _session = signClient.session.get(topic);
					// Overwrite the `namespaces` of the existing session with the incoming one.
					const updatedSession = { ..._session, namespaces };
					// Integrate the updated session state into your dapp state.
					console.log("updatedSession", updatedSession);
					setSession(updatedSession);
				});
			}
		};
		doAsync();
		return () => {
			subscribed = false;
			setSignClient(undefined);
			setSession(undefined);
			// if (event) {
			// 	event.removeListener("session_update", event);
			// }
		};
	}, []);

	async function connect() {
		try {
			if (!signClient) {
				return;
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
			QRCodeModal.open(uri, () => {
				console.log("QR Code Modal closed");
			});
			// Open QRCode modal if a URI was returned (i.e. we're not connecting an existing pairing).
			if (uri) {
				QRCodeModal.open(uri, () => {
					console.log("EVENT", "QR Code Modal closed");
				});
			}
			// Await session approval from the wallet.
			const session = await approval();
			setSession(session);
		} catch (error) {
			console.error(error);
		} finally {
			// Close the QRCode modal in case it was open.
			QRCodeModal.close();
		}
	}

	async function getCredential() {
		if (!signClient) {
			return;
		}
		if (!session) {
			return;
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
			issuer: (await issuer).identifier.did,
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
						<Text h4>{credentialOffers.name}</Text>
					</Card.Header>
					<Card.Body>
						<Container>
							{credentialOffers.name === "NationalIdentityNO" && (
								<Row>
									<Col>
										<Input
											placeholder="For testing, just write something"
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
											<Button disabled={!nationalIdNumber} onPress={() => getCredential()}>
												Get credential
											</Button>
										)}
									</Col>
								</Row>
							)}
						</Container>
					</Card.Body>
				</Card>
			))}
		</Container>
	);
};
export default IssuerPage;

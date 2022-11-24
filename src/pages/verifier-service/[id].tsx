import React, { useEffect, useState } from "react";
import { Button, Card, Col, Container, Grid, Input, Row, Spacer, Spinner, Text } from "@nextui-org/react";
import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";
import SignClient from "@walletconnect/sign-client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import { SessionTypes, ISignClientEvents } from "@walletconnect/types";
import { VCIssuer, VCVerifier } from "@symfoni/vc-tools";
import { useWalletConnect } from "../../utils/walletConnectState";

interface Props {}

const IssuerPage: React.FC<Props> = ({ ...props }) => {
	const router = useRouter();
	const slug = Array.isArray(router.query.id) ? router.query.id[0] : router.query.id;
	const { data, isLoading, error } = trpc.requsition.getAll.useQuery(
		{
			slug,
		},
		{ retry: false },
	);
	const { init, connect, client, session } = useWalletConnect();
	const [mySession, setMySession] = useState<SessionTypes.Struct>();
	const [myClient, setMyClient] = useState<SignClient>();

	useEffect(() => {
		init(`Verifier ${slug}`, `Verifier service for ${slug}`, `${router.asPath}`);
	}, [init]);
	useEffect(() => {
		// Next js fix
		setMySession(session);
	}, [session]);
	useEffect(() => {
		// Next js fix
		setMyClient(client);
	}, [client]);

	if (isLoading) {
		return <Spinner />;
	}

	if (error) {
		return <Text>{error.message}</Text>;
	}

	async function presentNationalIdentityCredential() {
		if (!myClient) {
			throw new Error("signClient not initialized");
		}
		if (!session) {
			throw new Error("session not initialized");
		}
		console.log("presentNationalIdentityCredential ");
		const result = await myClient.request({
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
		console.log(verifyResult.verifiableCredential.credentialSubject.nationalIdentityNO);
	}

	return (
		<Container justify="center">
			<Row>
				<Col>
					<Text h2>Verifier Service</Text>
					{!mySession && <Button onPress={() => connect()}>Connect</Button>}
					{myClient && <Button onPress={() => presentNationalIdentityCredential()}>Test</Button>}
					<Spacer />
					{data?.map((req) => (
						<Card key={req.id}>
							<Card.Header>
								<Text
									h3
								>{`${req.verifier.name} is requesting ${req.credentialType.name} to perform their service`}</Text>
							</Card.Header>
						</Card>
					))}
				</Col>
			</Row>
		</Container>
	);
};
export default IssuerPage;

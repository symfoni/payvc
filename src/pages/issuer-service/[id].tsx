import React, { useCallback, useEffect, useState } from "react";
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
	const { data, isLoading, error } = trpc.credentialOffer.get.useQuery(
		{
			slug,
		},
		{ retry: false },
	);
	const [nationalIdNumber, setNationalIdNumber] = useState("");
	const [orgNr, setOrgNr] = useState("");
	const [verifiedNationalIdentityNumber, setVerifiedNationalIdentityNumber] = useState();

	const { init, connect, client, session, disconnect, request } = useWalletConnect();
	const [mySession, setMySession] = useState<SessionTypes.Struct>();
	const [myClient, setMyClient] = useState<SignClient>();

	useEffect(() => {
		init(`Issuer ${slug}`, `Issuer service for ${slug}`, `${router.asPath}`);
	}, [init]);
	useEffect(() => {
		// Next js fix
		setMySession(session);
	}, [session]);
	useEffect(() => {
		// Next js fix
		setMyClient(client);
	}, [client]);

	const verifyVC = async (jwt: string) => {
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
		return verifyResult;
	};

	async function presentNationalIdentityCredential() {
		if (!myClient) {
			throw new Error("signClient not initialized");
		}
		if (!mySession) {
			throw new Error("session not initialized");
		}

		const result = await request<string[]>("present_credential", ["NationalIdentityCredential"]);
		console.log(result);
		if (typeof result[0] !== "string") {
			throw new Error("Expected jwt from present_credential");
		}
		const jwt = result[0] as string;
		const verifyResult = await verifyVC(jwt);
		setVerifiedNationalIdentityNumber(verifyResult.verifiableCredential.credentialSubject.nationalIdentityNO);
	}

	const getNationalIdentityCredential = useCallback(async () => {
		if (!myClient) {
			throw new Error("signClient not initialized");
		}
		if (!mySession) {
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
		const result = await request<unknown[]>("receive_credential", [jwt]);
		console.log(result);
	}, [nationalIdNumber, request, slug, myClient, mySession]);

	const getBoardDirectorCredential = useCallback(async () => {
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
		const result = await request<unknown[]>("receive_credential", [jwt]);
		console.log(result);
	}, [verifiedNationalIdentityNumber, orgNr, request, slug]);

	if (isLoading) {
		return <Spinner />;
	}

	if (error) {
		return <Text>{error.message}</Text>;
	}

	return (
		<Container>
			<Text h2>Issuer Service</Text>
			{!mySession && <Button onPress={() => connect()}>Connect</Button>}
			{mySession && <Button onPress={() => disconnect()}>Disconnect</Button>}
			<Spacer></Spacer>
			{data?.map((credentialOffer) => (
				<Card key={credentialOffer.id}>
					<Card.Header>
						<Row>
							<Col>
								<Text h3>{credentialOffer.name}</Text>
							</Col>
						</Row>
					</Card.Header>
					<Card.Body>
						<Container>
							{credentialOffer.name === "NationalIdentityNO" && (
								<Row>
									<Col>
										<Input
											placeholder="Identity Number (NO) [TESTING]"
											label="National id number (NO)"
											value={nationalIdNumber}
											onChange={(e) => setNationalIdNumber(e.target.value)}
										></Input>
										<Spacer></Spacer>
										<Button disabled={!nationalIdNumber || !session} onPress={() => getNationalIdentityCredential()}>
											Get credential
										</Button>
									</Col>
								</Row>
							)}
							{credentialOffer.name === "BoardDirectorNO" && (
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
												<Button onPress={() => getBoardDirectorCredential()}>
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

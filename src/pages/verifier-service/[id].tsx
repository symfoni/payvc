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
	const { init, connect, client, session, disconnect } = useWalletConnect();
	const [mySession, setMySession] = useState<SessionTypes.Struct>();
	const [myClient, setMyClient] = useState<SignClient>();
	const [transactionID, setTransactionID] = useState<string>();
	// const verify = trpc.transaction.verify.useMutation({});
	const [success, setSuccess] = useState(false);

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

	async function requestCredential(requisitionId: string) {
		if (!myClient) {
			throw new Error("signClient not initialized");
		}
		if (!mySession) {
			throw new Error("session not initialized");
		}
		let _transactionId = undefined;
		let valid = false;
		try {
			_transactionId = await myClient.request<string>({
				topic: mySession!.topic,
				chainId: "eip155:5",
				request: {
					method: "request_credential",
					params: [requisitionId],
				},
			});
			valid = true;
		} catch (e) {
			valid = false;
		}
		if (!_transactionId) {
			throw Error("No transactionId returned");
		}
		setTransactionID(_transactionId);
	}
	async function presentCredential(credentialName: string) {
		if (!myClient) {
			throw new Error("signClient not initialized");
		}
		if (!mySession) {
			throw new Error("session not initialized");
		}
		let vp = undefined;
		let valid = false;
		try {
			vp = await myClient.request<string>({
				topic: mySession!.topic,
				chainId: "eip155:5",
				request: {
					method: "presentCredential",
					params: [credentialName],
				},
			});
			valid = true;
		} catch (e) {
			valid = false;
		}
		if (!vp) {
			throw Error("No vp returned");
		}
		// const verified = await verify.mutateAsync({ proof: vp, transactionId: transactionID });
		// console.log("verified", verified);
		setSuccess(true);
	}

	return (
		<Container justify="center">
			<Row>
				<Col>
					<Text h2>Verifier Service</Text>
					{!mySession && <Button onPress={() => connect()}>Connect</Button>}
					{mySession && <Button onPress={() => disconnect()}>Disconnect</Button>}
					<Spacer />
					{data?.map((req) => (
						<Card key={req.id}>
							<Card.Header>
								<Text
									h3
								>{`${req.verifier.name} is requesting ${req.credentialType.name} to perform their service`}</Text>
							</Card.Header>
							<Card.Body>
								<Button
									onPress={() => requestCredential(req.id)}
								>{`Reqeust ${req.credentialType.name} credential`}</Button>
								<Spacer></Spacer>
								{transactionID && (
									<>
										<Text>{`Transaction ID: ${transactionID}`}</Text>
										<Spacer></Spacer>
									</>
								)}
								<Button
									onPress={() => presentCredential(req.credentialType.name)}
								>{`Present ${req.credentialType.name} credential`}</Button>
							</Card.Body>
							{success && (
								<Card.Footer>
									<Text h3 color="green">
										{"Complete"}
									</Text>
								</Card.Footer>
							)}
						</Card>
					))}
				</Col>
			</Row>
		</Container>
	);
};
export default IssuerPage;

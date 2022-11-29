import React, { useCallback, useEffect, useState } from "react";
import { Button, Card, Col, Container, Grid, Input, Row, Spacer, Spinner, Text } from "@nextui-org/react";
import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";
import type SignClient from "@walletconnect/sign-client";
import { SessionTypes, SignClientTypes } from "@walletconnect/types";
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
	const { init, connect, client, session, disconnect, request } = useWalletConnect();
	const [mySession, setMySession] = useState<SessionTypes.Struct>();
	const [myClient, setMyClient] = useState<SignClient>();
	const [transactionID, setTransactionID] = useState<string>();
	const verify = trpc.transaction.verify.useMutation({});
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		init(`Verifier ${slug}`, `Verifier service for ${slug}`, `${router.asPath}`, true);
	}, [init]);
	useEffect(() => {
		// Next js fix
		setMySession(session);
	}, [session]);
	useEffect(() => {
		// Next js fix
		setMyClient(client);
	}, [client]);

	const requestCredential = useCallback(
		async (requisitionId: string) => {
			if (!myClient) {
				throw new Error("signClient not initialized");
			}
			if (!mySession) {
				throw new Error("session not initialized");
			}

			const result = await request<unknown[]>("request_credential", [requisitionId]);
			const _transactionId = result[0] as string;
			if (!_transactionId) {
				throw Error("No transactionId returned");
			}
			setTransactionID(_transactionId);
		},
		[myClient, mySession],
	);
	const presentCredential = useCallback(
		async (credentialName: string) => {
			if (!myClient) {
				throw new Error("signClient not initialized");
			}
			if (!mySession) {
				throw new Error("session not initialized");
			}
			const result = await request<unknown[]>("present_credential", [credentialName]);
			const vp = result[0] as string;
			const transactionID = result[1] as string;
			const verified = await verify.mutateAsync({ proof: vp, transactionId: transactionID });
			console.log("verified", verified);
			setSuccess(true);
		},
		[myClient, mySession, transactionID, verify],
	);

	if (isLoading) {
		return <Spinner />;
	}

	if (error) {
		return <Text>{error.message}</Text>;
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

import React, { useEffect } from "react";
import { Button, Container, Spinner, Table, Text } from "@nextui-org/react";
import { trpc } from "../utils/trpc";
import { Currency } from "./format/currency";

interface Props {}

export const CredentialOfferingList: React.FC<Props> = ({ ...props }) => {
	const { data, isLoading, error, refetch } = trpc.credentialOffer.listMy.useQuery({});
	const { data: balanceData } = trpc.balance.listMy.useQuery();

	useEffect(() => {
		if (!isLoading) {
			console.log(data);
		}
	}, [data]);
	if (isLoading) {
		return <Spinner></Spinner>;
	}
	if (error) {
		return <Container>{error.message}</Container>;
	}
	if (data) {
		return (
			<Table aria-label="Credential offers for user" css={{}} compact>
				<Table.Header>
					<Table.Column>NAME</Table.Column>
					<Table.Column>REVENUE</Table.Column>
					<Table.Column>STATUS</Table.Column>
					<Table.Column>Actions</Table.Column>
				</Table.Header>
				<Table.Body css={{ size: "small" }}>
					{data.items.map((item) => (
						<Table.Row key={item.id}>
							<Table.Cell css={{ maxWidth: "8rem" }}>
								<Text small>{item.name}</Text>
							</Table.Cell>
							<Table.Cell>
								{/* <Currency value={item.transactions.reduce((acu, tx) => tx.price + acu, 0)}></Currency> */}
								<Currency value={100}></Currency>
							</Table.Cell>
							<Table.Cell>
								<Text small>{item.status}</Text>
							</Table.Cell>
							<Table.Cell>
								<Button size={"xs"} flat>
									Edit
								</Button>
							</Table.Cell>
						</Table.Row>
					))}
				</Table.Body>
				<Table.Pagination
					shadow
					noMargin
					align="center"
					rowsPerPage={5}
					onPageChange={(page) => console.log({ page })}
				/>
			</Table>
		);
	}
};

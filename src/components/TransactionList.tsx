import React, { useEffect } from "react";
import { Button, Container, Spinner, Table, Text } from "@nextui-org/react";
import { trpc } from "../utils/trpc";
import { Currency } from "./format/currency";

interface Props {}

export const TransactionList: React.FC<Props> = ({ ...props }) => {
	const { data, isLoading, error } = trpc.transaction.listMy.useQuery({});

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
					<Table.Column>CREDENTIAL</Table.Column>
					<Table.Column>STATUS</Table.Column>
					<Table.Column>REQUSITION STATUS</Table.Column>
					<Table.Column>AMOUNT</Table.Column>
				</Table.Header>
				<Table.Body css={{ size: "small" }}>
					{data.items.map((item) => (
						<Table.Row key={item.id}>
							<Table.Cell css={{ maxWidth: "8rem" }}>
								<Text small>{item.credentialOffer.credentialType.name}</Text>
							</Table.Cell>
							<Table.Cell css={{ maxWidth: "8rem" }}>
								<Text small>{item.transactionStatus}</Text>
							</Table.Cell>
							<Table.Cell>
								<Text small>{item.transactionRequsitionStatus}</Text>
							</Table.Cell>
							<Table.Cell>
								<Currency value={item.price}></Currency>
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

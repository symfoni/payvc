import React, { useEffect } from "react";
import { Container, Spinner, Table } from "@nextui-org/react";
import { trpc } from "../utils/trpc";

interface Props {}

export const CredentialOfferingList: React.FC<Props> = ({ ...props }) => {
	const { data, isLoading, error, refetch } = trpc.credentialOffer.listMy.useQuery({});

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
				</Table.Header>
				<Table.Body>
					{data.items.map((item) => (
						<Table.Row key={item.id}>
							<Table.Cell>{item.name}</Table.Cell>
							<Table.Cell>{item.price}</Table.Cell>
							<Table.Cell>{item.status}</Table.Cell>
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

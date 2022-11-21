import React from "react";
import { Container, Divider, Grid, Spacer, Text } from "@nextui-org/react";
import { trpc } from "../utils/trpc";
import { Currency } from "./format/currency";

interface Props {}

export const BalanceList: React.FC<Props> = ({ ...props }) => {
	const { data, isLoading, error, refetch } = trpc.balance.listMy.useQuery({});

	if (isLoading) {
		return <div>Loading...</div>;
	}
	if (error) {
		return <div>Error: {error.message}</div>;
	}
	return (
		<Grid.Container>
			{data.items.map((item) => (
				<Container>
					<Currency value={item.amount} currency={item.currency}></Currency>

					{item.logs.map((log) => (
						<Text small css={{ display: "flex" }}>
							{log}
						</Text>
					))}
					<Divider></Divider>
					<Spacer y={1}></Spacer>
				</Container>
			))}
		</Grid.Container>
	);
};

import React from "react";
import { Card, Text, Row } from "@nextui-org/react";
import { BalanceList } from "./BalanceList";

interface Props {}

export const BalancesCard: React.FC<Props> = ({ ...props }) => {
	return (
		<Card /* css={{ mw: "30rem" }} */>
			<Card.Header>
				<Text b>Balances</Text>
			</Card.Header>
			<Card.Divider />
			<Card.Body css={{ py: "$10" }}>
				<BalanceList></BalanceList>
			</Card.Body>
			<Card.Divider />
			<Card.Footer>
				<Row justify="flex-end">
					{/* <Button size="sm" light>
					Cancel
				</Button>
				<Button size="sm">Agree</Button> */}
				</Row>
			</Card.Footer>
		</Card>
	);
};

import React from "react";
import { Card, Text, Row } from "@nextui-org/react";
import { TransactionList } from "./TransactionList";

interface Props {}

export const TransactionCard: React.FC<Props> = ({ ...props }) => {
	return (
		<Card /* css={{ mw: "30rem" }} */>
			<Card.Header>
				<Text b>Transactions</Text>
			</Card.Header>
			<Card.Divider />
			<Card.Body css={{ py: "$10" }}>
				<TransactionList></TransactionList>
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

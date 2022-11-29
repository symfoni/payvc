import React from "react";
import { Card, Text, Row, Button } from "@nextui-org/react";
import { RequsitionList } from "./RequsitionList";

interface Props {}

export const RequisitionsCard: React.FC<Props> = ({ ...props }) => {
	return (
		<Card>
			<Card.Header>
				<Text b>Requisitions</Text>
			</Card.Header>
			<Card.Divider />
			<Card.Body css={{ py: "$10" }}>
				<RequsitionList></RequsitionList>
			</Card.Body>
			<Card.Divider />
			<Card.Footer>
				<Row justify="flex-end">
					<Button as={"a"} size="sm" href="/create-requisition">
						Create requisition
					</Button>
				</Row>
			</Card.Footer>
		</Card>
	);
};

import React from "react";
import { Card, Text, Row, Button } from "@nextui-org/react";
import { CredentialOfferingList } from "./CredentialOfferingList";

interface Props {}

export const CredentialOfferingsCard: React.FC<Props> = ({ ...props }) => {
	return (
		<Card>
			<Card.Header>
				<Text b>Credential offerings</Text>
			</Card.Header>
			<Card.Divider />
			<Card.Body css={{ py: "$10" }}>
				<CredentialOfferingList></CredentialOfferingList>
			</Card.Body>
			<Card.Divider />
			<Card.Footer>
				<Row justify="flex-end">
					<Button as={"a"} size="sm" href="/create-credential-offer">
						Create credential offering
					</Button>
				</Row>
			</Card.Footer>
		</Card>
	);
};

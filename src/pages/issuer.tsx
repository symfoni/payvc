import React from "react";
import { Button, Card, Container, Grid, Row, Spacer, Text } from "@nextui-org/react";
import { CredentialOfferingList } from "../components/CredentialOfferingList";

interface Props {}

export const issuer: React.FC<Props> = ({ ...props }) => {
	return (
		<Grid.Container gap={1}>
			<Grid xs={12} sm={6}>
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
							<Button size="sm">Create credential offering</Button>
						</Row>
					</Card.Footer>
				</Card>
			</Grid>

			<Grid xs={12} sm={6}>
				<Card /* css={{ mw: "30rem" }} */>
					<Card.Header>
						<Text b>Payments</Text>
					</Card.Header>
					<Card.Divider />
					<Card.Body css={{ py: "$10" }}>
						<Text>Some quick example text to build on the card title and make up the bulk of the card's content.</Text>
					</Card.Body>
					<Card.Divider />
					<Card.Footer>
						<Row justify="flex-end">
							<Button size="sm" light>
								Cancel
							</Button>
							<Button size="sm">Agree</Button>
						</Row>
					</Card.Footer>
				</Card>
			</Grid>

			<Grid xs={12} sm={6}>
				<Card /* css={{ mw: "30rem" }} */>
					<Card.Header>
						<Text b>Transactions</Text>
					</Card.Header>
					<Card.Divider />
					<Card.Body css={{ py: "$10" }}>
						<Text>Some quick example text to build on the card title and make up the bulk of the card's content.</Text>
					</Card.Body>
					<Card.Divider />
					<Card.Footer>
						<Row justify="flex-end">
							<Button size="sm" light>
								Cancel
							</Button>
							<Button size="sm">Agree</Button>
						</Row>
					</Card.Footer>
				</Card>
			</Grid>
		</Grid.Container>
	);
};

export default issuer;

import React from "react";
import { Button, Card, Container, Grid, Row, Spacer, Text } from "@nextui-org/react";
import { CredentialOfferingList } from "../components/CredentialOfferingList";
import { PaymentList } from "../components/PaymentList";
import { TransactionList } from "../components/TransactionList";
import { BalanceList } from "../components/BalanceList";
import { TransactionCard } from "../components/TransactionCard";
import { BalancesCard } from "../components/BalancesCard";
import { PaymentsCard } from "../components/PaymentsCard";

interface Props {}

export const issuer: React.FC<Props> = ({ ...props }) => {
	return (
		<Grid.Container gap={1}>
			<Grid xs={12} sm={6}>
				<PaymentsCard></PaymentsCard>
			</Grid>

			<Grid xs={12} sm={6}>
				<TransactionCard></TransactionCard>
			</Grid>

			<Grid xs={12} sm={6}>
				<BalancesCard></BalancesCard>
			</Grid>
		</Grid.Container>
	);
};

export default issuer;

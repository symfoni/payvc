import { Grid } from "@nextui-org/react";
import React from "react";
import { BalancesCard } from "../components/BalancesCard";
import { PaymentsCard } from "../components/PaymentsCard";
import { RequisitionsCard } from "../components/RequisitionsCard";
import { TransactionCard } from "../components/TransactionCard";

interface Props {}

export const issuer: React.FC<Props> = ({ ...props }) => {
	return (
		<Grid.Container gap={1}>
			<Grid xs={12} sm={6}>
				<RequisitionsCard></RequisitionsCard>
			</Grid>

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

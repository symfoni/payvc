import React from "react";
import { Card, Text, Row, Button } from "@nextui-org/react";
import { PaymentList } from "./PaymentList";
import { trpc } from "../utils/trpc";

interface Props {}

export const PaymentsCard: React.FC<Props> = ({ ...props }) => {
	const deposit = trpc.balance.testDeposit.useMutation();
	const withdraw = trpc.balance.testWithdraw.useMutation();
	const { data } = trpc.balance.listMy.useQuery();
	const eurBalance = data ? data.items.find((item) => item.currency === "EUR") : null;
	return (
		<Card /* css={{ mw: "30rem" }} */>
			<Card.Header>
				<Text b>Payments</Text>
			</Card.Header>
			<Card.Divider />
			<Card.Body css={{ py: "$10" }}>
				<PaymentList></PaymentList>
			</Card.Body>
			<Card.Divider />
			<Card.Footer>
				<Row justify="space-evenly">
					<Button size="sm" onPress={() => deposit.mutate({ amount: 10000, currency: "EUR" })}>
						Deposit 100€
					</Button>
					{eurBalance && (
						<Button size="sm" onPress={() => withdraw.mutate({ amount: eurBalance.amount, currency: "EUR" })}>
							Withdraw {eurBalance.amount / 100} €
						</Button>
					)}
				</Row>
			</Card.Footer>
		</Card>
	);
};

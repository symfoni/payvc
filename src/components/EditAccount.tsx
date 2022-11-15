import { Badge, Button, Grid, Input, Spacer, Spinner, Text } from "@nextui-org/react";
import React, { useState } from "react";
import { AccountSelectBusiness } from "../components/AccountSelectBusiness";
import { trpc } from "../utils/trpc";

interface Props {}

export const EditAccount: React.FC<Props> = ({ ...props }) => {
	const { data: account, isLoading, error } = trpc.account.me.useQuery(null, { retry: false });
	const updateUser = trpc.account.update.useMutation();

	const [name, setName] = useState("");

	if (isLoading) {
		return <Spinner>Loading account...</Spinner>;
	}
	if (error) {
		return (
			<Text color="red" className="error-message">
				{error.message}
			</Text>
		);
	}
	if (account) {
		return (
			<Grid.Container gap={2} alignContent="center">
				<Grid xs={12}>
					<Input
						id="account-email"
						name="email"
						placeholder="email..."
						label="Email"
						value={account.email}
						readOnly
					></Input>
				</Grid>
				<Grid xs={12} alignItems="flex-end">
					<Input
						id="account-name"
						name="name"
						label="Name"
						placeholder="Your name..."
						onChange={(e) => setName(e.target.value)}
						value={account.name}
					></Input>
					<Spacer></Spacer>
					{name !== "" && (
						<Button
							size={"md"}
							css={{ width: "3rem" }}
							flat
							onPress={() =>
								updateUser.mutateAsync({
									name,
								})
							}
						>
							Save
						</Button>
					)}
				</Grid>
				<Grid xs={12}>
					<Text size={"$sm"} css={{ margin: "$4" }}>
						Roles
					</Text>
					{account.roles.map((role) => (
						<Badge key={role} css={{ margin: "$4" }}>
							{role}
						</Badge>
					))}
				</Grid>
				<Grid xs={12}>
					<Text size={"$sm"} css={{ margin: "$4" }}>
						Businesses
					</Text>
					{account.businesses.map((business) => (
						<Badge key={business.id} css={{ margin: "$4" }}>
							{business.name}
						</Badge>
					))}
				</Grid>
				<Grid xs={12}>{account.roles.includes("ADMIN") && <AccountSelectBusiness></AccountSelectBusiness>}</Grid>
			</Grid.Container>
		);
	}

	return <div>Unknown error</div>;
};
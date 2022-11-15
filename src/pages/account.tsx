import { Text } from "@nextui-org/react";
import React from "react";
import { EditAccount } from "../components/EditAccount";

interface Props {}

export const account: React.FC<Props> = ({ ...props }) => {
	return (
		<>
			<Text h2>Account</Text>
			<EditAccount></EditAccount>
		</>
	);
};

export default account;

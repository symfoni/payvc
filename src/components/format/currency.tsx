import React from "react";
import { Container, Text } from "@nextui-org/react";

interface Props {
	value: number;
	currency?: string;
}

export const Currency: React.FC<Props> = ({ ...props }) => {
	if (!props.currency) {
		props.currency = "€";
	}
	return (
		<Text>
			{props.value / 100} {props.currency}
		</Text>
	);
};

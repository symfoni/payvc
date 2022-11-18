import { Dropdown, Grid, Spinner } from "@nextui-org/react";
import React from "react";
import { trpc } from "../utils/trpc";

interface Props {
	selectedBusinessId: string;
}

// Very simple, just an admin tool to add a business
export const DropdownMenuSelectBusiness: React.FC<Props> = ({ ...props }) => {
	const { data, isLoading, error } = trpc.business.list.useQuery();
	const updateUser = trpc.user.update.useMutation();

	if (error) {
		throw error;
	}
	if (isLoading || !data || !data.items) {
		<Dropdown.Menu>
			<Dropdown.Item>
				<Spinner>Loading businesses...</Spinner>
			</Dropdown.Item>
		</Dropdown.Menu>;
	}

	return (
		<Dropdown.Menu
			aria-label="Add business to account"
			onAction={(key: string) => updateUser.mutateAsync({ addBusiness: key.toString() })}
		>
			{data.items.map((business) => (
				<Dropdown.Item key={business.id}>{business.name}</Dropdown.Item>
			))}
		</Dropdown.Menu>
	);
};

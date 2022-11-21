import { Dropdown, Grid, Spinner } from "@nextui-org/react";
import React from "react";
import { trpc } from "../utils/trpc";

interface Props {
	selectedBusinessId: string;
}

// Very simple, just an admin tool to add a business
export const DropdownMenuSelectBusiness: React.FC<Props> = ({ ...props }) => {
	const { data, isLoading, error } = trpc.business.list.useQuery({}, {});
	const updateUser = trpc.user.update.useMutation();
	console.log("Data", data);

	if (data && Array.isArray(data.items) && data.items.length > 0) {
		return (
			<Dropdown.Menu
				key={"fjkajhgiajh"}
				aria-label="Add business to account"
				onAction={(key: string) =>
					updateUser.mutateAsync({ addBusiness: key.toString(), selectedBusinessId: key.toString() })
				}
			>
				{data.items.map((business) => (
					<Dropdown.Item key={business.id}>{business.name}</Dropdown.Item>
				))}
			</Dropdown.Menu>
		);
	} else {
		return (
			<Dropdown.Menu key={"gsdgs"}>
				<Dropdown.Item>
					<Spinner>Loading businesses...</Spinner>
				</Dropdown.Item>
			</Dropdown.Menu>
		);
	}
};

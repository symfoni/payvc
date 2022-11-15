import { Dropdown, Grid, Spinner } from "@nextui-org/react";
import React from "react";
import { trpc } from "../utils/trpc";

interface Props {}

// Very simple, just an admin tool to add a business
export const AccountSelectBusiness: React.FC<Props> = ({ ...props }) => {
	const { data: business, isLoading } = trpc.business.list.useQuery();
	const updateUser = trpc.account.update.useMutation();

	return (
		<Grid.Container>
			<Grid xs={12}>
				{isLoading && <Spinner>Loading businesses...</Spinner>}
				{business?.items && (
					<Dropdown>
						<Dropdown.Button flat>Add business</Dropdown.Button>
						<Dropdown.Menu
							aria-label="Add business to account"
							onAction={(key: string) =>
								updateUser.mutateAsync({ addBusiness: key.toString() })
							}
						>
							{business.items.map((business) => (
								<Dropdown.Item key={business.id}>{business.name}</Dropdown.Item>
							))}
						</Dropdown.Menu>
					</Dropdown>
				)}
			</Grid>
		</Grid.Container>
	);
};

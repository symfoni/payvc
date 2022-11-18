import { Button, Dropdown, Grid, Navbar, Text } from "@nextui-org/react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { trpc } from "../utils/trpc";
import { DropdownMenuSelectBusiness } from "./DropdownMenuSelectBusiness";

interface Props {}

export const NavBar: React.FC<Props> = ({ ...props }) => {
	const { data, status } = useSession();

	const MenuLinks = (props: { collapsed?: boolean }) => {
		const { collapsed } = { collapsed: false, ...props };

		const router = useRouter();

		return (
			<>
				{status !== "authenticated" && (
					<Button id={`sign-in${collapsed ? "-collapsed" : ""}`} flat onPress={() => signIn()}>
						Sign in
					</Button>
				)}

				{status === "authenticated" && data.user.selectedBusiness && (
					<>
						<div>
							<Dropdown>
								<Dropdown.Button flat>
									{data.user.selectedBusiness ? data.user.selectedBusiness.name : "Select business"}
								</Dropdown.Button>
								{/* <DropdownMenuSelectBusiness selectedBusinessId={"gdg"}></DropdownMenuSelectBusiness> */}
								<Dropdown.Menu>
									<Dropdown.Item>Business 1</Dropdown.Item>
								</Dropdown.Menu>
							</Dropdown>
						</div>

						<Dropdown>
							<Dropdown.Button flat>{data.user.name}</Dropdown.Button>
							<Dropdown.Menu
								onAction={(key) => {
									console.log(key);
									if (key === "sign-out") {
										signOut();
									}
									if (key === "account") {
										router.push("/account");
									}
								}}
							>
								<Dropdown.Item key="account">Account</Dropdown.Item>
								<Dropdown.Item key="sign-out">Sign out</Dropdown.Item>
							</Dropdown.Menu>
						</Dropdown>
					</>
				)}
			</>
		);
	};
	return (
		<Navbar variant="static" maxWidth={"lg"}>
			<Navbar.Toggle showIn={"xs"} aria-label="toggle navigation" />
			<Navbar.Brand>
				<Link href="/">
					<Text h1>Pay VC</Text>
				</Link>
			</Navbar.Brand>
			<Navbar.Content>
				<Navbar.Collapse>
					<Grid.Container gap={5} justify="center">
						<Grid>
							<MenuLinks collapsed />
						</Grid>
					</Grid.Container>
				</Navbar.Collapse>
			</Navbar.Content>
			<Navbar.Content
				enableCursorHighlight
				activeColor="secondary"
				hideIn="xs"
				variant="underline"
				style={{ textTransform: "uppercase" }}
			>
				<MenuLinks />
			</Navbar.Content>
		</Navbar>
	);
};

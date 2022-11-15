import { Avatar, Button, Dropdown, Grid, Navbar, Text, Link as NextLink } from "@nextui-org/react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import React, { useEffect } from "react";
import { useGlobalState } from "../utils/global-state";

interface Props {}

export const NavBar: React.FC<Props> = ({ ...props }) => {
	// BIG in NEXT UI - https://github.com/nextui-org/nextui/issues/763
	// const MenuLinks = () => (
	// 	<>
	// 		<Navbar.Link href="/account">
	// 			Account
	// 		</Navbar.Link>
	// 	</>
	// );
	const { data, status } = useSession();
	const all = useSession();
	const MenuLinks = (props: { collapsed?: boolean }) => {
		const { collapsed } = { collapsed: false, ...props };

		const { handleSelectBusinessId, selectedBusinessId } = useGlobalState();

		useEffect(() => {
			if (status === "authenticated" && data?.user?.businesses?.length > 1 && !selectedBusinessId) {
				handleSelectBusinessId(data.user.businesses[0].id);
			}
		}, [status]);

		return (
			<>
				{status !== "authenticated" && (
					<Button id={`sign-in${collapsed ? "-collapsed" : ""}`} flat onPress={() => signIn()}>
						Sign in
					</Button>
				)}

				{status === "authenticated" && (
					<>
						{/* <Link href="/account">
							<Avatar css={{ cursor: "pointer" }} squared text={data.user.email}></Avatar>
						</Link> */}

						{/* <Dropdown>
							<Dropdown.Button light>Symfoni AS</Dropdown.Button>
							<Dropdown.Menu aria-label="Static Actions">
								<Dropdown.Item key="new">Business</Dropdown.Item>
								<Dropdown.Item key="copy" withDivider>
									Symfoni AS
								</Dropdown.Item>
								<Dropdown.Item key="edit">Registerenheten i Brønnøysund</Dropdown.Item>
							</Dropdown.Menu>
						</Dropdown> */}
						{/* <Button id={`sign-in${collapsed ? "-collapsed" : ""}`} flat onPress={() => signOut()}>
							Sign out
						</Button> */}

						<Dropdown>
							<Dropdown.Button flat>{data.user.name}</Dropdown.Button>
							<Dropdown.Menu>
								<Dropdown.Item>
									<Link href="/account">Account</Link>
								</Dropdown.Item>
								<Dropdown.Item>
									<Link href={""} onClick={() => signOut()}>
										Sign out
									</Link>
								</Dropdown.Item>
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

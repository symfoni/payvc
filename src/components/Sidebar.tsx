import { Avatar, Button, Container, Grid, Navbar, Spacer, Text } from "@nextui-org/react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import React from "react";

interface Props {}

export const Sidebar: React.FC<Props> = ({ ...props }) => {
	// BIG in NEXT UI - https://github.com/nextui-org/nextui/issues/763
	// const MenuLinks = () => (
	// 	<>
	// 		<Navbar.Link href="/account">
	// 			Account
	// 		</Navbar.Link>
	// 	</>
	// );
	const { data, status } = useSession();
	const MENU_LINKS_SIZE = "sm";
	const MenuLinks = () => (
		<Grid.Container gap={1} justify="center">
			<Grid css={{minWidth: "10rem"}} >
				<Link href={"/issuer"} passHref>
					Issuer
				</Link>
			</Grid>
			<Grid  css={{minWidth: "10rem"}}>
				<Link href="/verifier">Verifier</Link>
			</Grid>
			<Grid  css={{minWidth: "10rem"}}>
				<Link href="/wallet">Wallet</Link>
			</Grid>
			<Grid  css={{minWidth: "10rem"}}>
				<Link href="/settings">Settings</Link>
			</Grid>
		</Grid.Container>
	);
	return <MenuLinks></MenuLinks>;
};

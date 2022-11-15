import { Container, Grid, NextUIProvider, Spacer } from "@nextui-org/react";
import Head from "next/head";
import { ReactNode } from "react";
import { NavBar } from "./NavBar";
import { Sidebar } from "./Sidebar";

type DefaultLayoutProps = { children: ReactNode };

export const DefaultLayout = ({ children }: DefaultLayoutProps) => {
	return (
		<>
			<Head>
				<title>Pay VC</title>
				<link rel="icon" href="/favicon.ico" />
				<meta name="description" content="Pay VC - Credentials made easy" />
			</Head>
			<NextUIProvider>
				<main>
					<Grid.Container>
						<Grid xs={12}>
							<NavBar></NavBar>
						</Grid>
						<Grid xs={12}>
							<Spacer y={2} />
						</Grid>
						{/* Apply space between sidebar and content  on XS, MD. No space on LG */}
						<Grid.Container>
							<Grid xs={12} md={12} lg={2}>
								<Sidebar></Sidebar>
							</Grid>
							<Grid xs={12} md={0} lg={0}>
								<Spacer y={2} />
							</Grid>
							<Grid xs={12} md={12} lg={10}>
								<Container alignItems="center">{children}</Container>
							</Grid>
						</Grid.Container>
					</Grid.Container>
				</main>
			</NextUIProvider>
		</>
	);
};

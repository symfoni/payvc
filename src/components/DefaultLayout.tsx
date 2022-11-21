import { Container, Grid, NextUIProvider, Spacer } from "@nextui-org/react";
import { SessionProvider } from "next-auth/react";
import Head from "next/head";
import { ReactNode } from "react";
import { NavBar } from "./NavBar";
import { Sidebar } from "./Sidebar";

type DefaultLayoutProps = { children: ReactNode; session: any };

export const DefaultLayout = ({ children, session }: DefaultLayoutProps) => {
	return (
		<>
			<Head>
				<title>Pay VC</title>
				<link rel="icon" href="/favicon.ico" />
				<meta name="description" content="Pay VC - Credentials made easy" />
			</Head>
			<NextUIProvider>
				<SessionProvider session={session}>
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
				</SessionProvider>
			</NextUIProvider>
		</>
	);
};

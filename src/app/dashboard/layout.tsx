"use client";
import { Container, Grid, NextUIProvider, Spacer } from "@nextui-org/react";
import { SessionProvider } from "next-auth/react";
import { TRPCProvider } from "../../client/TRPCProvider";
import { NavBar } from "../../components/NavBar";
import { Sidebar } from "../../components/Sidebar";

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html>
			<head>
				<title>Pay VC - Dashboard</title>
				<link rel="icon" href="/favicon.ico" />
				<meta name="description" content="Pay VC - Credentials made easy" />
			</head>
			<body>
				<SessionProvider>
					<TRPCProvider>
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
					</TRPCProvider>
				</SessionProvider>
			</body>
		</html>
	);
}

import type { NextPage } from "next";
import type { AppType, AppProps } from "next/app";
import type { ReactElement, ReactNode } from "react";
import { DefaultLayout } from "../../components/DefaultLayout";
import { trpc } from "../../utils/trpc";
import { SessionProvider } from "next-auth/react";

export type NextPageWithLayout<TProps = Record<string, unknown>, TInitialProps = TProps> = NextPage<
	TProps,
	TInitialProps
> & {
	getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
	Component: NextPageWithLayout;
};

const MyApp = (({ Component, pageProps }: AppPropsWithLayout) => {
	const getLayout =
		Component.getLayout ?? ((page) => <DefaultLayout session={pageProps.session}>{page}</DefaultLayout>);

	return getLayout(<Component {...pageProps} />);
}) as AppType;

export default trpc.withTRPC(MyApp);

import React, { useEffect } from "react";
import { Container } from "@nextui-org/react";
import { getProviders, signIn } from "next-auth/react";

interface Props {
	providers: {
		name: string;
		id: string;
	}[];
}

export const signin: React.FC<Props> = ({ ...props }) => {
	if (!props.providers) {
		console.error("no providers");
		return null;
	}
	return (
		<>
			{Object.values(props.providers).map((provider) => (
				<div key={provider.name}>
					<button onClick={() => signIn(provider.id)} onKeyDown={() => signIn(provider.id)}>
						Sign in with {provider.name}
					</button>
				</div>
			))}
		</>
	);
};

export async function getServerSideProps(context) {
	const providers = await getProviders();
	return {
		props: { providers },
	};
}
export default signin;

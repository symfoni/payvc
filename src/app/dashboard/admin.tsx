import { Container } from "@nextui-org/react";
import { signIn, signOut, useSession } from "next-auth/react";

export default function IndexPage() {
	const { data: session } = useSession();

	return <Container>Hello</Container>;
}

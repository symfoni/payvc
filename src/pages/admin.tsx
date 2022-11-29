import { Container, Text } from "@nextui-org/react";
import { signIn, signOut, useSession } from "next-auth/react";
import { EditAccount } from "../components/EditAccount";
import { trpc } from "../utils/trpc";

export default function IndexPage() {
	const { data: session } = useSession();

	return (
		<Container>
			<Text h3>Admin area</Text>
			<EditAccount></EditAccount>
		</Container>
	);
}

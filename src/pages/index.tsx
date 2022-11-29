import { Container, Text } from "@nextui-org/react";
import { signIn, signOut, useSession } from "next-auth/react";
import { trpc } from "../utils/trpc";

export default function IndexPage() {
	// const utils = trpc.useContext();
	// const {data, error, isLoading} = trpc.user.list.useQuery(
	//   {
	//     limit: 5,
	//   },
	//   {
	//     getPreviousPageParam(lastPage) {
	//       return lastPage.nextCursor;
	//     },
	//   },
	// );

	// const addUser = trpc.user.add.useMutation({
	//   async onSuccess() {
	//     // refetches posts after a post is added
	//     await utils.user.list.invalidate();
	//   },
	// });
	const { data: session } = useSession();

	return (
		<Container>
			<Text h3>Welcome</Text>
			<Text>Sign in to use PayVC demo</Text>
		</Container>
	);
}

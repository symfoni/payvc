import React, { useState } from "react";
import { Button, Container, Dropdown, Input, Spacer, Text } from "@nextui-org/react";
import { trpc } from "../utils/trpc";
import { CredentialType } from "@prisma/client";
import { useRouter } from "next/router";
import { Currency } from "../components/format/currency";

interface Props {}

const CreateRequisition: React.FC<Props> = ({ ...props }) => {
	const router = useRouter();
	const { data: credentialTypes } = trpc.credentialOffer.types.useQuery();
	const update = trpc.requsition.create.useMutation();

	const [credentialType, setCredentialType] = useState<CredentialType>();
	const [requiredCredentialType, setRequiredCredentialType] = useState<CredentialType>();
	const [price, setPrice] = useState(0);
	const [name, setName] = useState("");

	const handleSubmit = async () => {
		if (!credentialType) {
			return new Error("No credential type selected");
		}
		console.log("Creating credential offer", credentialType, requiredCredentialType, price * 100, name);
		await update.mutateAsync({
			credentialTypeId: credentialType.id,
		});
		router.push("/verifier");
	};
	return (
		<Container>
			<Text h2>Create Requisition</Text>

			<Text>Select credential type</Text>
			<Dropdown>
				<Dropdown.Button flat>{credentialType ? credentialType.name : "Select credential type"}</Dropdown.Button>
				<Dropdown.Menu
					key={"todo"}
					aria-label="Add business to account"
					onAction={(key: string) => {
						setCredentialType(credentialTypes.find((t) => t.id === key));
					}}
				>
					{credentialTypes?.map((type) => (
						<Dropdown.Item key={type.id}>{type.name}</Dropdown.Item>
					))}
				</Dropdown.Menu>
			</Dropdown>
			<Spacer></Spacer>

			{credentialType && (
				<Text>
					Agreed priced for this credential will be
					<Currency value={credentialType.price}></Currency>
				</Text>
			)}
			<Spacer></Spacer>
			<Text>Max spend €</Text>
			<Input
				type={"text"}
				value={price}
				onChange={(e) => (isNaN(parseInt(e.target.value)) ? setPrice(0) : setPrice(parseInt(e.target.value)))}
			></Input>
			<Spacer></Spacer>

			<Button onPress={() => handleSubmit()}>Buy</Button>
		</Container>
	);
};
export default CreateRequisition;

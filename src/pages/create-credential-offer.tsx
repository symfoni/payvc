import React, { useState } from "react";
import { Button, Container, Dropdown, Input, Spacer, Text } from "@nextui-org/react";
import { trpc } from "../utils/trpc";
import { CredentialType } from "@prisma/client";
import { useRouter } from "next/router";

interface Props {}

const CreateCredentialOffer: React.FC<Props> = ({ ...props }) => {
	const router = useRouter();
	const { data: credentialTypes } = trpc.credentialOffer.types.useQuery();
	const update = trpc.credentialOffer.create.useMutation();

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
			name,
			price: price * 100,
			credentialTypeId: credentialType.id,
			requirementId: null,
		});
		router.push("/issuer");
	};
	return (
		<Container>
			<Text h2> Create Credential Offer</Text>

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

			<Text>Select required credentials</Text>
			<Dropdown>
				<Dropdown.Button flat>
					{requiredCredentialType ? requiredCredentialType.name : "Select credential type"}
				</Dropdown.Button>
				<Dropdown.Menu
					key={"todo"}
					aria-label="Add business to account"
					onAction={(key: string) => {
						setRequiredCredentialType(credentialTypes.find((t) => t.id === key));
					}}
				>
					{credentialTypes?.map((type) => (
						<Dropdown.Item key={type.id}>{type.name}</Dropdown.Item>
					))}
				</Dropdown.Menu>
			</Dropdown>
			<Spacer></Spacer>

			<Text>Name</Text>
			<Input type={"text"} value={name} onChange={(e) => setName(e.target.value)}></Input>
			<Spacer></Spacer>

			<Text>Price €</Text>
			<Input
				type={"text"}
				value={price}
				onChange={(e) => (isNaN(parseInt(e.target.value)) ? setPrice(0) : setPrice(parseInt(e.target.value)))}
			></Input>
			<Spacer></Spacer>

			<Button onPress={() => handleSubmit()}>Create </Button>
		</Container>
	);
};
export default CreateCredentialOffer;

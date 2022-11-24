import { VerifiableCredential } from "@veramo/core";
import create from "zustand";
import { persist } from "zustand/middleware";
import SignClient from "@walletconnect/sign-client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import { SessionTypes, ISignClientEvents } from "@walletconnect/types";

export interface GlobalState {
	initialized: boolean;
	client: SignClient | undefined;
	session: SessionTypes.Struct | undefined;
	init: (name: string, description: string, url: string) => void;
	connect: () => void;
}
export const useWalletConnect = create<GlobalState>()(
	persist(
		(set, get) => ({
			initialized: false,
			client: undefined,
			session: undefined,
			init: async (name: string, description: string, url: string) => {
				if (get().initialized) {
					return;
				}
				const client = await SignClient.init({
					projectId: "fbc3e41dc977f569fed85715965fbd31",
					metadata: {
						name,
						description,
						url,
						icons: ["https://walletconnect.com/walletconnect-logo.png"],
					},
				});
				if (client.session.length) {
					const lastKeyIndex = client.session.keys.length - 1;
					const _session = client.session.get(client.session.keys[lastKeyIndex]);
					console.log("RESTORED SESSION:", _session);
					return set(() => {
						return { client: client, initialized: true, session: _session };
					});
				}
				return set(() => {
					return { client: client, initialized: true };
				});
			},
			connect: async () => {
				let session = undefined;
				try {
					const client = get().client;
					if (!client) {
						throw new Error("Client not initialized");
					}

					const { uri, approval } = await client.connect({
						// Provide the namespaces and chains (e.g. `eip155` for EVM-based chains) we want to use in this session.
						requiredNamespaces: {
							eip155: {
								methods: ["eth_sign", "present_credential", "receive_credential"],
								chains: ["eip155:5"],
								events: [],
							},
						},
					});

					if (uri) {
						QRCodeModal.open(uri, () => {
							console.log("EVENT", "QR Code Modal closed");
						});
					}
					session = await approval();
				} catch (error) {
					console.error(error);
				} finally {
					QRCodeModal.close();
				}
				return set((state) => {
					return { session: session };
				});
			},
		}),
		{
			name: "wallet-connect-store",
			partialize: (state) => ({ session: state.session }),
		},
	),
);

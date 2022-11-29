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
	init: (name: string, description: string, url: string, reConnect?: boolean) => void;
	connect: () => void;
	disconnect: () => void;
	request: <T>(method: string, params: any[]) => Promise<T>;
}
export const useWalletConnect = create<GlobalState>()(
	persist(
		(set, get) => ({
			initialized: false,
			client: undefined,
			session: undefined,
			init: async (name: string, description: string, url: string, reConnect?: boolean) => {
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
				if (reConnect && client.session.length) {
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
			disconnect: async () => {
				const client = get().client;
				const session = get().session;
				await client.disconnect({
					reason: {
						code: 0,
						message: "Disconnected from client",
					},
					topic: session.topic,
				});
				return set((state) => {
					return { session: undefined };
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
								methods: ["request_credential", "present_credential", "receive_credential"],
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
			request: async <T>(method: string, params: any[]) => {
				const client = get().client;
				if (!client) {
					throw new Error("Client not initialized");
				}
				const session = get().session;
				if (!session) {
					throw new Error("Session not initialized");
				}
				let result: T | undefined = undefined;
				let valid = false;
				try {
					result = await client.request<T>({
						topic: session!.topic,
						chainId: "eip155:5",
						request: {
							method,
							params,
						},
					});
					valid = true;
				} catch (e) {
					valid = false;
				}
				if (!result) {
					throw Error("No vp returned");
				}
				return result;
			},
		}),
		{
			name: "wc-store",
			partialize: (state) => ({}),
		},
	),
);

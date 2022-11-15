import create from "zustand";
import { persist } from "zustand/middleware";

export interface GlobalState {
	selectedBusinessId?: string;
	handleSelectBusinessId: (businessId: string) => void;
}

export const useGlobalState = create<GlobalState>()(
	persist(
		(set) => ({
			selectedBusinessId: undefined,
			handleSelectBusinessId: (businessId: string) =>
				set(({ selectedBusinessId }) => {
					return { selectedBusinessId };
				}),
		}),
		{
			name: "payvc-global-state", // unique name
			partialize: (state) => ({ selectedBusinessId: state.selectedBusinessId }), // pick a subset of state
		},
	),
);

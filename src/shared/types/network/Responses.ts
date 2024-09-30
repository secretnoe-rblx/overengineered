declare global {
	type TouchControlInfo = Readonly<Record<string, { readonly pos: SerializedVector2 }>>;
	type SlotMeta = {
		readonly name: string;
		readonly color: SerializedColor;
		readonly blocks: number;
		readonly size: number;
		readonly touchControls: TouchControlInfo;
		readonly index: number;
		readonly saveTime: number | undefined;
	};

	type LoadSlotResponse = Response<{
		readonly isEmpty: boolean;
	}>;

	type FetchSlotsResponse = Response<{
		readonly purchasedSlots: number;
		readonly slots: readonly SlotMeta[];
	}>;

	type PlayerDataResponse = {
		readonly purchasedSlots: number | undefined;
		readonly settings: Partial<PlayerConfig> | undefined;
		readonly slots: readonly SlotMeta[] | undefined;
		readonly data: PlayerData | undefined;
		readonly imported_slots: readonly SlotMeta[] | undefined;
	};

	type SaveSlotResponse = Response<{ readonly blocks: number | undefined; readonly size: number | undefined }>;
}

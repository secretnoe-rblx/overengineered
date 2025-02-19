import {
	BidirectionalRemoteEvent,
	C2S2CRemoteFunction,
	C2SRemoteEvent,
	PERemoteEventMiddlewares,
	S2C2SRemoteFunction,
	S2CRemoteEvent,
} from "engine/shared/event/PERemoteEvent";

declare global {
	type BuildResponse = Response<{ readonly model: BlockModel }>;
	type MultiBuildResponse = Response<{ readonly models: readonly BlockModel[] }>;

	type PlaceBlockRequest = MakePartial<BlockDataBase, "uuid" | "config"> & {
		readonly location: CFrame;
	};
	type PlaceBlocksRequest = {
		readonly plot: PlotModel;
		readonly blocks: readonly PlaceBlockRequest[];
	};
	type DeleteBlocksRequest = {
		readonly plot: PlotModel;
		readonly blocks: readonly BlockModel[] | "all";
	};
	type EditBlockRequest = {
		readonly instance: BlockModel;
		readonly position: CFrame | undefined;
		readonly scale: Vector3 | undefined;
	};
	type EditBlocksRequest = {
		readonly plot: PlotModel;
		readonly blocks: readonly EditBlockRequest[];
	};

	type LogicConnectRequest = {
		readonly plot: PlotModel;
		readonly outputBlock: BlockModel;
		readonly outputConnection: BlockConnectionName;
		readonly inputBlock: BlockModel;
		readonly inputConnection: BlockConnectionName;
	};
	type LogicDisconnectRequest = {
		readonly plot: PlotModel;
		readonly inputBlock: BlockModel;
		readonly inputConnection: BlockConnectionName;
	};

	type PaintBlocksRequest = {
		readonly plot: PlotModel;
		readonly blocks: readonly BlockModel[] | "all";
		readonly color?: Color3;
		readonly material?: Enum.Material;
	};
	type NormalizeRootpartsRequest = {
		readonly parts: BasePart[];
	};
	type EnvironmentBlacklistRequest = {
		readonly isBanned: boolean;
		readonly plot: BasePart;
	};
	type ConfigUpdateRequest = {
		readonly plot: PlotModel;
		readonly configs: readonly {
			readonly block: BlockModel;
			readonly scfg: string;
		}[];
	};
	type ConfigResetRequest = {
		readonly plot: PlotModel;
		readonly blocks: readonly BlockModel[];
	};

	type PlayerUpdateSettingsRequest = PartialThrough<PlayerConfig>;
	type PlayerUpdateDataRequest = {
		readonly key: keyof PlayerData;
		readonly value: PlayerData[keyof PlayerData];
	};
	type PlayerSaveSlotRequest = {
		readonly index: number;
		readonly name?: string;
		readonly color?: SerializedColor;
		readonly touchControls?: TouchControlInfo;
		readonly save: boolean;
	};
	type PlayerDeleteSlotRequest = {
		readonly index: number;
	};
	type PlayerLoadSlotRequest = {
		readonly index: number;
	};
	type PlayerLoadAdminSlotRequest = PlayerLoadSlotRequest & {
		readonly userid: number;
		readonly imported: boolean;
	};
}

export namespace Remotes {
	export interface AdminSendMessageArgs {
		readonly text: string;
		readonly color?: Color3;
		readonly duration?: number;
	}
	export interface ServerRestartProgressArgs {
		readonly atmosphereColor: number;
	}
}

export interface PlayerInitResponse {
	readonly remotes: Instance;
	readonly data: {
		readonly purchasedSlots: number | undefined;
		readonly settings: Partial<PlayerConfig> | undefined;
		readonly slots: readonly SlotMeta[] | undefined;
		readonly data: PlayerData | undefined;
	};
}

export const CustomRemotes = {
	initPlayer: new C2S2CRemoteFunction<undefined, Response<PlayerInitResponse>>("player_init"),
	adminDataFor: new C2S2CRemoteFunction<number, Response<PlayerInitResponse>>("player_init_admin"),

	physics: {
		normalizeRootparts: new S2CRemoteEvent<NormalizeRootpartsRequest>("ph_normalize_rootparts"),
	},
	slots: {
		loadAsAdmin: new C2S2CRemoteFunction<PlayerLoadAdminSlotRequest, LoadSlotResponse>("rs_loadadm"),
	},
	gui: {
		settings: {
			permissions: {
				isolationMode: new C2SRemoteEvent<boolean>("gui_settings_isolation"),
				updateBlacklist: new C2SRemoteEvent<readonly number[]>("gui_settings_updateblacklist"),
			},
		},
	},
	modes: {
		set: new C2S2CRemoteFunction<PlayModes>("md_set").addMiddleware(PERemoteEventMiddlewares.rateLimiter(30, 60)),
		setOnClient: new S2C2SRemoteFunction<PlayModes | undefined>("md_setc"),
		ride: {
			teleportOnSeat: new C2SRemoteEvent("mdr_seat"),
		},
	},
	admin: {
		sendMessage: new BidirectionalRemoteEvent<Remotes.AdminSendMessageArgs>("adm_sendmessage"),
		restart: new C2SRemoteEvent<boolean>("adm_restart"),
	},
	restartProgress: new S2CRemoteEvent<Remotes.ServerRestartProgressArgs>("restartprogress"),
} as const;

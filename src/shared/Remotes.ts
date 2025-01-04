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

export const CustomRemotes = {
	building: {
		placeBlocks: new C2S2CRemoteFunction<PlaceBlocksRequest, MultiBuildResponse>("rb_place"),
		deleteBlocks: new C2S2CRemoteFunction<DeleteBlocksRequest>("rb_delete"),
		editBlocks: new C2S2CRemoteFunction<EditBlocksRequest>("rb_edit"),
		logicConnect: new C2S2CRemoteFunction<LogicConnectRequest>("rb_lconnect"),
		logicDisconnect: new C2S2CRemoteFunction<LogicDisconnectRequest>("rb_ldisconnect"),
		paintBlocks: new C2S2CRemoteFunction<PaintBlocksRequest>("rb_paint"),
		updateConfig: new C2S2CRemoteFunction<ConfigUpdateRequest>("rb_updatecfg"),
		resetConfig: new C2S2CRemoteFunction<ConfigResetRequest>("rb_resetcfg"),
	},
	physics: {
		normalizeRootparts: new S2CRemoteEvent<NormalizeRootpartsRequest>("ph_normalize_rootparts"),
	},
	slots: {
		load: new C2S2CRemoteFunction<PlayerLoadSlotRequest, LoadSlotResponse>("rs_load"),
		loadImported: new C2S2CRemoteFunction<PlayerLoadSlotRequest, LoadSlotResponse>("rs_loadi"),
		loadAsAdmin: new C2S2CRemoteFunction<PlayerLoadAdminSlotRequest, LoadSlotResponse>("rs_loadadm"),
		save: new C2S2CRemoteFunction<PlayerSaveSlotRequest, SaveSlotResponse>("rs_save"),
	},
	player: {
		loaded: new C2SRemoteEvent<undefined>("client_initialized"),
		updateSettings: new C2SRemoteEvent<PlayerUpdateSettingsRequest>("pl_updsettings"),
		updateData: new C2SRemoteEvent<PlayerUpdateDataRequest>("pl_upddata"),
		fetchData: new C2S2CRemoteFunction<undefined, Response<PlayerDataResponse>>("pl_fetchdata"),
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

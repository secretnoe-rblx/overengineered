import { HttpService, Players, Workspace } from "@rbxts/services";
import { LoadingController } from "client/controller/LoadingController";
import { LogControl } from "client/gui/static/LogControl";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { JSON } from "engine/shared/fixes/Json";
import { Objects } from "engine/shared/fixes/Objects";
import { Colors } from "shared/Colors";
import { Config } from "shared/config/Config";
import { PlayerConfigDefinition } from "shared/config/PlayerConfig";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { CustomRemotes } from "shared/Remotes";
import { SlotsMeta } from "shared/SlotsMeta";
import type { GameHostBuilder } from "engine/shared/GameHostBuilder";

type NonNullableFields<T> = {
	[P in keyof T]-?: NonNullable<T[P]>;
};
type PD = NonNullableFields<PlayerDataResponse> & {
	readonly settings: NonNullableFields<PlayerDataResponse["settings"]>;
};

export namespace PlayerDataInitializer {
	export function initialize(host: GameHostBuilder): void {
		host.services.registerSingletonFunc(() => new PlayerDataStorage(Objects.awaitThrow(fetchPlayerData())));
	}

	function waitForLoadableData(): void {
		while (!Workspace.HasTag("data_loadable")) {
			task.wait();
		}
	}
	async function fetchPlayerData(): Promise<PD> {
		waitForLoadableData();

		const d = CustomRemotes.player.fetchData.send();
		if (!d.success) throw d.message;

		const data: PD = {
			purchasedSlots: d.purchasedSlots ?? 0,
			settings: Config.addDefaults(d.settings ?? {}, PlayerConfigDefinition),
			slots: SlotsMeta.getAll(
				d.slots ?? [],
				GameDefinitions.getMaxSlots(Players.LocalPlayer, d.purchasedSlots ?? 0),
			),
			imported_slots: d.imported_slots ?? [],
			data: d.data ?? {},
		};

		$log("Configuration loaded: " + HttpService.JSONEncode(data.settings));
		return data;
	}
}

export class PlayerDataStorage {
	private readonly _data;
	readonly data;

	readonly config;
	readonly slots;
	readonly imported_slots;

	readonly loadedSlot = new ObservableValue<number | undefined>(undefined);

	constructor(data: PD) {
		this._data = new ObservableValue(data);
		this.data = this._data.asReadonly();

		this.config = this.data.createBased((x) => x.settings);
		this.slots = this.data.createBased((x) => x.slots);
		this.imported_slots = this.data.createBased((x) => x.imported_slots);
	}

	async sendPlayerConfigValue<TKey extends keyof PlayerConfig>(key: TKey, value: PlayerConfig[TKey] & defined) {
		$log(`Setting player config value ${key} to ${JSON.serialize(value)}`);
		CustomRemotes.player.updateSettings.send({ key, value });

		this._data.set({
			...this.data.get(),
			settings: {
				...this.data.get().settings,
				[key]: value,
			},
		});
	}
	async sendPlayerDataValue<TKey extends keyof PlayerData>(key: TKey, value: PlayerData[TKey] & defined) {
		$log(`Setting player data value ${key} to ${JSON.serialize(value)}`);
		CustomRemotes.player.updateData.send({ key, value });

		this._data.set({
			...this.data.get(),
			settings: {
				...this.data.get().settings,
				[key]: value,
			},
		});
	}

	async sendPlayerSlot(req: PlayerSaveSlotRequest) {
		$log("Setting slot " + req.index + " to " + HttpService.JSONEncode(req));

		let d = this.data.get();
		if (d) {
			this._data.set({
				...d,
				slots: SlotsMeta.withSlot(d.slots, req.index, req),
			});
		}

		const response = CustomRemotes.slots.save.send(req);
		if (!response.success) {
			$err(response.message);
			return;
		}

		d = this.data.get();
		if (d) {
			this._data.set({
				...this.data.get()!,
				slots: SlotsMeta.withSlot(d.slots, req.index, {
					blocks: response.blocks ?? SlotsMeta.get(d.slots, req.index).blocks,
					size: response.size ?? SlotsMeta.get(d.slots, req.index).size,
				}),
			});
		}
	}

	async loadPlayerSlot(index: number, isImported: boolean) {
		$log("Loading slot " + index);
		LoadingController.show("Loading a slot");

		try {
			const response = CustomRemotes.slots[isImported ? "loadImported" : "load"].send({ index });
			if (response.success && !response.isEmpty) {
				this.loadedSlot.set(index);
			} else if (!response.success) {
				LogControl.instance.addLine("Error while loading a slot", Colors.red);
				$warn(response.message);
			}

			return response;
		} finally {
			LoadingController.hide();
		}
	}
}

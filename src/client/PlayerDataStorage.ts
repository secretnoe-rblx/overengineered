import { HttpService, Workspace } from "@rbxts/services";
import { LoadingController } from "client/controller/LoadingController";
import { LogControl } from "client/gui/static/LogControl";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { JSON } from "engine/shared/fixes/Json";
import { Objects } from "engine/shared/fixes/Objects";
import { Strings } from "engine/shared/fixes/String.propmacro";
import { Colors } from "shared/Colors";
import { Config } from "shared/config/Config";
import { PlayerConfigDefinition } from "shared/config/PlayerConfig";
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
			slots: d.slots ?? Objects.empty,
			data: d.data ?? {},
		};

		$log(
			`Configuration loaded (v${data.settings["version" as never] ?? "?"}): ${HttpService.JSONEncode(data.settings)}`,
		);
		return data;
	}
}

export class PlayerDataStorage {
	private readonly _data;
	readonly data;

	readonly config;
	readonly slots;

	readonly loadedSlot = new ObservableValue<number | undefined>(undefined);

	constructor(data: PD) {
		this._data = new ObservableValue(data);
		this.data = this._data.asReadonly();

		this.config = new ObservableValue(data.settings);
		this.data.subscribe((d) => this.config.set(d.settings));

		const slots = new ObservableValue<{ readonly [k in number]: SlotMeta }>(Objects.empty);
		this.data.subscribe((data) => slots.set(SlotsMeta.toTable(data.slots)), true);
		this.slots = slots;
	}

	async sendPlayerConfig(config: PartialThrough<PlayerConfig>) {
		$log(`Updating player config: ${Strings.pretty(config)}`);
		CustomRemotes.player.updateSettings.send(config);

		this._data.set({
			...this.data.get(),
			settings: Objects.deepCombine(this.data.get().settings, config),
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
				}),
			});
		}
	}
	async deletePlayerSlot(req: PlayerDeleteSlotRequest) {
		$log("Deleting slot " + req.index);

		const copy = { ...this.slots.get() };
		delete copy[req.index];
		this.slots.set(copy);

		const response = CustomRemotes.slots.delete.send(req);
		if (!response.success) {
			$err(response.message);
			return;
		}
	}

	async loadPlayerSlot(index: number, message?: string) {
		$log(`Loading slot ${index}`);

		LoadingController.run(message ?? `Loading slot ${index}`, () => {
			const response = CustomRemotes.slots.load.send({ index });
			if (response.success && !response.isEmpty) {
				this.loadedSlot.set(index);
			} else if (!response.success) {
				LogControl.instance.addLine("Error while loading a slot", Colors.red);
				$warn(response.message);
			}

			return response;
		});
	}
}

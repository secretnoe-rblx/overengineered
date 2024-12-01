import { GuiService, StarterGui } from "@rbxts/services";
import { Popup } from "client/gui/Popup";
import { BuildingMode } from "client/modes/build/BuildingMode";
import { requestMode } from "client/modes/PlayModeRequest";
import { RideMode } from "client/modes/ride/RideMode";
import { LocalPlayer } from "engine/client/LocalPlayer";
import { HostedService } from "engine/shared/di/HostedService";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { Objects } from "engine/shared/fixes/Objects";
import { CustomRemotes } from "shared/Remotes";
import { SlotsMeta } from "shared/SlotsMeta";
import type { PlayerDataStorage } from "client/PlayerDataStorage";
import type { GameHostBuilder } from "engine/shared/GameHostBuilder";

@injectable
export class PlayModeController extends HostedService {
	private readonly playmode = new ObservableValue<PlayModes | undefined>(undefined);
	private readonly modes;

	static initialize(host: GameHostBuilder) {
		host.services.registerSingletonClass(BuildingMode);
		host.services.registerSingletonClass(RideMode);
		host.services.registerService(PlayModeController);
	}
	constructor(@inject build: BuildingMode, @inject ride: RideMode, @inject playerData: PlayerDataStorage) {
		super();

		GuiService.SetGameplayPausedNotificationEnabled(false);
		StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false);

		CustomRemotes.modes.setOnClient.subscribe((mode) => {
			this.playmode.set(mode);
			return { success: true };
		});

		this.modes = {
			build,
			ride,
		} as const;

		for (const [_, mode] of pairs(this.modes)) {
			mode.disable();
		}

		const controls = LocalPlayer.getPlayerModule().GetControls();
		this.event.subscribe(Popup.onAnyShow, () => {
			controls.Disable();

			const active = this.playmode.get();
			if (active) this.modes[active].disable();
		});
		this.event.subscribe(Popup.onAllHide, () => {
			controls.Enable();

			const active = this.playmode.get();
			if (active) this.modes[active].enable();
		});

		this.event.subscribeObservable(this.playmode, (mode, prev) => {
			this.callImmediateSetMode(mode, prev);
			this.setMode(mode, prev);
		});
		this.event.subscribe(LocalPlayer.diedEvent, () => this.setMode(undefined, this.playmode.get()));

		this.setMode(this.playmode.get(), undefined);

		this.onEnable(() => {
			spawn(() => {
				requestMode("build");

				if (playerData.config.get().autoLoad) {
					Objects.awaitThrow(
						playerData.loadPlayerSlot(SlotsMeta.quitSlotIndex, false, "Loading the autosave"),
					);
				}
			});
			LocalPlayer.spawnEvent.Connect(() => spawn(() => requestMode("build")));
		});
	}

	private callImmediateSetMode(mode: PlayModes | undefined, prev: PlayModes | undefined) {
		if (prev) {
			this.modes[prev].onImmediateSwitchToNext(mode);
		}

		if (mode) {
			this.modes[mode].onImmediateSwitchFromPrev(prev);
		}
	}
	private setMode(mode: PlayModes | undefined, prev: PlayModes | undefined) {
		if (mode === prev) return;

		if (prev) {
			this.modes[prev].onSwitchToNext(mode);
			this.modes[prev].disable();
		}
		if (mode) {
			this.modes[mode].onSwitchFromPrev(prev);
			this.modes[mode].enable();
		}
	}
}

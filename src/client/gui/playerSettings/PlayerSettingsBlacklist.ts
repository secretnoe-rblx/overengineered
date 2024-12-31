import { PlayerSettingBlacklist } from "client/gui/playerSettings/controls/PlayerSettingBlacklist";
import { PlayerSettingsList } from "client/gui/playerSettings/PlayerSettingsList";
import { Objects } from "engine/shared/fixes/Objects";
import { CustomRemotes } from "shared/Remotes";
import type {
	PlayerSettingsListDefinition,
	PlayerSettingsTemplateList,
} from "client/gui/playerSettings/PlayerSettingsList";
import type { ObservableValue } from "engine/shared/event/ObservableValue";
import type { SharedPlot } from "shared/building/SharedPlot";

@injectable
export class PlayerSettingsBlacklist extends PlayerSettingsList {
	constructor(
		gui: PlayerSettingsListDefinition & PlayerSettingsTemplateList,
		value: ObservableValue<PlayerConfig>,
		@inject plot: SharedPlot,
	) {
		super(gui);

		const blacklistedPlayers = this.event.addObservable(plot.blacklistedPlayers.withDefaultDC(() => Objects.empty));

		const isolationMode = this.addToggle("Isolation mode") //
			.initToObservable(plot.isolationMode)
			.setDescription("Blacklist everyone");
		this.event.subscribe(isolationMode.v.submitted, (value) =>
			CustomRemotes.gui.settings.permissions.isolationMode.send(value),
		);

		const blacklist = this.parent(new PlayerSettingBlacklist(this.clone(gui.Blacklist), "Blacklist")) //
			.initToObservable(blacklistedPlayers);
		this.event.subscribe(blacklist.v.submitted, (players) =>
			CustomRemotes.gui.settings.permissions.updateBlacklist.send(players),
		);

		this.event.subscribeObservable(plot.isolationMode, (value) => blacklist.setVisibleAndEnabled(!value), true);
	}
}

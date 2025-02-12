import { ConfigControlBlacklist } from "client/gui/configControls/ConfigControlBlacklist";
import { ConfigControlList } from "client/gui/configControls/ConfigControlsList";
import { Objects } from "engine/shared/fixes/Objects";
import { CustomRemotes } from "shared/Remotes";
import type {
	ConfigControlListDefinition,
	ConfigControlTemplateList,
} from "client/gui/configControls/ConfigControlsList";
import type { ObservableValue } from "engine/shared/event/ObservableValue";
import type { SharedPlot } from "shared/building/SharedPlot";

@injectable
export class PlayerSettingsBlacklist extends ConfigControlList {
	constructor(
		gui: ConfigControlListDefinition & ConfigControlTemplateList,
		value: ObservableValue<PlayerConfig>,
		@inject plot: SharedPlot,
	) {
		super(gui);

		const isolationMode = this.event.addObservable(plot.isolationMode.fWithDefault(false));
		const blacklistedPlayers = this.event.addObservable(plot.blacklistedPlayers.fWithDefault(Objects.empty));

		const isolation = this.addToggle("Isolation mode") //
			.initToObservable(isolationMode)
			.setDescription("Blacklist everyone");
		isolation.submittedMulti((value) => CustomRemotes.gui.settings.permissions.isolationMode.send(value ?? false));

		const blacklist = this.parent(new ConfigControlBlacklist(this.clone(gui.Blacklist), "Blacklist")) //
			.initToObservable(blacklistedPlayers);
		blacklist.submittedMulti((players) =>
			CustomRemotes.gui.settings.permissions.updateBlacklist.send(players ?? []),
		);

		this.event.subscribeObservable(plot.isolationMode, (value) => blacklist.setVisibleAndEnabled(!value), true);
	}
}

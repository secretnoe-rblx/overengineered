import { PlayerSettingsList } from "client/gui/playerSettings/PlayerSettingsList";
import { ArgsSignal } from "engine/shared/event/Signal";
import { Objects } from "engine/shared/fixes/Objects";
import type {
	PlayerSettingsListDefinition,
	PlayerSettingsTemplateList,
} from "client/gui/playerSettings/PlayerSettingsList";
import type { ObservableValue } from "engine/shared/event/ObservableValue";
import type { PartialThrough } from "shared/building/BuildingDiffer";

export class PlayerSettingsInterface extends PlayerSettingsList {
	readonly submitted;

	constructor(gui: PlayerSettingsListDefinition & PlayerSettingsTemplateList, value: ObservableValue<PlayerConfig>) {
		super(gui);

		const submitted = new ArgsSignal<[PlayerConfig]>();
		this.submitted = submitted.asReadonly();

		const submit = (values: PartialThrough<PlayerConfig>) => {
			const p = Objects.deepCombine(value.get(), values);
			value.set(p);
			submitted.Fire(p);
		};

		const startv = value.get();

		this.addCategory("Interface");
		{
			this.addSlider("UI Scale", { min: 0.5, max: 1.5, inputStep: 0.01 }) //
				.init(startv, submit, ["uiScale"]);
		}

		this.addCategory("Camera");
		{
			this.addSlider("Field of View", { min: 1, max: 120, inputStep: 1 }) //
				.init(startv, submit, ["betterCamera", "fov"], "value");

			this.addToggle("Improved") //
				.init(startv, submit, ["betterCamera", "improved"]);

			this.addToggle("Strict Follow") //
				.init(startv, submit, ["betterCamera", "strictFollow"])
				.setTooltipText("Strictly follow the player");

			this.addToggle("Player Centered") //
				.init(startv, submit, ["betterCamera", "playerCentered"])
				.setTooltipText("Center camera at the player instead of the vehicle");
		}

		this.addCategory("Beacons") //
			.setTooltipText("On-screen indicators");
		{
			this.addToggle("Players") //
				.init(startv, submit, ["beacons", "players"]);
			this.addToggle("Plot") //
				.init(startv, submit, ["beacons", "plot"]);
		}
	}
}

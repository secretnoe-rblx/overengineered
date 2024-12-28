import { PlayerSettingsList } from "client/gui/playerSettings/PlayerSettingsList";
import type {
	PlayerSettingsListDefinition,
	PlayerSettingsTemplateList,
} from "client/gui/playerSettings/PlayerSettingsList";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

export class PlayerSettingsEnvironment extends PlayerSettingsList {
	constructor(gui: PlayerSettingsListDefinition & PlayerSettingsTemplateList, value: ObservableValue<PlayerConfig>) {
		super(gui);

		this.addCategory("Day cycle");
		{
			this.addToggle("Automatic") //
				.setDescription("Automatic time, synced with all players. 20 minutes per in-game day.")
				.init(value, ["dayCycle", "automatic"]);

			const manual = this.addSlider("Manual", { min: 0, max: 24, inputStep: 0.1 }) //
				.setDescription("Manual time, hours.")
				.init(value, ["dayCycle", "manual"]);

			this.event
				.createBasedObservable(value, (c) => c.dayCycle)
				.subscribe(({ automatic }) => manual.setVisibleAndEnabled(!automatic), true);
		}

		this.addCategory("Terrain");
		{
			this.addDropdown("Type", {
				Classic: {},
				Triangle: {},
				Flat: {},
				Water: {},
				Lava: {},
			}) //
				.init(value, ["terrain", "kind"]);

			this.addSlider("Load distance", { min: 1, max: 96, step: 1 }) //
				.init(value, ["terrain", "loadDistance"]);

			const triangleResolution = this.addSlider("Resolution", { min: 1, max: 16, step: 1 }) //
				.init(value, ["terrain", "resolution"]);
			const triangleWater = this.addToggle("Water") //
				.init(value, ["terrain", "water"]);
			const triangleSandBelowSeaLevel = this.addToggle("Sand below sea level") //
				.init(value, ["terrain", "triangleAddSandBelowSeaLevel"]);

			const classicFoliage = this.addToggle("Foliage") //
				.init(value, ["terrain", "foliage"]);

			const terrainSnowOnly = this.addToggle("Snow only") //
				.init(value, ["terrain", "snowOnly"]);

			this.event
				.createBasedObservable(value, (c) => c.terrain)
				.subscribe(({ kind, snowOnly }) => {
					triangleResolution.setVisibleAndEnabled(kind === "Triangle");
					triangleWater.setVisibleAndEnabled(kind === "Triangle");
					triangleSandBelowSeaLevel.setVisibleAndEnabled(kind === "Triangle" && !snowOnly);

					classicFoliage.setVisibleAndEnabled(kind === "Classic");

					terrainSnowOnly.setVisibleAndEnabled(kind !== "Water" && kind !== "Lava");
				}, true);
		}
	}
}

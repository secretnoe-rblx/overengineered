import { RobloxUnit } from "engine/shared/RobloxUnit";
import { GameDefinitions } from "shared/data/GameDefinitions";

export namespace GameEnvironment {
	export const EarthGravity: number = GameDefinitions.APRIL_FOOLS ? 60 : 180;
	export const EarthAirDensity = 0.05;

	export const ZeroGravityHeight: number = GameDefinitions.APRIL_FOOLS ? RobloxUnit.Meters_To_Studs(100) : 30000;
	export const ZeroAirHeight = 20000;

	export const MinSoundValue = 0.01;
}

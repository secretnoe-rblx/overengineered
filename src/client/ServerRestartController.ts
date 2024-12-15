import { ReplicatedFirst } from "@rbxts/services";
import { CustomRemotes } from "shared/Remotes";

type t = {
	["3D Atmosphere"]: {
		Customize: {
			AltitudeOffset: NumberValue;
			AtmosphereColor: Color3Value;
			AtmosphereTransparency: NumberValue;
		};
	};
};
const atmo = (ReplicatedFirst as unknown as t)["3D Atmosphere"];
const atmoStartColor = atmo.Customize.AtmosphereColor.Value;
const atmoEndColor = Color3.fromRGB(200, 25, 25);

CustomRemotes.restartProgress.invoked.Connect(({ atmosphereColor }) => {
	atmo.Customize.AtmosphereColor.Value = atmoStartColor.Lerp(atmoEndColor, atmosphereColor);
	atmo.Customize.AtmosphereTransparency.Value = 1 - atmosphereColor;
});

export namespace ServerRestartController {
	// empty method to trigger subscription
	export function initialize() {}

	export function sendToServer(restart = true) {
		CustomRemotes.admin.restart.send(restart);
	}
}

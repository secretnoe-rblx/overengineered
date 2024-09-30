import { RunService, Workspace } from "@rbxts/services";
import { LocalPlayer } from "client/controller/LocalPlayer";
import { HostedService } from "engine/shared/di/HostedService";
import { Physics } from "shared/Physics";

export class GameEnvironmentController extends HostedService {
	constructor() {
		super();

		this.event.subscribe(RunService.Heartbeat, () => {
			const playerHeight = LocalPlayer.getPlayerRelativeHeight();

			Workspace.AirDensity = Physics.GetAirDensityOnHeight(playerHeight);
			Workspace.Gravity = Physics.GetGravityOnHeight(playerHeight);
		});
	}
}

import { RunService, Workspace } from "@rbxts/services";
import { LocalPlayerController } from "client/controller/LocalPlayerController";
import { HostedService } from "engine/shared/di/HostedService";
import { Physics } from "shared/Physics";

export class GameEnvironmentController extends HostedService {
	constructor() {
		super();

		this.event.subscribe(RunService.Heartbeat, () => {
			const playerHeight = LocalPlayerController.getPlayerRelativeHeight();

			Workspace.AirDensity = Physics.GetAirDensityOnHeight(playerHeight);
			Workspace.Gravity = Physics.GetGravityOnHeight(playerHeight);
		});
	}
}

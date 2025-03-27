import { RunService } from "@rbxts/services";
import { GlobalMessageController } from "server/GlobalMessageController";
import { ServerRestartController } from "server/ServerRestartController";
import type { GameHostBuilder } from "engine/shared/GameHostBuilder";

export namespace BaseGame {
	export function initialize(host: GameHostBuilder) {
		if (!RunService.IsStudio()) {
			host.services.registerService(ServerRestartController);
		}

		host.services.registerService(GlobalMessageController);
	}
}

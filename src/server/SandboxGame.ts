import { Workspace } from "@rbxts/services";
import { DiscordLogging } from "engine/server/network/DiscordLogging";
import { BadgeController } from "server/BadgeController";
import { BaseGame } from "server/BaseGame";
import { ServerBlockLogicController } from "server/blocks/ServerBlockLogicController";
import { ServerBuildingRequestController } from "server/building/ServerBuildingRequestController";
import { PlayerDatabase } from "server/database/PlayerDatabase";
import { SlotDatabase } from "server/database/SlotDatabase";
import { PlayModeController as PlayModeController } from "server/modes/PlayModeController";
import { UnreliableRemoteController } from "server/network/event/UnreliableRemoteHandler";
import { PlayerDataController } from "server/PlayerDataController";
import { PlayersCollision } from "server/PlayersCollision";
import { ServerPlots } from "server/plots/ServerPlots";
import { RagdollController } from "server/RagdollController";
import { SpreadingFireController } from "server/SpreadingFireController";
import { SharedPlots } from "shared/building/SharedPlots";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { RemoteEvents } from "shared/RemoteEvents";
import { CreateSandboxBlocks } from "shared/SandboxBlocks";
import type { GameHostBuilder } from "engine/shared/GameHostBuilder";

export namespace SandboxGame {
	export function initialize(builder: GameHostBuilder) {
		if (game.PrivateServerOwnerId !== 0) {
			Workspace.AddTag("PrivateServer");
		}

		BaseGame.initialize(builder);

		builder.services.registerService(DiscordLogging).withArgs([
			{
				footerText:
					`🔨 ${GameDefinitions.isTestPlace() ? "⚠️ Test" : ""} Build ${game.PlaceVersion}` +
					(game.PrivateServerOwnerId !== 0 ? ", Private Server" : "") +
					` (${game.JobId.sub(game.JobId.size() - 4)})`,
			},
		]);

		builder.services.registerSingletonClass(PlayerDatabase);
		builder.services.registerSingletonClass(SlotDatabase);
		builder.services.registerService(PlayerDataController);

		builder.services.registerSingletonClass(SpreadingFireController);
		RemoteEvents.initializeVisualEffects(builder);

		builder.services.registerSingletonFunc(() => SharedPlots.initialize());
		builder.services.registerSingletonFunc(CreateSandboxBlocks);

		builder.services.registerService(ServerPlots);
		PlayModeController.initialize(builder);
		builder.services.registerService(ServerBuildingRequestController);
		builder.services.registerService(ServerBlockLogicController);
		builder.services.registerService(UnreliableRemoteController);
		builder.services.registerService(RagdollController);
		builder.services.registerService(PlayersCollision);

		BadgeController.initializeIfProd(builder);
	}
}

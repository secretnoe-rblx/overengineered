import { DataStoreService, RunService, Workspace } from "@rbxts/services";
// import { BadgeController } from "server/BadgeController";
import { BackupBackedDatabaseBackend } from "engine/server/backend/BackupBackedDatabaseBackend";
import { NetworkLogging } from "engine/server/network/NetworkLogging";
import { BaseGame } from "server/BaseGame";
import { ServerBlockLogicController } from "server/blocks/ServerBlockLogicController";
import { ExternalDatabaseBackendPlayers, ExternalDatabaseBackendSlots } from "server/database/ExternalDatabaseBackend";
import { PlayerDatabase } from "server/database/PlayerDatabase";
import { SlotDatabase } from "server/database/SlotDatabase";
import { PlayModeController as PlayModeController } from "server/modes/PlayModeController";
import { UnreliableRemoteController } from "server/network/event/UnreliableRemoteHandler";
import { PlayersCollision } from "server/PlayersCollision";
import { ServerPlots } from "server/plots/ServerPlots";
import { RagdollController } from "server/RagdollController";
import { ServerEffectCreator } from "server/ServerEffectCreator";
import { ServerPlayersController } from "server/ServerPlayersController";
import { SpreadingFireController } from "server/SpreadingFireController";
import { UsernameGuiController } from "server/UsernameGuiController";
import { SharedPlots } from "shared/building/SharedPlots";
import { RemoteEvents } from "shared/RemoteEvents";
import { CreateSandboxBlocks } from "shared/SandboxBlocks";
import type { GameHostBuilder } from "engine/shared/GameHostBuilder";
import type { EffectCreator } from "shared/effects/EffectBase";

export namespace SandboxGame {
	export function initialize(builder: GameHostBuilder) {
		if (game.PrivateServerOwnerId !== 0) {
			Workspace.AddTag("PrivateServer");
		}

		BaseGame.initialize(builder);
		builder.services.registerService(NetworkLogging);

		// FIXME: Walkaround proxy is down, should we set up our own?
		// builder.services.registerService(DiscordLogging).withArgs([
		// 	{
		// 		footerText:
		// 			`🔨 ${GameDefinitions.isTestPlace() ? "⚠️ Test" : ""} Build ${game.PlaceVersion}` +
		// 			(game.PrivateServerOwnerId !== 0 ? ", Private Server" : "") +
		// 			` (${game.JobId.sub(game.JobId.size() - 4)})`,
		// 	},
		// ]);

		builder.services
			.registerSingletonClass(PlayerDatabase) //
			.withArgs([
				RunService.IsStudio()
					? new ExternalDatabaseBackendPlayers()
					: new BackupBackedDatabaseBackend(
							new ExternalDatabaseBackendPlayers(),
							DataStoreService.GetDataStore("players-bkp"),
						),
			]);
		builder.services
			.registerSingletonClass(SlotDatabase) //
			.withArgs([
				RunService.IsStudio()
					? new ExternalDatabaseBackendSlots()
					: new BackupBackedDatabaseBackend(
							new ExternalDatabaseBackendSlots(),
							DataStoreService.GetDataStore("slots-bkp"),
						),
			]);

		builder.services.registerService(ServerPlayersController);

		builder.services.registerSingletonClass(SpreadingFireController);

		builder.services
			.registerSingletonClass(ServerEffectCreator) //
			.as<EffectCreator>();
		RemoteEvents.initializeVisualEffects(builder);

		builder.services.registerSingletonFunc(() => SharedPlots.initialize());
		builder.services.registerSingletonFunc(CreateSandboxBlocks);

		builder.services.registerService(ServerPlots);
		builder.services.registerService(UsernameGuiController);
		PlayModeController.initialize(builder);
		builder.services.registerService(ServerBlockLogicController);
		builder.services.registerService(UnreliableRemoteController);
		builder.services.registerService(RagdollController);
		builder.services.registerService(PlayersCollision);

		// BadgeController.initializeIfProd(builder);
	}
}

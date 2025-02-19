import { ComponentKeyedChildren } from "engine/shared/component/ComponentKeyedChildren";
import { HostedService } from "engine/shared/di/HostedService";
import { PlayerWatcher } from "engine/shared/PlayerWatcher";
import { isNotAdmin_AutoBanned } from "server/BanAdminExploiter";
import { ServerPlayerController } from "server/ServerPlayerController";
import { ServerPlayerDataRemotesController } from "server/ServerPlayerDataRemotesController";
import { CustomRemotes } from "shared/Remotes";
import type { PlayerDatabase } from "server/database/PlayerDatabase";
import type { SharedPlots } from "shared/building/SharedPlots";
import type { PlayerInitResponse } from "shared/Remotes";

@injectable
export class ServerPlayersController extends HostedService {
	readonly controllers;

	constructor(@inject players: PlayerDatabase, @inject sharedPlots: SharedPlots, @inject di: DIContainer) {
		super();

		const controllers = this.parent(new ComponentKeyedChildren<Player, ServerPlayerController>(true));
		this.controllers = controllers.children;

		this.event.subscribeRegistration(() =>
			CustomRemotes.initPlayer.subscribe((player) => {
				if (controllers.getAll().has(player)) {
					player.Kick("hi  i like your hair");
					return { success: false, message: "no" };
				}

				const plot = sharedPlots.plots.find((p) => p.ownerId.get() === undefined);
				if (!plot) {
					return { success: false, message: "No free plot found, try again later." };
				}

				const scope = di.beginScope((builder) => {
					builder.registerSingletonValue(player);
					builder.registerSingletonValue(plot);
					builder.registerSingletonClass(ServerPlayerController);
				});

				const controller = scope.resolveForeignClass(ServerPlayerController, [player, plot]);
				controllers.add(player, controller);
				const data = players.get(player.UserId) ?? {};

				return {
					success: true,
					remotes: controller.remotesFolder,
					data: {
						purchasedSlots: data.purchasedSlots,
						settings: data.settings,
						slots: data.slots,
						data: data.data,
					},
				};
			}),
		);
		this.event.subscribeRegistration(() =>
			CustomRemotes.adminDataFor.subscribe((sender, playerId): Response<PlayerInitResponse> => {
				if (isNotAdmin_AutoBanned(sender, "adminDataFor")) {
					return { success: false, message: "no" };
				}

				const spdrc = ServerPlayerDataRemotesController.create(di, playerId, sender);
				spdrc.enable();

				const data = players.get(playerId) ?? {};

				return {
					success: true,
					remotes: spdrc.remotesFolder,
					data: {
						purchasedSlots: data.purchasedSlots,
						settings: data.settings,
						slots: data.slots,
						data: data.data,
					},
				};
			}),
		);

		this.event.subscribeRegistration(() =>
			PlayerWatcher.onQuit((player) => {
				controllers.get(player)?.destroy();
				controllers.remove(player);
			}),
		);

		game.BindToClose(() => {
			$log("Game quit, destroying controllers...");

			for (const [player, controller] of controllers.getAll()) {
				$log(`Destroying controller of ${player.Name}`);
				controller.destroy();
			}
		});
	}

	getPlayers(): readonly Player[] {
		return this.controllers.getAll().keys();
	}
}

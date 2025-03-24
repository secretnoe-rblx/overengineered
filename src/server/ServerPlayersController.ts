import { Players } from "@rbxts/services";
import { ComponentKeyedChildren } from "engine/shared/component/ComponentKeyedChildren";
import { HostedService } from "engine/shared/di/HostedService";
import { PlayerWatcher } from "engine/shared/PlayerWatcher";
import { isNotAdmin_AutoBanned } from "server/BanAdminExploiter";
import { ServerSlotRequestController } from "server/building/ServerSlotRequestController";
import { asPlayerId } from "server/PlayerId";
import { ServerPlayerController } from "server/ServerPlayerController";
import { ServerPlayerDataRemotesController } from "server/ServerPlayerDataRemotesController";
import { CustomRemotes } from "shared/Remotes";
import type { PlayerDatabase } from "server/database/PlayerDatabase";
import type { SlotDatabase } from "server/database/SlotDatabase";
import type { SharedPlots } from "shared/building/SharedPlots";
import type { PlayerInitResponse } from "shared/Remotes";

@injectable
export class ServerPlayersController extends HostedService {
	readonly controllers;

	constructor(@inject players: PlayerDatabase, @inject sharedPlots: SharedPlots, @inject di: DIContainer) {
		super();

		const controllers = this.parent(new ComponentKeyedChildren<number, ServerPlayerController>(true));
		this.controllers = controllers.children;

		this.event.subscribeRegistration(() =>
			CustomRemotes.initPlayer.subscribe((player): Response<PlayerInitResponse> => {
				if (controllers.getAll().has(player.UserId)) {
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
				controllers.add(player.UserId, controller);

				try {
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
				} catch (err) {
					player.Kick("The server is currently unavailable, try again later.");
					return { success: false, message: tostring(err) };
				}
			}),
		);
		this.event.subscribeRegistration(() =>
			CustomRemotes.adminDataFor.subscribe((sender, playerId): Response<PlayerInitResponse> => {
				if (isNotAdmin_AutoBanned(sender, "adminDataFor")) {
					return { success: false, message: "no" };
				}

				const controller = this.controllers.get(sender.UserId);
				if (!controller) {
					return { success: false, message: "you are LITERALLY offline" };
				}

				const scope = di.beginScope((builder) => {
					builder.registerSingletonValue(asPlayerId(playerId));
				});

				const spdrc = ServerPlayerDataRemotesController.create(scope, playerId, sender);
				spdrc.enable();

				spdrc.parent(
					new ServerSlotRequestController(
						asPlayerId(playerId),
						spdrc.slotRemotes,
						controller.plotController.blocks,
						scope.resolve<BlockList>(),
						scope.resolve<PlayerDatabase>(),
						scope.resolve<SlotDatabase>(),
					),
				);

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
				controllers.get(player.UserId)?.destroy();
				controllers.remove(player.UserId);
			}),
		);

		game.BindToClose(() => {
			$log("Game quit, destroying controllers...");

			for (const [playerId, controller] of controllers.getAll()) {
				$log(`Destroying controller of ${playerId}`);
				controller.destroy();
			}
		});
	}

	getPlayers(): readonly Player[] {
		return this.controllers
			.getAll()
			.keys()
			.mapFiltered((id) => Players.GetPlayerByUserId(id));
	}
}

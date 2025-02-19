import { Players } from "@rbxts/services";
import { Throttler } from "engine/shared/Throttler";
import { ServerPartUtils } from "server/plots/ServerPartUtils";
import { BlockManager } from "shared/building/BlockManager";
import { BlocksSerializer } from "shared/building/BlocksSerializer";
import { CustomRemotes } from "shared/Remotes";
import { SlotsMeta } from "shared/SlotsMeta";
import type { PlayerDatabase } from "server/database/PlayerDatabase";
import type { SlotDatabase } from "server/database/SlotDatabase";
import type { PlayModeBase } from "server/modes/PlayModeBase";
import type { ServerPlayersController } from "server/ServerPlayersController";

@injectable
export class RideMode implements PlayModeBase {
	private readonly cache = new Map<Player, Instance>();
	private readonly required;

	constructor(
		@inject private readonly serverControllers: ServerPlayersController,
		@inject private readonly blockList: BlockList,
		@inject private readonly slots: SlotDatabase,
		@inject private readonly playerData: PlayerDatabase,
	) {
		this.required = blockList.sorted.filter((b) => b.required);

		Players.PlayerRemoving.Connect((player) => {
			const blocks = this.cache.get(player);

			if (blocks) {
				blocks.Destroy();
				this.cache.delete(player);
			}
		});

		CustomRemotes.modes.ride.teleportOnSeat.invoked.Connect(this.sit.bind(this));
	}
	private sit(player: Player) {
		const hrp = player.Character?.FindFirstChild("Humanoid") as Humanoid | undefined;
		if (!hrp) return;
		if (hrp.Sit) return;

		const vehicleSeat = this.serverControllers.controllers
			.get(player)
			?.plotController.blocks?.getBlocks()
			?.find((model) => BlockManager.manager.id.get(model) === "vehicleseat")
			?.FindFirstChild("VehicleSeat") as VehicleSeat | undefined;
		if (!vehicleSeat) return;

		if (vehicleSeat.Occupant && vehicleSeat.Occupant !== player.Character?.FindFirstChild("Humanoid")) {
			vehicleSeat.Occupant.Sit = false;
			task.wait(0.5);
		}

		if (hrp.Health <= 0) return;

		vehicleSeat.Sit(hrp);
	}

	onTransitionFrom(player: Player, prevmode: PlayModes | undefined): Response | undefined {
		if (prevmode === "build") {
			return this.rideStart(player);
		}
	}
	onTransitionTo(player: Player, nextmode: PlayModes | undefined): Response | undefined {
		if (nextmode === undefined || nextmode === "build") {
			return this.rideStop(player);
		}
	}

	private initializePhysics(owner: Player, blocks: readonly BlockModel[]) {
		const data = blocks.flatmap((value) => value.GetChildren());

		const rootParts: BasePart[] = [];
		for (const instance of data) {
			if (instance.IsA("BasePart") && instance.AssemblyRootPart === instance) {
				rootParts.push(instance);
			}
		}

		const players = this.serverControllers.getPlayers().filter((p) => p !== owner);
		CustomRemotes.physics.normalizeRootparts.send(players, { parts: rootParts });
	}

	private rideStart(player: Player): Response {
		const controller = this.serverControllers.controllers.get(player)?.plotController;
		if (!controller) throw "what";

		const blocksChildren = controller.blocks.getBlocks();

		for (const block of this.required) {
			if (!blocksChildren.find((value) => BlockManager.manager.id.get(value) === block.id)) {
				return {
					success: false,
					message: block.displayName + " not found",
				};
			}
		}

		const copy = controller.blocks.cloneBlocks();
		this.cache.set(player, copy);

		this.slots.setBlocks(
			player.UserId,
			SlotsMeta.autosaveSlotIndex,
			BlocksSerializer.serializeToObject(controller.blocks),
		);

		const hrp = player.Character?.WaitForChild("Humanoid") as Humanoid;
		const vehicleSeat = blocksChildren
			.find((model) => BlockManager.manager.id.get(model) === "vehicleseat")
			?.FindFirstChild("VehicleSeat") as VehicleSeat | undefined;
		if (vehicleSeat) {
			if (vehicleSeat.Occupant && vehicleSeat.Occupant !== player.Character?.FindFirstChild("Humanoid")) {
				vehicleSeat.Occupant.Sit = false;
				task.wait(0.5);
			}

			if (hrp.Health > 0) {
				vehicleSeat.Sit(hrp);
			}
		}

		for (const block of blocksChildren) {
			ServerPartUtils.switchDescendantsAnchor(block, false);
			if (this.playerData.get(player.UserId).settings?.physics?.advanced_aerodynamics) {
				ServerPartUtils.switchDescendantsAero(block, true);
			}
		}

		for (const block of blocksChildren) {
			ServerPartUtils.switchDescendantsNetworkOwner(block, player);
		}

		// TODO: move this somewhere
		for (const block of blocksChildren) {
			if (BlockManager.manager.id.get(block) === "anchorblock") {
				ServerPartUtils.switchDescendantsAnchor(block, true);
			}
		}

		this.initializePhysics(player, controller.blocks.getBlocks());

		return { success: true };
	}
	private rideStop(player: Player): Response {
		const controller = this.serverControllers.controllers.get(player)?.plotController;
		if (!controller) throw "what";

		Throttler.forEach(6, controller.blocks.getBlocks(), (b) => b.Destroy());

		const cache = this.cache.get(player);
		if (cache) {
			const time = os.clock();
			Throttler.forEach(3, cache.GetChildren() as BlockModel[], (child) =>
				controller.blocks.justPlaceExisting(child),
			);

			cache.Destroy();
			print(`Loaded the cached save in ${os.clock() - time}`);
		} else {
			controller.blocks.deleteOperation.execute("all");

			const blocksToLoad = this.slots.getBlocks(player.UserId, SlotsMeta.autosaveSlotIndex);
			BlocksSerializer.deserializeFromObject(blocksToLoad, controller.blocks, this.blockList);
		}

		this.cache.delete(player);
		return { success: true };
	}
}

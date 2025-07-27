import { Players } from "@rbxts/services";
import { Throttler } from "engine/shared/Throttler";
import { ServerPartUtils } from "server/plots/ServerPartUtils";
import { BlockManager } from "shared/building/BlockManager";
import { BlocksSerializer } from "shared/building/BlocksSerializer";
import { CustomRemotes } from "shared/Remotes";
import { SlotsMeta } from "shared/SlotsMeta";
import type { SpawnPosition } from "client/modes/build/BuildingMode";
import type { PlayerDatabase } from "server/database/PlayerDatabase";
import type { SlotDatabase } from "server/database/SlotDatabase";
import type { PlayModeBase } from "server/modes/PlayModeBase";
import type { ServerPlayersController } from "server/ServerPlayersController";

@injectable
export class RideMode implements PlayModeBase {
	private readonly cache = new Map<Player, Instance>();

	constructor(
		@inject private readonly serverControllers: ServerPlayersController,
		@inject private readonly blockList: BlockList,
		@inject private readonly slots: SlotDatabase,
		@inject private readonly playerData: PlayerDatabase,
	) {
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
			.get(player.UserId)
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

	onTransitionFrom(player: Player, prevmode: PlayModes | undefined, pos?: SpawnPosition): Response | undefined {
		if (prevmode === "build") {
			return this.rideStart(player, pos ?? "plot");
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

	private rideStart(player: Player, pos: SpawnPosition): Response {
		const positions: { readonly [k in SpawnPosition]: CFrame | undefined } = {
			plot: undefined,
			water1: new CFrame(769, -16345.559, 1269.5),
			water2: new CFrame(-101, -16411.887, 3045),
			space: new CFrame(50, 26411, 894),
			helipad: new CFrame(901, -14871.997, -798),
			idk: new CFrame(-14101, -16411.887, 35045),
		};
		print("spawning at ", pos);
		const spawnPosition = positions[pos];

		const controller = this.serverControllers.controllers.get(player.UserId)?.plotController;
		if (!controller) throw "what";

		const blocksChildren = controller.blocks.getBlocks();
		const copy = controller.blocks.cloneBlocks();
		this.cache.set(player, copy);

		this.slots.setBlocks(
			player.UserId,
			SlotsMeta.lastRunSlotIndex,
			BlocksSerializer.serializeToObject(controller.blocks),
		);

		if (spawnPosition) {
			for (const block of blocksChildren) {
				block.PivotTo(spawnPosition.mul(controller.blocks.origin.ToObjectSpace(block.GetPivot())));
			}

			try {
				const humanoid = player.Character?.FindFirstChild("Humanoid") as Humanoid;
				humanoid.RootPart!.PivotTo(
					spawnPosition.mul(controller.blocks.origin.ToObjectSpace(humanoid.RootPart!.GetPivot())),
				);
			} catch {
				// empty
			}
		}

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
		const controller = this.serverControllers.controllers.get(player.UserId)?.plotController;
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

			const blocksToLoad = this.slots.getBlocks(player.UserId, SlotsMeta.lastRunSlotIndex);
			BlocksSerializer.deserializeFromObject(blocksToLoad, controller.blocks, this.blockList);
		}

		this.cache.delete(player);
		return { success: true };
	}
}

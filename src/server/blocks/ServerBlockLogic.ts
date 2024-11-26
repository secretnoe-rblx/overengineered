import { Workspace } from "@rbxts/services";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { GenericBlockLogicCtor } from "shared/blockLogic/BlockLogic";

export abstract class ServerBlockLogic<T extends GenericBlockLogicCtor> {
	readonly logic;

	constructor(
		logic: T,
		private readonly playModeController: PlayModeController,
	) {
		this.logic = logic;
	}

	protected isValidBlock(
		block: BlockModel | undefined,
		player: Player | undefined,
		checkOwnership: boolean = true,
	): boolean {
		if (!block) return false;
		if (!block.IsDescendantOf(Workspace)) return false;

		if (player) {
			if (this.playModeController.getPlayerMode(player) !== "ride") {
				return false;
			}

			if (
				checkOwnership &&
				!block.PrimaryPart?.Anchored &&
				!block.PrimaryPart?.AssemblyRootPart?.Anchored &&
				block.PrimaryPart?.GetNetworkOwner() !== player
			) {
				return false;
			}
		}

		return true;
	}
}

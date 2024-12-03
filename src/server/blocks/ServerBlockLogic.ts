import { Workspace } from "@rbxts/services";
import { SharedPlots } from "shared/building/SharedPlots";
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

	static staticIsValidBlock(
		block: BasePart | undefined,
		player: Player | undefined,
		playModeController: PlayModeController,
		checkOwnership: boolean = true,
		checkRideMode: boolean = true,
	): boolean {
		if (!block) return false;
		if (!block.IsDescendantOf(Workspace)) return false;

		if (player) {
			if (checkRideMode && playModeController.getPlayerMode(player) !== "ride") {
				return false;
			}

			if (checkOwnership) {
				const plot = SharedPlots.staticTryGetPlotByOwnerID(player.UserId);
				if (!plot) return false;

				if (!block?.Anchored && !block?.AssemblyRootPart?.Anchored && !block.IsDescendantOf(plot)) {
					return false;
				}
			}
		}

		return true;
	}
	protected isValidBlock(
		block: BlockModel | undefined,
		player: Player | undefined,
		checkOwnership: boolean = true,
		checkRideMode: boolean = true,
	): boolean {
		if (!block?.PrimaryPart) return false;
		return ServerBlockLogic.staticIsValidBlock(
			block.PrimaryPart,
			player,
			this.playModeController,
			checkOwnership,
			checkRideMode,
		);
	}
}

import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { BackMountBlockLogic } from "shared/blocks/blocks/BackMountBlock";

type d = BlockModel & {
	mainPart: BasePart;
	PlayerWeldConstraint: WeldConstraint;
};

@injectable
export class BackMountBlockServerLogic extends ServerBlockLogic<typeof BackMountBlockLogic> {
	constructor(logic: typeof BackMountBlockLogic, @inject playModeController: PlayModeController) {
		super(logic, playModeController);

		logic.events.init.invoked.Connect((player, { block }) => {
			if (!this.isValidBlock(block, player)) return;
			(block as d).mainPart.Anchored = false; //set true
		});

		logic.events.weldMountToPlayer.invoked.Connect((player, { block, humanoid }) => {
			if (!this.isValidBlock(block, player)) return;
			const torso = humanoid.RootPart;
			if (!torso) return;
			torso.PivotTo(block.GetPivot());
			(block as d).PlayerWeldConstraint.Part1 = torso;
			(block as d).mainPart.Anchored = false;
		});

		logic.events.unweldMountFromPlayer.invoked.Connect((player, { block }) => {
			if (!this.isValidBlock(block, player)) return;
			(block as d).PlayerWeldConstraint.Part1 = (block as d).PlayerWeldConstraint.Part0;
		});
	}
}

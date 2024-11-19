import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { BackMountBlockLogic } from "shared/blocks/blocks/BackMountBlock";

@injectable
export class BackMountBlockServerLogic extends ServerBlockLogic<typeof BackMountBlockLogic> {
	constructor(logic: typeof BackMountBlockLogic, @inject playModeController: PlayModeController) {
		super(logic, playModeController);

		logic.events.init.invoked.Connect((player, { block, torso }) => {
			print("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
			(block as unknown as BasePart).Position = torso.GetPivot().LookVector.mul(1).add(block.GetPivot().Position);
			block.PivotTo(torso.GetPivot());
		});
	}
}

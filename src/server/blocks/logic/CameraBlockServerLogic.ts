import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { CameraBlockLogic } from "shared/blocks/blocks/CameraBlock";

@injectable
export class CameraBlockServerLogic extends ServerBlockLogic<typeof CameraBlockLogic> {
	constructor(logic: typeof CameraBlockLogic, @inject playModeController: PlayModeController) {
		super(logic, playModeController);

		logic.events.update.invoked.Connect((player, { block, enabled }) => {
			if (!this.isValidBlock(block, player)) return;
			logic.update(block, enabled);
		});
	}
}

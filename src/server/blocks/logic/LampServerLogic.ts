import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { LampBlockLogic } from "shared/blocks/blocks/grouped/LampBlocks";

@injectable
export class LampServerLogic extends ServerBlockLogic<typeof LampBlockLogic> {
	constructor(logic: typeof LampBlockLogic, @inject playModeController: PlayModeController) {
		super(logic, playModeController);

		logic.events.update.invoked.Connect((player, data) => {
			if (!this.isValidBlock(data.block, player)) return;
			logic.update(data);
		});
	}
}

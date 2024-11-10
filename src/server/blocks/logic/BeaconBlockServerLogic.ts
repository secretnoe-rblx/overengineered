import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { BeaconBlockLogic } from "shared/blocks/blocks/BeaconBlock";

@injectable
export class ServerBlockServerLogic extends ServerBlockLogic<typeof BeaconBlockLogic> {
	constructor(logic: typeof BeaconBlockLogic, @inject playModeController: PlayModeController) {
		super(logic, playModeController);

		logic.events.update.invoked.Connect((player, data) => {
			if (!this.isValidBlock(data.block as unknown as BlockModel, player)) return;
			logic.updateLedColor(data);
		});
	}
}

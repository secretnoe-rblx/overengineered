import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { DisconnectBlockLogic } from "shared/blocks/blocks/DisconnectBlock";

@injectable
export class DisconnectBlockServerLogic extends ServerBlockLogic<typeof DisconnectBlockLogic> {
	constructor(logic: typeof DisconnectBlockLogic, @inject playModeController: PlayModeController) {
		super(logic, playModeController);

		logic.events.disconnect.invoked.Connect((player, { block }) => {
			if (!this.isValidBlock(block, player)) return;
			logic.disconnect(block);
			if (player) {
				logic.events.disconnect2c.send(player, { block });
			}

			for (const d of [block.BottomPart, block.TopPart]) {
				if (!d.AssemblyRootPart?.Anchored) {
					d.SetNetworkOwner(player);
				}
			}
		});
	}
}

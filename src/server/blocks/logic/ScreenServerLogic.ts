import { TextService } from "@rbxts/services";
import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { ScreenBlockLogic } from "shared/blocks/blocks/ScreenBlock";

@injectable
export class ScreenServerLogic extends ServerBlockLogic<typeof ScreenBlockLogic> {
	constructor(logic: typeof ScreenBlockLogic, @inject playModeController: PlayModeController) {
		super(logic, playModeController);

		logic.events.update.invoked.Connect((player, { block, color, text, translate }) => {
			if (!this.isValidBlock(block, player)) return;

			if (translate && player) {
				text = TextService.FilterStringAsync(text, player.UserId).GetNonChatStringForBroadcastAsync();
			}

			block.Part.SurfaceGui.TextLabel.Text = text;
			block.Part.SurfaceGui.TextLabel.TextColor3 = color;
		});
	}
}

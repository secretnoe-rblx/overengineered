import { TextService } from "@rbxts/services";
import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import { ButtonBlock } from "shared/blocks/blocks/ButtonBlock";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { ButtonBlockLogic } from "shared/blocks/blocks/ButtonBlock";

@injectable
export class ButtonServerLogic extends ServerBlockLogic<typeof ButtonBlockLogic> {
	constructor(logic: typeof ButtonBlockLogic, @inject playModeController: PlayModeController) {
		super(logic, playModeController);

		ButtonBlock.logic.events.updateText.addServerMiddleware((player, arg) => {
			if (player && arg.text) {
				const text = TextService.FilterStringAsync(
					arg.text,
					player.UserId,
					"PublicChat",
				).GetNonChatStringForUserAsync(player.UserId);

				return { success: true, value: { ...arg, text } };
			}

			return { success: true, value: arg };
		});
	}
}

import { TextService } from "@rbxts/services";
import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import { ScreenBlock } from "shared/blocks/blocks/ScreenBlock";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { ScreenBlockLogic } from "shared/blocks/blocks/ScreenBlock";

@injectable
export class ScreenServerLogic extends ServerBlockLogic<typeof ScreenBlockLogic> {
	constructor(logic: typeof ScreenBlockLogic, @inject playModeController: PlayModeController) {
		super(logic, playModeController);

		ScreenBlock.logic.events.update.addServerMiddleware((player, arg) => {
			if (player && arg.translate) {
				return {
					success: true,
					value: {
						...arg,
						text: TextService.FilterStringAsync(
							arg.text,
							player.UserId,
						).GetNonChatStringForBroadcastAsync(),
					},
				};
			}

			return { success: true, value: arg };
		});
	}
}

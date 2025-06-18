import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import { SpeakerBlock } from "shared/blocks/blocks/sound/SpeakerBlock";
import type { PlayerDatabase } from "server/database/PlayerDatabase";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { SpeakerBlockLogic } from "shared/blocks/blocks/sound/SpeakerBlock";

@injectable
export class SpeakerServerLogic extends ServerBlockLogic<typeof SpeakerBlockLogic> {
	constructor(
		logic: typeof SpeakerBlockLogic,
		@inject playModeController: PlayModeController,
		@inject database: PlayerDatabase,
	) {
		super(logic, playModeController);

		const events = SpeakerBlock.logic.events;
		events.update.addServerMiddleware((invoker, arg) => {
			if (!invoker) return { success: true, value: arg };

			const pdata = database.get(invoker.UserId);
			if (!pdata?.settings?.publicSpeakers) {
				return "dontsend";
			}

			return { success: true, value: arg };
		});
		events.update.addServerMiddlewarePerPlayer((invoker, player, arg) => {
			const pdata = database.get(player.UserId);
			if (!pdata?.settings?.publicSpeakers) {
				return "dontsend";
			}

			return { success: true, value: arg };
		});
	}
}

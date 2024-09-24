import { AlertPopup } from "client/gui/popup/AlertPopup";
import { HostedService } from "shared/GameHost";
import type { PlayerDataStorage } from "client/PlayerDataStorage";

@injectable
export class UpdatePopupController extends HostedService {
	constructor(@inject playerDataStorage: PlayerDataStorage) {
		super();

		this.onEnable(() => {
			const lastVersion = playerDataStorage.data.get().data.lastLaunchedVersion ?? 0;
			playerDataStorage.sendPlayerDataValue("lastLaunchedVersion", game.PlaceVersion);

			if (lastVersion < 100) {
				AlertPopup.showPopup(
					`
The game has been updated!

The internals of the logic system have been reworked, so something may go wrong... will, probably.
If you encounter any problem, please don't save the broken slot and let us know about it in our community server!
Also you can check the changelog there
				`.trim(),
				);
			}
		});
	}
}

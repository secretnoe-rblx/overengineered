import { AlertPopup } from "client/gui/popup/AlertPopup";
import { HostedService } from "engine/shared/di/HostedService";
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

The internals of the logic system have been reworked from scratch, so something will break. But don't worry.
If you encounter any problem, just don't save the broken building and let us know about it in our community server!
There you can also check out the changes in this update.
					`.trim(),
				);
			} else if (lastVersion < 101) {
				AlertPopup.showPopup(
					`
Again, so you don't forget.
The game has been UPDATED!!!!!

The internals of the logic system have been *reworked from scratch*, so something *will* break. But don't worry.
If you encounter any problem, just don't save the broken building and LET US KNOW ABOUT IT IN OUR COMMUNITY SERVER! Otherwise we won't be able to fix it.
You can also check out the changes of this update there.
					`.trim(),
				);
			}
		});
	}
}

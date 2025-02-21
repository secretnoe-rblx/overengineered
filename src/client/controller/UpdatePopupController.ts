import { AlertPopup } from "client/gui/popup/AlertPopup";
import { HostedService } from "engine/shared/di/HostedService";
import type { PopupController } from "client/gui/PopupController";
import type { PlayerDataStorage } from "client/PlayerDataStorage";

@injectable
export class UpdatePopupController extends HostedService {
	constructor(@inject playerDataStorage: PlayerDataStorage, @inject popupController: PopupController) {
		super();

		this.onEnable(() => {
			const lastVersion = playerDataStorage.data.get().data.lastLaunchedVersion ?? 0;
			playerDataStorage.sendPlayerDataValue("lastLaunchedVersion", game.PlaceVersion);

			if (lastVersion === 0) {
				return;
			}

			if (lastVersion <= 123) {
				popupController.showPopup(
					new AlertPopup(
						`
Scaling Update 📏

You can now scale blocks! Yes, all of them. At once.
Up to 8x bigger or 16x smaller.
To scale blocks use either edit tool (new "scale" option) or build tool (scaling editor in the top right)

You can find more information in our community server.
					`.trim(),
					),
				);
			}
		});
	}
}

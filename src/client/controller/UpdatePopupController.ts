import { AlertPopup } from "client/gui/popup/AlertPopup";
import { HostedService } from "engine/shared/di/HostedService";
import type { PopupController } from "client/gui/PopupController";
import type { PlayerDataStorage } from "client/PlayerDataStorage";

@injectable
export class UpdatePopupController extends HostedService {
	constructor(@inject playerDataStorage: PlayerDataStorage, @inject popupController: PopupController) {
		super();

		this.onEnable(() => {
			const data = playerDataStorage.data.get();
			playerDataStorage.sendPlayerDataValue("seen1", true);

			if (!data.data.seen1) {
				popupController.showPopup(
					new AlertPopup(`
Hi! We're switching to Roblox measurement units. 
That means, your builds which rely on physics calculations might've got broken.
We're sorry for the inconvenience.
Join our community server for more information.
`),
				);
			}
		});
	}
}

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
		});
	}
}

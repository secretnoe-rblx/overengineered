import { SettingsPopup } from "client/gui/popup/SettingsPopup";
import { Scene } from "client/gui/Scene";
import { Action } from "engine/client/Action";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";
import type { PopupController } from "client/gui/PopupController";
import type { Theme } from "client/Theme";

@injectable
export class MainScene extends Scene {
	readonly openSettingsAction: Action;

	constructor(@inject mainScreen: MainScreenLayout, @inject theme: Theme, @inject popupController: PopupController) {
		super();

		this.openSettingsAction = this.parent(new Action(() => popupController.showPopup(new SettingsPopup())));
		this.parent(mainScreen.registerTopCenterButton("Menu")) //
			.themeButton(theme, "buttonNormal")
			.subscribeToAction(this.openSettingsAction)
			.subscribeVisibilityFrom({ main_enabled: this.enabledState });
	}
}

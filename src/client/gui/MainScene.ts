import { Scene } from "client/gui/Scene";
import { Action } from "engine/client/Action";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";
import type { SettingsPopup } from "client/gui/popup/SettingsPopup";
import type { PopupService } from "client/gui/PopupService";
import type { Theme } from "client/Theme";

@injectable
export class MainScene extends Scene {
	readonly openSettingsAction: Action;

	constructor(
		@inject mainScreen: MainScreenLayout,
		@inject theme: Theme,
		@injectFunc popupService: PopupService,
		@injectFunc createSettingsPopup: () => SettingsPopup,
	) {
		super();

		// popupService.showPopup(createSettingsPopup())

		this.openSettingsAction = this.parent(new Action(() => createSettingsPopup().show()));
		this.parent(mainScreen.registerTopCenterButton("Menu")) //
			.themeButton(theme, "buttonNormal")
			.subscribeToAction(this.openSettingsAction)
			.subscribeVisibilityFrom({ main_enabled: this.enabledState });
	}
}

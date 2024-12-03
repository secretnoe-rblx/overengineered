import { Scene } from "client/gui/Scene";
import { Action } from "engine/client/Action";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";
import type { SettingsPopup } from "client/gui/popup/SettingsPopup";

@injectable
export class MainScene extends Scene {
	readonly openSettingsAction = new Action();

	constructor(@inject mainScreen: MainScreenLayout, @injectFunc createSettingsPopup: () => SettingsPopup) {
		super();

		this.openSettingsAction.subscribe(() => createSettingsPopup().show());
		this.openSettingsAction.subCanExecuteFrom({
			main: this.enabledState,
		});

		this.parent(mainScreen.registerTopCenterButton("Menu")) //
			.subscribeToAction(this.openSettingsAction);
	}
}

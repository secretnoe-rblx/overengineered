import { Scene } from "client/gui/Scene";
import { ButtonControl } from "engine/client/gui/Button";
import { ObservableSwitch } from "engine/shared/event/ObservableSwitch";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";
import type { SettingsPopup } from "client/gui/popup/SettingsPopup";

@injectable
export class MainScene extends Scene {
	readonly canOpenSettings = new ObservableSwitch();

	constructor(@inject mainScreen: MainScreenLayout, @injectFunc createSettingsPopup: () => SettingsPopup) {
		super();

		const menuButton = mainScreen.registerTopCenterButton("Menu");
		this.event.subscribeObservable(
			this.canOpenSettings,
			(canOpenSettings) => menuButton.visible.set("main", canOpenSettings),
			true,
		);

		this.parent(new ButtonControl(menuButton.instance, () => createSettingsPopup().show()));
	}
}

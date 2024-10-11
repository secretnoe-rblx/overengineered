import { Control } from "engine/client/gui/Control";

type ButtonList = GuiObject & {
	//
};

export type TopbarDefinition = GuiObject & {
	readonly Top: GuiObject & {
		readonly Buttons: ButtonList;
	};
	readonly ButtonsRight: ButtonList;
};
export class Topbar extends Control<TopbarDefinition> {
	constructor(gui: TopbarDefinition) {
		super(gui);
	}

	getButtonsGui<T>(name: string) {
		return this.gui.Top.Buttons.WaitForChild(name) as T;
	}
	getRightButtonsGui<T>(name: string) {
		return this.gui.ButtonsRight.WaitForChild(name) as T;
	}
}

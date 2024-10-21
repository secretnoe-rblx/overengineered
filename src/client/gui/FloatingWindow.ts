import { Interface } from "client/gui/Interface";
import { Control } from "engine/client/gui/Control";
import { ComponentInstance } from "engine/shared/component/ComponentInstance";
import { Element } from "engine/shared/Element";

export type FloatingWindowDefinition = GuiObject & {
	//
};
export class FloatingWindow extends Control<FloatingWindowDefinition> {
	static newScreen(): ScreenGui {
		return Element.create("ScreenGui", { Name: "Floating", Enabled: false, Parent: Interface.getPlayerGui() });
	}
	static create(gui: FloatingWindowDefinition): FloatingWindow {
		const control = new FloatingWindow(gui, this.newScreen());
		control.add(control);

		return control;
	}

	constructor(gui: FloatingWindowDefinition, screen: ScreenGui) {
		super(gui);

		gui.Parent = screen;

		this.onEnable(() => (screen.Enabled = true));
		this.onDisable(() => (screen.Enabled = false));
		ComponentInstance.init(this, screen);
	}
}

import { Interface } from "client/gui/Interface";
import { Component } from "engine/shared/component/Component";
import { ComponentInstance } from "engine/shared/component/ComponentInstance";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { ObservableSwitch } from "engine/shared/event/ObservableSwitch";

class AnimatedListControl<T extends GuiButton> extends InstanceComponent<T> {
	readonly visible = new ObservableSwitch();
}

//

type MainScreenLayoutDefinition = ScreenGui & {
	readonly Top: GuiObject & {
		readonly Center: GuiObject & {
			readonly Main: GuiObject;
			readonly Secondary: GuiObject;
		};
		readonly Right: GuiObject;
	};
};
export class MainScreenLayout extends Component {
	private readonly instance: MainScreenLayoutDefinition;

	constructor() {
		super();

		this.instance = Interface.getInterface2();
		ComponentInstance.init(this, this.instance);

		//
	}

	registerTopCenterButton<T extends GuiButton>(name: string): AnimatedListControl<T> {
		const button = new AnimatedListControl(this.instance.Top.Center.Main.WaitForChild(name) as T);
		button.visible.changed.Connect((visible) => {
			button.instance.Visible = visible;
		});

		return button;
	}
	registerTopRightButton<T extends GuiButton>(name: string): AnimatedListControl<T> {
		const button = new AnimatedListControl(this.instance.Top.Right.WaitForChild(name) as T);
		button.visible.changed.Connect((visible) => {
			button.instance.Visible = visible;
		});

		return button;
	}
}

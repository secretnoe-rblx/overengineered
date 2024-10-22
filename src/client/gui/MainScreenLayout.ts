import { Interface } from "client/gui/Interface";
import { Component } from "engine/shared/component/Component";
import { ComponentInstance } from "engine/shared/component/ComponentInstance";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { ObjectOverlayStorage } from "engine/shared/component/ObjectOverlayStorage";

class AnimatedListControl<T extends GuiButton> extends InstanceComponent<T> {
	readonly visibility: ObjectOverlayStorage<{ Visible: boolean }>;

	constructor(instance: T, defaultVisibility: boolean) {
		super(instance);
		this.visibility = new ObjectOverlayStorage({ Visible: defaultVisibility }, undefined, true);
	}
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

	registerTopRightButton<T extends GuiButton>(name: string, defaultVisibility: boolean): AnimatedListControl<T> {
		const button = new AnimatedListControl(this.instance.Top.Right.WaitForChild(name) as T, defaultVisibility);
		button.visibility.value.changed.Connect(({ Visible: visible }) => {
			button.instance.Visible = visible;
		});

		return button;
	}
}

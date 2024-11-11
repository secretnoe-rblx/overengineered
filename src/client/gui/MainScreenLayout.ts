import { LoadingController } from "client/controller/LoadingController";
import { HotbarControl } from "client/gui/buildmode/HotbarControl";
import { Interface } from "client/gui/Interface";
import { Component } from "engine/shared/component/Component";
import { ComponentInstance } from "engine/shared/component/ComponentInstance";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { Transforms } from "engine/shared/component/Transforms";
import { TransformService } from "engine/shared/component/TransformService";
import { ObservableSwitch } from "engine/shared/event/ObservableSwitch";
import type { HotbarControlDefinition } from "client/gui/buildmode/HotbarControl";

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
@injectable
export class MainScreenLayout extends Component {
	private readonly instance: MainScreenLayoutDefinition;

	readonly hotbar: HotbarControl;

	constructor(@inject di: DIContainer) {
		super();

		this.instance = Interface.getInterface2();
		ComponentInstance.init(this, this.instance);
		this.onEnabledStateChange((enabled) => (this.instance.Enabled = enabled));

		const initHotbar = () => {
			const hotbar = this.parentGui(
				di.resolveForeignClass(HotbarControl, [
					Interface.getInterface2<{ Hotbar: HotbarControlDefinition }>().Hotbar,
				]),
			);

			this.event.subscribeObservable(LoadingController.isLoading, (loading) => hotbar.setVisible(!loading), true);

			const visibilityFunction = Transforms.boolStateMachine(
				hotbar.instance,
				TransformService.commonProps.quadOut02,
				{ AnchorPoint: new Vector2(0.5, 1) },
				{ AnchorPoint: new Vector2(0.5, 0) },
				(tr, enabled) => (enabled ? tr.show(hotbar.instance) : 0),
				(tr, enabled) => (enabled ? 0 : tr.hide(hotbar.instance)),
			);
			hotbar.onEnabledStateChange(visibilityFunction);

			return hotbar;
		};
		this.hotbar = initHotbar();

		const forEachChild = (parent: Instance, callback: (child: GuiObject) => void) => {
			for (const child of parent.GetChildren()) {
				if (!child.IsA("GuiObject")) continue;
				callback(child);
			}
		};

		forEachChild(this.instance.Top.Center.Main, (child) => (child.Visible = false));
		forEachChild(this.instance.Top.Right, (child) => (child.Visible = false));
	}

	registerTopCenterButton<T extends GuiButton>(name: string): AnimatedListControl<T> {
		const button = this.parent(new AnimatedListControl(this.instance.Top.Center.Main.WaitForChild(name) as T));
		button.instance.Visible = true;
		button.visible.changed.Connect((visible) => {
			button.instance.Visible = visible;
		});

		return button;
	}
	registerTopRightButton<T extends GuiButton>(name: string): AnimatedListControl<T> {
		const button = this.parent(new AnimatedListControl(this.instance.Top.Right.WaitForChild(name) as T));
		button.instance.Visible = true;
		button.visible.changed.Connect((visible) => {
			button.instance.Visible = visible;
		});

		return button;
	}
}

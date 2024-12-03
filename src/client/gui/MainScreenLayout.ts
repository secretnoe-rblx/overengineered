import { LoadingController } from "client/controller/LoadingController";
import { HotbarControl } from "client/gui/buildmode/HotbarControl";
import { Interface } from "client/gui/Interface";
import { Control } from "engine/client/gui/Control";
import { Component } from "engine/shared/component/Component";
import { ComponentInstance } from "engine/shared/component/ComponentInstance";
import { Transforms } from "engine/shared/component/Transforms";
import { TransformService } from "engine/shared/component/TransformService";
import type { HotbarControlDefinition } from "client/gui/buildmode/HotbarControl";

//

type MainScreenLayoutDefinition = ScreenGui & {
	readonly Top: GuiObject & {
		readonly Center: GuiObject & {
			readonly Main: GuiObject;
			readonly Secondary: GuiObject;
		};
		readonly Right: GuiObject;
	};
	readonly Left: GuiObject;
};
@injectable
export class MainScreenLayout extends Component {
	private readonly instance: MainScreenLayoutDefinition;

	constructor(@inject di: DIContainer) {
		super();

		this.instance = Interface.getInterface2();
		ComponentInstance.init(this, this.instance);
		this.onEnabledStateChange((enabled) => (this.instance.Enabled = enabled));

		const initHotbar = () => {
			const hotbar = this.parent(
				di.resolveForeignClass(HotbarControl, [
					Interface.getInterface2<{ Hotbar: HotbarControlDefinition }>().Hotbar,
				]),
			);

			const visibilityFunction = Transforms.boolStateMachine(
				hotbar.instance,
				TransformService.commonProps.quadOut02,
				{ AnchorPoint: new Vector2(0.5, 1) },
				{ AnchorPoint: new Vector2(0.5, 0) },
				(tr, enabled) => (enabled ? tr.show(hotbar.instance) : 0),
				(tr, enabled) => (enabled ? 0 : tr.hide(hotbar.instance)),
			);
			hotbar.onEnabledStateChange(visibilityFunction);

			this.event.subscribeObservable(LoadingController.isLoading, (loading) => hotbar.setEnabled(!loading), true);
		};
		initHotbar();

		const forEachChild = (parent: Instance, callback: (child: GuiObject) => void) => {
			for (const child of parent.GetChildren()) {
				if (!child.IsA("GuiObject")) continue;
				callback(child);
			}
		};

		forEachChild(this.instance.Top.Center.Main, (child) => (child.Visible = false));
		forEachChild(this.instance.Top.Right, (child) => (child.Visible = false));
		forEachChild(this.instance.Left, (child) => (child.Visible = false));
	}

	registerTopCenterButton<T extends GuiButton>(name: string): Control<T> {
		const control = new Control(this.instance.Top.Center.Main.WaitForChild(name) as T);

		const origSize = control.instance.Size;
		control
			.visibilityComponent()
			.addTransformFunc((enabling, tr) =>
				tr
					.func(() => control.setButtonInteractable(enabling))
					.resize(
						control.instance,
						new UDim2(enabling ? origSize.X : new UDim(), origSize.Y),
						Transforms.quadOut02,
					),
			);

		return control;
	}
	registerTopRightButton<T extends GuiButton>(name: string): Control<T> {
		const control = new Control(this.instance.Top.Right.WaitForChild(name) as T);
		control.isVisible.subscribe((visible) => {
			control.instance.Visible = visible;
		});

		return control;
	}

	registerLeft<T extends GuiObject>(name: string): Control<T> {
		const control = new Control(this.instance.Left.WaitForChild(name) as T);
		control.isVisible.subscribe((visible) => {
			control.instance.Visible = visible;
		});

		return control;
	}
}

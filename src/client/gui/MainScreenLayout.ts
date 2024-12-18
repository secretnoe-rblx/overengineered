import { LoadingController } from "client/controller/LoadingController";
import { HotbarControl } from "client/gui/buildmode/HotbarControl";
import { Interface } from "client/gui/Interface";
import { Control } from "engine/client/gui/Control";
import { Component } from "engine/shared/component/Component";
import { ComponentInstance } from "engine/shared/component/ComponentInstance";
import { Transforms } from "engine/shared/component/Transforms";
import { TransformService } from "engine/shared/component/TransformService";
import type { HotbarControlDefinition } from "client/gui/buildmode/HotbarControl";
import type { Theme, ThemeColorKey } from "client/Theme";
import type { TextButtonDefinition } from "engine/client/gui/Button";

type BottomButtonDefinition = TextButtonDefinition & {
	readonly Frame: GuiObject & {
		readonly ImageLabel: ImageLabel;
	};
};

interface BottomButtonConfig {
	readonly width?: number;
}
type MainScreenBottomLayerDefinition = GuiObject & {
	readonly Template: BottomButtonDefinition;
};
@injectable
class MainScreenBottomLayer extends Control<MainScreenBottomLayerDefinition> {
	private readonly template;

	constructor(
		gui: MainScreenBottomLayerDefinition,
		@inject private readonly theme: Theme,
	) {
		super(gui);
		this.template = this.asTemplate(gui.Template);
	}

	addButton(
		text: string,
		iconId?: number | string,
		background?: ThemeColorKey,
		config?: BottomButtonConfig,
	): Control<BottomButtonDefinition> {
		const control = new Control(this.template());
		control.instance.Name = text;
		control.setButtonText(text.upper());
		control.themeButton(this.theme, background ?? "buttonNormal");
		control.instance.Frame.ImageLabel.Visible = iconId !== undefined;
		control.instance.Frame.ImageLabel.Image = iconId ? `rbxassetid://${iconId}` : "";
		if (config?.width) {
			control.instance.Size = new UDim2(new UDim(0, config.width), control.instance.Size.Y);
		}

		this.parent(control);
		control.instance.Parent = this.gui;

		return control;
	}
}

type MainScreenBottomDefinition = GuiObject & {
	readonly Template: MainScreenBottomLayerDefinition;
};
@injectable
class MainScreenBottom extends Control<MainScreenBottomDefinition> {
	private readonly template;

	constructor(
		gui: MainScreenBottomDefinition,
		@inject private readonly di: DIContainer,
	) {
		super(gui);
		gui.Template.Visible = false;
		this.template = this.asTemplate(gui.Template);
	}

	push(): MainScreenBottomLayer {
		const control = this.di.resolveForeignClass(MainScreenBottomLayer, [this.template()]);
		control.instance.LayoutOrder = -this.gui.GetChildren().size();
		control.instance.Parent = this.gui;

		return control;
	}
}

type MainScreenLayoutDefinition = GuiObject & {
	readonly Top: GuiObject & {
		readonly Center: GuiObject & {
			readonly Main: GuiObject;
			readonly Secondary: GuiObject;
		};
		readonly Right: GuiObject;
	};
	readonly Left: GuiObject;
	readonly Bottom: MainScreenBottomDefinition;
};
@injectable
export class MainScreenLayout extends Component {
	private readonly instance: MainScreenLayoutDefinition;
	readonly bottom: MainScreenBottom;

	constructor(@inject di: DIContainer) {
		super();

		this.instance = Interface.getInterface<{ Main: MainScreenLayoutDefinition }>().Main;
		ComponentInstance.init(this, this.instance);

		this.bottom = this.parentGui(di.resolveForeignClass(MainScreenBottom, [this.instance.Bottom]));

		const initHotbar = () => {
			const hotbar = this.parent(
				di.resolveForeignClass(HotbarControl, [
					Interface.getInterface<{ Hotbar: HotbarControlDefinition }>().Hotbar,
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
		control.visibilityComponent().addTransformFunc((enabling) =>
			Transforms.create()
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

		return control;
	}

	registerLeft<T extends GuiObject>(name: string): Control<T> {
		const control = new Control(this.instance.Left.WaitForChild(name) as T);
		control.visibilityComponent().addTransformFunc((enabling) =>
			Transforms.create()
				.transform(
					control.instance as GuiObject,
					"AnchorPoint",
					new Vector2(enabling ? 0 : 1, 0),
					Transforms.quadOut02,
				)
				.moveX(control.instance, new UDim(0, enabling ? 0 : -10), Transforms.quadOut02),
		);

		return control;
	}
}

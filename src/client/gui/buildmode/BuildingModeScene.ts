import { LoadingController } from "client/controller/LoadingController";
import { Anim } from "client/gui/Anim";
import { HotbarControl } from "client/gui/buildmode/HotbarControl";
import { ButtonControl } from "client/gui/controls/Button";
import { Interface } from "client/gui/Interface";
import { Scene } from "client/gui/Scene";
import { requestMode } from "client/modes/PlayModeRequest";
import { ComponentDisabler } from "engine/shared/component/ComponentDisabler";
import { Transforms } from "engine/shared/component/Transforms";
import type { HotbarControlDefinition } from "client/gui/buildmode/HotbarControl";
import type { SavePopup } from "client/gui/popup/SavePopup";
import type { SettingsPopup } from "client/gui/popup/SettingsPopup";
import type { Topbar } from "client/gui/Topbar";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { ToolController } from "client/tools/ToolController";
import type { TransformProps } from "engine/shared/component/Transform";

const addlc = (gui: GuiObject, child: GuiObject, props: TransformProps) => {
	if (child.Visible) return;

	Transforms.parallel(
		Transforms.func(() => {
			const [asc, childcopy] = Anim.createScreenForAnimating(child);
			return Transforms.create() //
				.show(childcopy)
				.fadeInFrom0(childcopy, props)
				.then()
				.destroy(asc);
		}),
		Anim.UIListLayout.animAdd(gui, child, props) //
			.then()
			.show(child),
	).run(child);
};
const removelc = (gui: GuiObject, child: GuiObject, props: TransformProps) => {
	if (!child.Visible) return;

	Transforms.parallel(
		Transforms.func(() => {
			const [asc, childcopy] = Anim.createScreenForAnimating(child);
			return Transforms.create() //
				.show(childcopy)
				.fadeOutFrom1(childcopy, props)
				.then()
				.destroy(asc);
		}),
		Anim.UIListLayout.animRemove(gui, child, props, "hide"),
	).run(child);
};
const aorlc = (add: boolean, gui: GuiObject, child: GuiObject, props: TransformProps) =>
	add ? addlc(gui, child, props) : removelc(gui, child, props);
const props = Transforms.commonProps.quadOut02;

type TopbarButtonsControlDefinition = GuiObject & {
	readonly Run: GuiButton;
	readonly Save: GuiButton;
	readonly Menu: GuiButton;
	//readonly Home: GuiButton;
};
@injectable
class TopbarButtonsControl extends Scene {
	readonly allButtons = ["run", "save", "settings", "home"] as const;
	readonly enabledButtons = new ComponentDisabler(this.allButtons);

	constructor(gui: TopbarButtonsControlDefinition, @inject mode: BuildingMode, @inject di: DIContainer) {
		super();

		const runButton = this.parent(new ButtonControl(gui.Run, () => requestMode("ride")));
		const saveButton = this.parent(new ButtonControl(gui.Save, () => di.resolve<SavePopup>().show()));
		const settingsButton = this.parent(new ButtonControl(gui.Menu, () => di.resolve<SettingsPopup>().show()));
		//const homeButton = this.parent(new ButtonControl(gui.Home, () => mode.teleportToPlot()));

		this.event.subscribeObservable(
			this.enabledButtons.enabled,
			(enabled) => {
				aorlc(enabled.includes("run"), gui, runButton.instance, props);
				aorlc(enabled.includes("save"), gui, saveButton.instance, props);
				aorlc(enabled.includes("settings"), gui, settingsButton.instance, props);
				//homeButton.setVisible(enabled.includes("home"));
			},
			true,
		);

		this.onDisable(() => {
			removelc(gui, runButton.instance, props);
			removelc(gui, saveButton.instance, props);
			removelc(gui, settingsButton.instance, props);
			//removelc(gui, homeButton.instance, props);
		});
	}
}

@injectable
export class BuildingModeScene extends Scene {
	readonly actionbar;

	constructor(
		@inject readonly mode: BuildingMode,
		@inject tools: ToolController,
		@inject topbar: Topbar,
		@inject di: DIContainer,
	) {
		super();

		const topbarButtons = this.parent(
			di.resolveForeignClass(TopbarButtonsControl, [topbar.getButtonsGui("Build")]),
		);

		this.actionbar = topbarButtons;

		const updateActionBarVisibility = () => {
			const visible = !LoadingController.isLoading.get();
			topbarButtons.setEnabled(visible);
		};
		this.event.subscribeObservable(LoadingController.isLoading, updateActionBarVisibility, true);

		const hotbarGui = Interface.getInterface<{ Hotbar: HotbarControlDefinition }>().Hotbar;
		const toolbar = this.parent(new HotbarControl(tools, hotbarGui));

		const updateToolbarVisibility = () => toolbar.setVisible(!LoadingController.isLoading.get());
		this.event.subscribeObservable(LoadingController.isLoading, updateToolbarVisibility);
		this.onEnable(updateToolbarVisibility);
	}
}

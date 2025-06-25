import { ConfirmPopup } from "client/gui/popup/ConfirmPopup";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";
import type { PopupController } from "client/gui/PopupController";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { ToolController } from "client/tools/ToolController";
import type { TutorialController } from "client/tutorial2/TutorialController";
import type { TutorialStepController } from "client/tutorial2/TutorialStepController";

export const testTutorial = (tc: TutorialController, sc: TutorialStepController, firstTime: boolean) => {
	tc.$onInjectAuto(
		(
			mainScreen: MainScreenLayout,
			toolController: ToolController,
			buildingMode: BuildingMode,
			popupController: PopupController,
		) => {
			const gui = tc.gui;

			const tools = buildingMode.tools;

			if (firstTime) {
				gui.progress.setStopAction((stop) => {
					const popup = popupController.showPopup(
						new ConfirmPopup("Are you sure you want to skip the tutorial?", "You DIE if you do that", stop),
					);

					// tutorial full screen fade goes higher than popupController so we override that
					popup.instance.DisplayOrder = gui.instance.DisplayOrder + 1;
				});
			}

			gui.progress.setTitle("Basics tutorial");
			gui.progress.setText("Sample Text");

			sc.step({
				start: (sc, parent) => {
					parent.parent(tc.disableAllInput());
					parent.parent(gui.createFullScreenFade());
					parent.parent(
						gui
							.createText() //
							.withText("Hi engineer! I am play engineers and i'll teach you how to engineer")
							.withText("Click NEXT to CONTINUE")
							.withNext(() => sc.next()),
					);
				},
			});

			sc.multiStep()
				.subStep({
					condition: () => toolController.selectedTool.get() === buildingMode.tools.buildTool,
					ifnot: (parent) => {
						parent.parent(tc.disableAllInputExcept([Enum.KeyCode.One]));
						parent.parentFunc(
							() => toolController.enabledTools.enableOnly(buildingMode.tools.buildTool),
							() => toolController.enabledTools.enableAll(),
						);
						parent.parent(gui.createFullScreenFadeWithHoleAround(mainScreen.hotbar.instance, Vector2.zero));
						parent.parent(
							gui
								.createText() //
								.withPositionAround(mainScreen.hotbar.instance, "up")
								.withText("This is your TOOLBAR")
								.withText("Your HOTS aer here")
								.withText("look CAREFOULY then press BUILD TOOL which is the first one")
								.withText("or key 1 on keyboard or whatevber idk on console"),
						);
					},
				})
				.subStep({
					condition: () =>
						tools.buildTool.gui.blockSelector.selectedCategory.get().sequenceEquals(["Blocks"]),
					ifnot: (parent) => {
						parent.parent(tc.disableAllInput());
						parent.parent(
							gui.createFullScreenFadeWithHoleAround(tools.buildTool.gui.blockSelector.instance),
						);
						parent.parent(
							gui
								.createText() //
								.withPositionAround(tools.buildTool.gui.blockSelector.instance, "right")
								.withText("This is my kingdom come")
								.withText("there category bocks"),
						);
					},
				})
				.subStep({
					condition: () => tools.buildTool.selectedBlock.get()?.id === "block",
					ifnot: (parent) => {
						parent.parent(tc.disableAllInput());
						parent.parent(
							gui.createFullScreenFadeWithHoleAround(tools.buildTool.gui.blockSelector.instance),
						);
						parent.parent(
							gui
								.createText() //
								.withPositionAround(tools.buildTool.gui.blockSelector.instance, "right")
								.withText("NOW")
								.withText("select bock BLOCK"),
						);
					},
				});

			sc.step({
				start: (sc, parent) => {
					parent.parent(tc.disableAllInput());
					parent.parent(gui.createFullScreenFade());
					parent.parent(
						gui
							.createText() //
							.withText("waw based")
							.withText("click <b>next</b> to FINISH")
							.withNext(() => sc.next()),
					);
				},
			});

			sc.next();
		},
	);
};

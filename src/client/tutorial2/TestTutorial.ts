import { ConfirmPopup } from "client/gui/popup/ConfirmPopup";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";
import type { PopupController } from "client/gui/PopupController";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { ToolController } from "client/tools/ToolController";
import type { TutorialStarter } from "client/tutorial2/TutorialStarter";

export const testTutorial = (tutorial: TutorialStarter, firstTime: boolean) => {
	tutorial.$onInjectAuto(
		(
			mainScreen: MainScreenLayout,
			toolController: ToolController,
			buildingMode: BuildingMode,
			popupController: PopupController,
		) => {
			const tc = tutorial.controller;
			const plot = tutorial.plot;
			const step = tutorial.stepController;

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
			gui.progress.setText("Teaching about basics of the gaming");

			step.step((parent, finish) => {
				parent.parent(tc.disableAllInput());
				parent.parent(gui.createFullScreenFade());
				parent.parent(
					gui
						.createText() //
						.withText("Hi engineer! I am play engineers and i'll teach you how to engineer")
						.withText("Click NEXT to CONTINUE")
						.withNext(finish),
				);
			});

			step.sequence()
				.conditional({
					condition: () => toolController.selectedTool.get() === buildingMode.tools.buildTool,
					run: (parent) => {
						parent.parent(tc.disableAllInputExcept([Enum.KeyCode.One]));
						parent.parentFunc(
							() => toolController.enabledTools.enableOnly(buildingMode.tools.buildTool),
							() => toolController.enabledTools.enableAll(),
						);
						parent.parent(gui.createFullScreenFadeWithHoleAround(mainScreen.hotbar.instance, Vector2.zero));
						parent.parent(
							gui
								.createText()
								.withPositionAround(mainScreen.hotbar.instance, "up")
								.withText("This is your TOOLBAR")
								.withText("Your TOOLS are here")
								.withText("look CAREFOULY then press BUILD TOOL which is the first one")
								.withText("or key 1 on keyboard or whatevber idk on console"),
						);
					},
				})
				.conditional({
					condition: () =>
						tools.buildTool.gui.blockSelector.selectedCategory.get().sequenceEquals(["Blocks"]),
					run: (parent) => {
						parent.parent(tc.disableAllInput());
						parent.parent(
							gui.createFullScreenFadeWithHoleAround(tools.buildTool.gui.blockSelector.instance),
						);
						parent.parent(
							gui
								.createText()
								.withPositionAround(tools.buildTool.gui.blockSelector.instance, "right")
								.withText("to build you need blocks This is a block list it has blocks")
								.withText("select cateegory 'blocks'")
								.withText("there category bocks"),
						);
					},
				})
				.conditional({
					condition: () => tools.buildTool.selectedBlock.get()?.id === "block",
					run: (parent) => {
						parent.parent(tc.disableAllInput());
						parent.parent(
							gui.createFullScreenFadeWithHoleAround(tools.buildTool.gui.blockSelector.instance),
						);
						parent.parent(
							gui
								.createText()
								.withPositionAround(tools.buildTool.gui.blockSelector.instance, "right")
								.withText("good, NOW")
								.withText("select bock BLOCK"),
						);
					},
				});

			step.step((parent, finish) => {
				// parent.parent(
				// 	plot.waitForBuild({
				// 		version: 32,
				// 		blocks: [{ id: "block", location: new CFrame(0, 1, 0), uuid: "0" as BlockUuid }],
				// 	}),
				// );

				parent.parent(
					gui
						.createText() //
						.withText("Now using your BUILD TOOL and your BLOCKS.BLOCK, place a BLOCK in the HIGHGLITH")
						.withNext(finish),
				);
			});

			tutorial.start();
		},
	);
};

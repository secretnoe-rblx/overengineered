import { TestTutorialDiff } from "client/tutorial/tutorials/TestTutorial.diff";
import { InputController } from "engine/client/InputController";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { ToolController } from "client/tools/ToolController";
import type { TutorialController, TutorialDescriber, TutorialRunnerPartList } from "client/tutorial/TutorialController";

@injectable
export class TestTutorial implements TutorialDescriber {
	readonly name = "Test tutorial";

	constructor(
		@inject private readonly buildingMode: BuildingMode,
		@inject private readonly toolController: ToolController,
	) {}

	create(t: TutorialController): TutorialRunnerPartList {
		const { diffs, saveVersion } = TestTutorialDiff;
		const toolController = this.toolController;
		const editTool = this.buildingMode.tools.editTool;

		return [
			() => [
				t.funcPart(() => {
					toolController.enabledTools.disableAll();
					this.buildingMode.switchTutorialMode(true);

					t.onDestroy(() => {
						toolController.enabledTools.enableAll();
						editTool.enabledModes.enableAll();
						this.buildingMode.switchTutorialMode(true);
					});
				}),
				t.partNextButton(),
				t.partText("Welcome to Plane Engineers!\nThis tutorial will teach you the basics of the game."),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(this.buildingMode.tools.buildTool)),
				t.processDiff(diffs.d0buildFrame, saveVersion),
				t.partText("First, let's build the frame for our car."),
				t.hintsPart(
					"Select one",
					"Select 'blocks'",
					"Select BLOCK",
					"BLOCK IS COMING",
					"             HIDE",
					"",
					"hint: hold shift to build multiple",
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(this.buildingMode.tools.deleteTool)),
				t.processDiff(diffs.d1deleteBlock, saveVersion),
				t.partText("Whoops, we placed one block too many. Delete it."),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(this.buildingMode.tools.buildTool)),
				t.processDiff(diffs.d2placeServos, saveVersion),
				t.partText("Now place the rotators for rotatoring."),
				t.hintsPart(
					`Hint: You can press ${(() => {
						const it = InputController.inputType.get();
						if (it === "Desktop") return "the middle mouse button";
						if (it === "Touch") return "the pipette button on the inventory";
						return "idk something gamepad button";
					})()} to copy the block`,
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(this.buildingMode.tools.buildTool)),
				t.processDiff(diffs.d3placeSeat, saveVersion),
				t.partText("seat place or vehicl no work"),
			],

			() => [
				t.funcPart(() =>
					toolController.enabledTools.enableOnly(
						this.buildingMode.tools.buildTool,
						this.buildingMode.tools.deleteTool,
					),
				),
				t.processDiff(diffs.d4prtest, saveVersion),
				t.partText("Now delete and place for TESTING mega TESTING."),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(this.buildingMode.tools.configTool)),
				t.processDiff(diffs.d5cfgtest, saveVersion),
				t.partText("Now change the motor config to +W -S !!!!!!!!!!important"),
				t.hintsPart(
					"Select 4 config tool",
					"Select the blockl",
					"Select +",
					"select W",
					"             select -",
					"select S",
					"profit",
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.disableAll()),
				t.partNextButton(),
				t.partText("You are now the maks gaming of plane engineers."),
				t.hintsPart("Important tip: This is a car"),
			],
		];
	}
}

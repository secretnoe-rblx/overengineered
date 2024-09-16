import { InputController } from "client/controller/InputController";
import { ActionController } from "client/modes/build/ActionController";
import { NewBasicPlaneTutorialDiffs } from "client/tutorial/tutorials/NewBasicPlaneTutorial.diff";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { TutorialController, TutorialDescriber, TutorialRunnerPartList } from "client/tutorial/TutorialController";

@injectable
export class BasicPlaneTutorial implements TutorialDescriber {
	readonly name = "Basics/plane";

	constructor(@inject private readonly buildingMode: BuildingMode) {}

	create(t: TutorialController): TutorialRunnerPartList {
		const { saveVersion, diffs } = NewBasicPlaneTutorialDiffs;
		const toolController = this.buildingMode.toolController;
		const editTool = toolController.allTools.editTool;

		return [
			() => [
				t.funcPart(() => {
					ActionController.instance.disable();
					toolController.enabledTools.disableAll();
					this.buildingMode.gui.actionbar.enabledButtons.enableOnly("settings");

					t.onDestroy(() => {
						ActionController.instance.enable();
						toolController.enabledTools.enableAll();
						this.buildingMode.gui.actionbar.enabledButtons.enableAll();
						editTool.enabledModes.enableAll();
					});
				}),
				t.partNextButton(),
				t.partText(
					"Welcome to",
					" ",
					"Plane Engineers",
					"!",
					"\n",
					"This tutorial will teach you how to build a basic plane.",
				),
				t.translatedHintsPart([`Hint: Press "next" to advance`]),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.base, saveVersion),
				t.partText("First, let's build the frame for your plane."),
				t.translatedHintsPart(
					["Select the build tool"],
					[`Select "Blocks"`],
					[`Select "Beam 1x4"`],
					["Place all the highlighted blocks"],
					[""],
					InputController.inputType.get() === "Desktop"
						? ["Hint: Hold shift to build multiple blocks"]
						: ['Hint: Press "++" to build multiple blocks'],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.engineAndSeat, saveVersion),
				t.partText(
					"Now let's place the engine and the seat.\nThe engine will power your plane and the seat will provide a comfortable flight!",
				),
				t.translatedHintsPart(
					["Select the build tool"],
					[`Select "Movement"`],
					[`Select "Rocket"`],
					[`Select "Small Rocket Engine"`],
					["Place all the highlighted blocks"],
					[""],
				),
			],
			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.basicWings, saveVersion),
				t.partText(
					"Well done! Let's use the mirror to speed up the constructruction!\rPlace some wings using it.",
				),
				t.translatedHintsPart(
					["Select the build tool"],
					["Press the mirror button"],
					["Select 'X' to mirror placement by X axis", "Pretty simple, right? Let's now place things"],
					[`Select "Wings"`],
					[`Select and place "Wing 1x4" first`],
					[`Now select and place "Corner Wing 1x4"`],
					[""],
				),
			],
			() => [
				t.funcPart(() => {
					toolController.enabledTools.enableOnly(toolController.allTools.editTool);
					editTool.enabledModes.enableOnly("Move");
				}),
				t.processDiff(diffs.moveAll, saveVersion),
				t.partText("Before the next step, let's move your creation a bit higher."),
				t.translatedHintsPart(
					["Select the edit tool"],
					[`Press "Structure Selection" on right side of your screen`],
					["Press anywhere on your creation"],
					[`Now press "Move" on the bottom of your screen`],
					[`Now drag the green arrow (the one on the top)`, "Well done! Let's continue"],
					[""],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.servo, saveVersion),
				t.partText(
					"It's time to place servomotors.\rThese are used to precisely rotate to a target angle.\rWe're going to control many things using these",
				),
				t.translatedHintsPart(
					["Select the build tool"],
					[`Select "Movement"`],
					[`Select "Motor"`],
					[`Select "Servo"`],
					["Place all the highlighted blocks"],
					[""],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.deleteTool)),
				t.processDiff(diffs.removeExtraServo, saveVersion),
				t.partText("Oh, what's that? Seems that we placed extra servo!\rLet's remove it"),
				t.translatedHintsPart(
					["Select the delete tool"],
					["Remove the highlighted block", "There you go"],
					[""],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.controlWings, saveVersion),
				t.partText("Alright, let's place the rest of the wings"),
				t.translatedHintsPart(
					["Select the build tool"],
					[`Select "Wings"`],
					["Try to find and place the highlighted blocks yourself"],
					[""],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.prepareForWheels, saveVersion),
				t.partText(
					"All your plane lacks now is wheels.\rBut where do we place them?\rOn bearings and hinges of course!",
				),
				t.translatedHintsPart(
					["Select the build tool"],
					[`Select "Blocks"`],
					[`Select "Wedges"`],
					[`Select and place "Wedge 1x1" on highlighted spot on the tail`],
					[`Now go back to the main page of your inventory by selecting red arrow button multiple times`],
					[`Select "Mechanics"`],
					[
						`Select and place "Bearing Shaft" on highlighted spot under the wedges you have placed a few steps earlier`,
					],
					[
						`It's time to disable mirroring by 'X' axis`,
						`Disable mirror in the mirror menu on top your screen`,
					],
					[
						"Very well! Now go back to the main page of your inventory by selecting red arrow button multiple times",
					],
					[`Select "Movement"`],
					[`Select "Motor"`],
					[`Select and place "Small Hinge" on highlighted spot on the front servomotor`],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.buildTool)),
				t.processDiff(diffs.placeWheels, saveVersion),
				t.partText("Almost done! Now just place wheels and we're done with building."),
				t.translatedHintsPart(
					["Select the build tool"],
					[`Select "Blocks"`],
					[`Select "Wheels"`],
					[`Select "Old Wheel"`],
					["Place all the highlighted old fashioned wheels"],
					[""],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.disableAll()),
				t.processDiff(diffs.configureAllServos, saveVersion),
				t.partNextButton(),
				t.partText(
					"Great, now all that remains is to set everything up. Let's begin with base configuration first...",
				),
				t.translatedHintsPart(
					["Select the configuration tool"],
					[
						`Select all of the servos currently placed on your plane${InputController.inputType.get() === "Desktop" ? " using multiselect or continue performing actions with each block separatly" : ""}`,
					],
					[
						`Now take a close look at the menu. Don't change anything yet and if you did then don't worry, we'll get to that.`,
					],
					[
						`In this menu you can configure things to your liking. The part we're going to configure here are angles of servos`,
					],
					[`Now let's do it. Select any number field that is to the left of red trashbin button in the menu`],
					[
						`If you selected first field then enter number 15. If you selected second field then enter number -15`,
						`Wery well! You just configured your first blocks.\rRemember: most of the blocks are configurable`,
					],
					[""],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.configTool)),
				t.processDiff(diffs.configureRoll, saveVersion),
				t.partText(
					"Set up the servos that are used to control horisontal tilt (roll) of your plane.\r These are located just bihind your front main pair of wings.\rThe part these servos control called the aileron wings",
				),
				t.hintsPart(
					"Select the config tool",
					"Select two servo motors behind your front wings",
					"Press on 'W' on the left side to replace it with key 'D'",
					"Replace key 'S' with key 'A'",
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.configTool)),
				t.processDiff(diffs.configurePitch, saveVersion),
				t.partText(
					`Great. Now we need to adjust the back wings.\rThey are responsible for the forward tilt (pitch)`,
				),
				t.hintsPart(
					"Select the config tool",
					"Select the tail servo on the right side of your plane",
					"Replace key 'W' with key 'S'.\rIf the second button had same key bind then they would just switch places",
					"If bottom key is not set to 'W' then replace it with 'W'",
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.disableAll()),
				t.partNextButton(),
				t.partText("We're almost done! Very soon you'll have your plane flying."),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.configTool)),
				t.processDiff(diffs.configureYaw, saveVersion),
				t.partText(
					"Time to configure last two servos. One is on the back (on top of your tail) and another right under the nose of your plane",
				),
				t.translatedHintsPart(
					["Select the config tool"],
					[
						`Select both servos${InputController.inputType.get() === "Desktop" ? " using multiselect or continue performing actions with each block separatly" : ""}`,
					],
					["Replace first key with 'Q'"],
					["Replace second key with 'E'"],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(toolController.allTools.configTool)),
				t.processDiff(diffs.configureEngine, saveVersion),
				t.partText("And, finally, adjust the engine controls"),
				t.translatedHintsPart(
					["Select the config tool"],
					["Select the small rocket engine you placed in the beginning"],
					["Replace first key with 'Z'"],
					["Replace second key with 'X'"],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.disableAll()),
				t.partNextButton(),
				t.partText(
					`Your plane is ready! When you're ready, just press triangle ("PLAY") button on the top of your screen.`,
					`This is the last message. You can replay tutorial any moment, just go to the settings (near "PLAY" button) while none of tools are selected.\rGood luck!`,
				),
			],
		];
	}
}

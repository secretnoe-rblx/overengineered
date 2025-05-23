import { TutorialController } from "client/tutorial2/TutorialController";
import { Component } from "engine/shared/component/Component";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { ToolController } from "client/tools/ToolController";

class TutorialStepComponent extends Component {
	parentFunc(init: () => void, clear: () => void) {
		init();
		this.onDestroy(clear);
	}
	parentDestroy(connection: SignalConnection) {
		this.onDestroy(() => connection.Disconnect());
		return connection;
	}
}

interface Step {
	readonly getCount?: () => number;
	readonly start: (controller: StepController, parent: TutorialStepComponent) => void;
}
class StepController extends Component {
	private steps: Step[] = [];
	private currentIndex = -1;
	private current?: TutorialStepComponent;

	constructor(private readonly controller: TutorialController) {
		super();

		this.onDestroy(() => this.stop());
	}

	stop() {
		this.controller.gui.progress.setProgress(1);
		this.current?.destroy();
	}

	step(step: Step) {
		this.steps.push(step);
	}
	multiStep() {
		interface Require {
			readonly condition: () => boolean;
			readonly ifnot: (parent: TutorialStepComponent) => void;
		}
		class MultiStep {
			private readonly requires: Require[] = [];

			getCount(): number {
				return this.requires.size();
			}

			require(req: Require): this {
				return this;
			}
		}

		const ms = new MultiStep();
		this.steps.push({
			getCount: () => ms.getCount(),
			start: (controller, parent) => {
				//
			},
		});

		return ms;
	}
	next() {
		this.current?.destroy();

		this.currentIndex++;
		this.controller.gui.progress.setProgress(this.currentIndex / this.steps.size());
		if (this.currentIndex >= this.steps.size()) {
			this.stop();
			return;
		}

		this.current = new TutorialStepComponent();
		this.parent(this.current);
		this.steps[this.currentIndex].start(this, this.current);
	}
}

@injectable
export class TestTutorial extends Component {
	constructor(
		@inject mainScreen: MainScreenLayout,
		@inject toolController: ToolController,
		@inject buildingMode: BuildingMode,
	) {
		super();
		const tc = this.parent(new TutorialController());
		const gui = tc.gui;

		const sc = this.parent(new StepController(tc));

		const tools = buildingMode.tools;

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
						.withNext(() => sc.next()),
				);
			},
		});

		sc.multiStep()
			.require({
				condition: () => toolController.selectedTool.get() === buildingMode.tools.buildTool,
				ifnot: (parent) => {
					parent.parent(tc.disableAllInput([Enum.KeyCode.One]));
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
			.require({
				condition: () => tools.buildTool.selectedBlock.get()?.id === "block",
				ifnot: (parent) => {
					parent.parent(tc.disableAllInput());
					parent.parent(gui.createFullScreenFadeWithHoleAround(tools.buildTool.gui.blockSelector.instance));
					parent.parent(
						gui
							.createText() //
							.withPositionAround(tools.buildTool.gui.blockSelector.instance, "right")
							.withText("This is my kingdom come")
							.withText("there category bocks")
							.withText("then select bock BLOCK"),
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
						.withNext(() => sc.next()),
				);
			},
		});

		sc.next();
	}
}

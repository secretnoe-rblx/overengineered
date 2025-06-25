import { TutorialController } from "client/tutorial2/TutorialController";
import { Component } from "engine/shared/component/Component";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { ToolController } from "client/tools/ToolController";
import type { ComponentParentConfig } from "engine/shared/component/Component";

/**
 * A component which gets created upon (sub-)step start and gets destroyed upon its completion.
 * Used for parenting step-only components, starting remporary tasks or resolving objects from DI
 */
class TutorialStepComponent extends Component {
	/** Immediately runs {@link init}. Runs {@link clear} upon destroy */
	parentFunc(init: () => void, clear: () => void) {
		init();
		this.onDestroy(clear);
	}

	/** Subscribes to disconnect {@link connection} upon destroy */
	parentDestroy(connection: SignalConnection) {
		this.onDestroy(() => connection.Disconnect());
		return connection;
	}

	/** Parents a component to this step part, destroying it when the step finishes */
	override parent<T extends Component>(child: T, config?: ComponentParentConfig): T {
		return super.parent(child, config);
	}
}

/** A tutorial step. */
interface Step {
	/** Returns sub-step count for calculating progress */
	readonly getCount?: () => number;

	/**
	 * Function which is invoked when this step starts
	 * @param controller The step controller
	 * @param parent A component which will get destroyed upon this step completion
	 */
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

	/** Stops the tutorial and destroys itself */
	stop() {
		this.controller.gui.progress.setProgress(1);
		this.current?.destroy();
		this.destroy();
	}

	/** Adds a normal step */
	step(step: Step) {
		this.steps.push(step);
	}

	/** Creates a multi-step, in which every previous condition have to be true to finish this step */
	multiStep() {
		/** Tutorial sub-step */
		interface SubStep {
			/** Condition to be checked. **Evaluates every frame when this (or any further) sub-step is active.** */
			readonly condition: () => boolean;

			/**
			 * Function which is invoked when this {@link condition} is false (but every previous sub-step condition is true).
			 * Basically {@link Step.start} but for sub-steps
			 * @param parent A component which will get destroyed upon this sub-step completion
			 */
			readonly ifnot: (parent: TutorialStepComponent) => void;
		}
		class MultiStep {
			readonly requires: SubStep[] = [];

			getCount(): number {
				return this.requires.size();
			}

			/** Add a sub-step */
			subStep(req: SubStep): this {
				this.requires.push(req);
				return this;
			}
		}

		const ms = new MultiStep();
		this.steps.push({
			getCount: () => ms.getCount(),
			start: (controller, parent) => {
				let currentReq: SubStep | undefined;
				let p: TutorialStepComponent | undefined;

				const sub = parent.event.loop(0, () => {
					for (const req of ms.requires) {
						if (req.condition()) continue;

						if (currentReq !== req) {
							p?.destroy();
							p = parent.parent(new TutorialStepComponent());
							req.ifnot(p);
						}
						currentReq = req;

						return;
					}

					p?.destroy();
					sub.Disconnect();

					controller.next();
				});
			},
		});

		return ms;
	}

	/** Moves to the next step */
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
				condition: () => tools.buildTool.gui.blockSelector.selectedCategory.get().sequenceEquals(["Blocks"]),
				ifnot: (parent) => {
					parent.parent(tc.disableAllInput());
					parent.parent(gui.createFullScreenFadeWithHoleAround(tools.buildTool.gui.blockSelector.instance));
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
					parent.parent(gui.createFullScreenFadeWithHoleAround(tools.buildTool.gui.blockSelector.instance));
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
	}
}

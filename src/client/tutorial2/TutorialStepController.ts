import { Component } from "engine/shared/component/Component";
import type { TutorialController } from "client/tutorial2/TutorialController";
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
	readonly start: (controller: TutorialStepController, parent: TutorialStepComponent) => void;
}
export class TutorialStepController extends Component {
	private steps: Step[] = [];
	private currentIndex = -1;
	private current?: TutorialStepComponent;

	constructor(private readonly controller: TutorialController) {
		super();
		controller.gui.progress.setStopAction(() => this.stop());
		this.onDestroy(() => this.stop());
	}

	/** Stops the tutorial and destroys itself */
	stop() {
		this.controller.destroy();
		this.current?.destroy();
		this.destroy();
	}

	/** Adds a normal step */
	step(step: Step) {
		this.steps.push(step);
	}

	/** Creates a multi-step, in which every sub-step gets sequentially executed until every condition is true */
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

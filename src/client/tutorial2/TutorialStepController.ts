import { Component } from "engine/shared/component/Component";
import { ArgsSignal } from "engine/shared/event/Signal";
import type { ComponentParentConfig } from "engine/shared/component/Component";

/**
 * A component which gets created upon every step start and gets destroyed upon its completion.
 * Used for parenting step-only components, starting remporary tasks or resolving objects from DI
 */
export class TutorialStepComponent extends Component implements TutorialSkippable {
	private readonly skipped = new ArgsSignal();

	skip() {
		this.skipped.Fire();
		this.skipped.destroy();
	}
	onSkip(func: () => void): this {
		this.skipped.Connect(func);
		return this;
	}

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

	/** Parents multiple components to this step part */
	multiParent(...children: readonly Component[]) {
		for (const child of children) {
			this.parent(child);
		}
	}

	/** Parents a component to this step part, destroying it when the step finishes */
	override parent<T extends Component | (Component & TutorialSkippable)>(
		child: T,
		config?: ComponentParentConfig,
	): T {
		if ("skip" in child) {
			this.onSkip(() => {
				if (!child.isDestroyed()) {
					child.skip();
				}
			});
		}

		return super.parent(child, config);
	}
}

export interface TutorialStepContext {
	/** Sets the progress for the current step sequence */
	readonly setProgress: (percent: number) => void;
}

export interface TutorialSkippable {
	skip(): void;
}

/**
 * Tutorial step with a condition which gets evaluated every frame (when in a sequence), and if false prevents
 */
interface TutorialConditionalStep {
	/** Condition to be checked. **Evaluates every frame when this (or any further) sub-step is active.** */
	readonly condition: () => boolean;

	/**
	 * Function which is invoked when this step starts
	 * @param parent A component which will get destroyed upon this sub-step completion
	 * @param ctx Step context
	 */
	readonly run: (parent: TutorialStepComponent, ctx: TutorialStepContext) => void;
}

/**
 * Tutorial step. Runs its function and destroys itself upon `finish()`.
 * Emulates {@link TutorialConditionalStep.condition}, with it returning `true` after the step has been finished.
 */
interface TutorialStep {
	/**
	 * Function which is invoked when this step starts
	 * @param parent A component which will get destroyed upon this step completion
	 * @param finish Function which finishes this step
	 * @param ctx Step context
	 */
	readonly run: (parent: TutorialStepComponent, finish: () => void, ctx: TutorialStepContext) => void;
}
const tutorialStepToConditional = (step: TutorialStep | TutorialStep["run"]): TutorialConditionalStep => {
	if (typeIs(step, "function")) {
		step = { run: step };
	}

	let finished = false;
	return {
		condition: () => finished,
		run: (parent, ctx) => step.run(parent, () => (finished = true), { ...ctx }),
	};
};

class ExecutorBase {
	protected readonly steps: TutorialConditionalStep[] = [];

	/** Create and add a {@link TutorialStep} step */
	step(step: TutorialStep | TutorialStep["run"]): this {
		return this.conditional(tutorialStepToConditional(step));
	}

	/** Create and add a {@link TutorialConditionalStep} step */
	conditional(step: TutorialConditionalStep): this {
		this.steps.push(step);
		return this;
	}

	/** Create and add a {@link TutorialSequentialExecutor} step */
	sequence(): TutorialSequentialExecutor {
		const ret = new TutorialSequentialExecutor();
		this.step(ret);

		return ret;
	}

	/** Create and add a {@link TutorialParallelExecutor} step. Be careful with this one. */
	parallel(): TutorialParallelExecutor {
		const ret = new TutorialParallelExecutor();
		this.step(ret);

		return ret;
	}

	protected readonly onStart: (() => void)[] = [];
	protected readonly onEnd: (() => void)[] = [];

	/** Adds a function to run when this **executor** starts */
	withOnStart(func: () => void): this {
		this.onStart.push(func);
		return this;
	}
	/** Adds a function to run when this **executor** ends (finished or destroyed) */
	withOnEnd(func: () => void): this {
		this.onEnd.push(func);
		return this;
	}
}

/**
 * Executes every step at the same time until all of them return true in {@link TutorialConditionalStep.condition}.
 * Evaluates the step conditions every frame.
 */
export class TutorialParallelExecutor extends ExecutorBase implements TutorialStep {
	readonly run: TutorialStep["run"] = (parent, finish, ctx) => {
		for (const func of this.onStart) {
			func();
		}

		let completed = 0;

		const nextCtx: TutorialStepContext = {
			...ctx,
			setProgress: (progress) => ctx.setProgress((completed + progress) / this.steps.size()),
		};

		const finished = () => {
			sub.Disconnect();

			ctx.setProgress(1);
			for (const func of this.onEnd) {
				func();
			}
			this.onEnd.clear();
			finish();
		};

		for (const step of this.steps) {
			if (step.condition()) continue;

			const p = parent.parent(new TutorialStepComponent());
			p.onSkip(() => ((step as { condition: () => boolean }).condition = () => true));
			step.run(p, nextCtx);
		}

		parent.onDestroy(() => {
			for (const func of this.onEnd) {
				func();
			}
		});
		const sub = parent.event.loop(0, () => {
			completed = 0;
			for (const step of this.steps) {
				if (step.condition()) {
					completed++;
					continue;
				}

				return;
			}

			finished();
		});
	};
}

/**
 * Executes every step sequentially until all of them return true in {@link TutorialConditionalStep.condition}.
 *
 * Evaluates the step conditions every frame sequentially until finds a `false`, upon which starts that step.
 * If any previous step condition starts returning `false`, destroys the current step and starts that one.
 */
export class TutorialSequentialExecutor extends ExecutorBase implements TutorialStep {
	private currentParent?: TutorialStepComponent;

	skipCurrentSubstep() {
		this.currentParent?.skip();
	}

	readonly run: TutorialStep["run"] = (parent, finish, ctx) => {
		for (const func of this.onStart) {
			func();
		}

		let currentReq: TutorialConditionalStep | undefined;
		let p: TutorialStepComponent | undefined;

		parent.onDestroy(() => {
			for (const func of this.onEnd) {
				func();
			}
		});

		const finished = () => {
			p?.destroy();
			sub.Disconnect();

			ctx.setProgress(1);
			for (const func of this.onEnd) {
				func();
			}
			this.onEnd.clear();
			finish();
		};

		parent.onSkip(() => {
			sub.Disconnect();
			p?.destroy();

			for (let i = 0; i < this.steps.size(); i++) {
				const step = this.steps[i];
				if (step.condition()) continue;

				const p = parent.parent(new TutorialStepComponent());
				step.run(p, {
					...ctx,
					setProgress: (progress) => ctx.setProgress((i + progress) / this.steps.size()),
				});
				p.skip();
			}

			finished();
		});
		const sub = parent.event.loop(0, () => {
			for (let i = 0; i < this.steps.size(); i++) {
				const step = this.steps[i];
				if (step.condition()) continue;

				if (currentReq !== step) {
					p?.destroy();
					ctx.setProgress(i / this.steps.size());
					this.currentParent = p = parent.parent(new TutorialStepComponent());
					p.onSkip(() => ((step as { condition: () => boolean }).condition = () => true));

					const nextCtx: TutorialStepContext = {
						...ctx,
						setProgress: (progress) => ctx.setProgress((i + progress) / this.steps.size()),
					};
					step.run(p, nextCtx);
				}
				currentReq = step;

				return;
			}

			finished();
		});
	};
}

import { Component } from "engine/shared/component/Component";
import type { ComponentParentConfig } from "engine/shared/component/Component";

/**
 * A component which gets created upon every step start and gets destroyed upon its completion.
 * Used for parenting step-only components, starting remporary tasks or resolving objects from DI
 */
export class TutorialStepComponent extends Component {
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
	override parent<T extends Component>(child: T, config?: ComponentParentConfig): T {
		return super.parent(child, config);
	}
}

export interface TutorialStepContext {
	/** Sets the progress for the current step sequence */
	readonly setProgress: (percent: number) => void;
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
 * Tutorial step. Runs its function and destroys itself upon `complete()`.
 * Emulates {@link TutorialConditionalStep.condition}, with it returning `true` after the step has been completed.
 */
interface TutorialStep {
	/**
	 * Function which is invoked when this step starts
	 * @param parent A component which will get destroyed upon this step completion
	 * @param complete Function which completes this step
	 * @param ctx Step context
	 */
	readonly run: (parent: TutorialStepComponent, complete: () => void, ctx: TutorialStepContext) => void;
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
}

/**
 * Executes every step at the same time until all of them return true in {@link TutorialConditionalStep.condition}.
 * Evaluates the step conditions every frame.
 */
export class TutorialParallelExecutor extends ExecutorBase implements TutorialStep {
	readonly run: TutorialStep["run"] = (parent, complete, ctx) => {
		let completed = 0;

		const nextCtx: TutorialStepContext = {
			...ctx,
			setProgress: (progress) => ctx.setProgress((completed + progress) / this.steps.size()),
		};

		for (const step of this.steps) {
			if (step.condition()) continue;

			const p = parent.parent(new TutorialStepComponent());
			step.run(p, nextCtx);
		}

		const sub = parent.event.loop(0, () => {
			completed = 0;
			for (const step of this.steps) {
				if (step.condition()) {
					completed++;
					continue;
				}

				return;
			}

			sub.Disconnect();

			ctx.setProgress(1);
			complete();
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
	readonly run: TutorialStep["run"] = (parent, complete, ctx) => {
		let currentReq: TutorialConditionalStep | undefined;
		let p: TutorialStepComponent | undefined;

		const sub = parent.event.loop(0, () => {
			for (let i = 0; i < this.steps.size(); i++) {
				const step = this.steps[i];
				if (step.condition()) continue;

				if (currentReq !== step) {
					p?.destroy();
					ctx.setProgress(i / this.steps.size());
					p = parent.parent(new TutorialStepComponent());

					const nextCtx: TutorialStepContext = {
						...ctx,
						setProgress: (progress) => ctx.setProgress((i + progress) / this.steps.size()),
					};
					step.run(p, nextCtx);
				}
				currentReq = step;

				return;
			}

			p?.destroy();
			sub.Disconnect();

			ctx.setProgress(1);
			complete();
		});
	};
}

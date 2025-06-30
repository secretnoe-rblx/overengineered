import { TutorialController } from "client/tutorial2/TutorialController";
import { TutorialPlotController } from "client/tutorial2/TutorialPlotController";
import { TutorialSequentialExecutor, TutorialStepComponent } from "client/tutorial2/TutorialStepController";
import { Component } from "engine/shared/component/Component";
import { Transforms } from "engine/shared/component/Transforms";
import { ArgsSignal } from "engine/shared/event/Signal";
import type { TutorialStepContext } from "client/tutorial2/TutorialStepController";

export class TutorialStarter extends Component {
	readonly stepController = new TutorialSequentialExecutor();

	readonly controller = this.parent(new TutorialController());
	readonly plot = this.parent(new TutorialPlotController(this));
	private readonly skipped = new ArgsSignal();

	constructor() {
		super();
		this.controller.gui.progress.setStopAction(() => this.destroy());
		this.controller.gui.progress.setSkipAction(() => this.skipped.Fire());
	}

	start() {
		const sparent = this.parent(new TutorialStepComponent());

		const ctx: TutorialStepContext = {
			setProgress: (progress) => this.controller.gui.progress.setProgress(progress),
		};
		const finish = () => {
			ctx.setProgress(1);
			task.spawn(() => {
				const t = this.controller.gui.progress.addTask("Finishing the tutorial...", 1);
				t.hideProgressText();

				Transforms.create() //
					.funcTransform(1, 0, (v) => t.setProgress(v, 1), { duration: 1, style: "Linear" })
					.then()
					.func(() => this.destroy())
					.run(t);
			});
		};

		this.skipped.Connect(() => this.stepController.skipCurrentSubstep());
		this.stepController.run(sparent, finish, ctx);
	}
}

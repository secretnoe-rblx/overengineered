import { TutorialController } from "client/tutorial2/TutorialController";
import { TutorialPlotController } from "client/tutorial2/TutorialPlotController";
import { TutorialSequentialExecutor, TutorialStepComponent } from "client/tutorial2/TutorialStepController";
import { Component } from "engine/shared/component/Component";
import type { TutorialStepContext } from "client/tutorial2/TutorialStepController";

export class TutorialStarter extends Component {
	readonly stepController = new TutorialSequentialExecutor();

	readonly controller = this.parent(new TutorialController());
	readonly plot = this.parent(new TutorialPlotController());

	constructor() {
		super();
		this.controller.gui.progress.setStopAction(() => this.destroy());
	}

	start() {
		const sparent = this.parent(new TutorialStepComponent());

		const complete = () => {
			print("finshed");
			this.destroy();
		};
		const ctx: TutorialStepContext = {
			setProgress: (progress) => this.controller.gui.progress.setProgress(progress),
		};
		this.stepController.run(sparent, complete, ctx);
	}
}

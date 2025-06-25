import { TutorialController } from "client/tutorial2/TutorialController";
import { TutorialStepController } from "client/tutorial2/TutorialStepController";
import { Component } from "engine/shared/component/Component";

export namespace Tutorial {
	export function create(func: (tc: TutorialController, sc: TutorialStepController) => void) {
		const component = new Component();
		const tc = component.parent(new TutorialController());
		const sc = component.parent(new TutorialStepController(tc));
		tc.onDestroy(() => component.destroy());
		sc.onDestroy(() => component.destroy());

		func(tc, sc);
		return component;
	}
}

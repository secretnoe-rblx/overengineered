import { TestTutorial } from "client/tutorial2/TestTutorial";
import { TutorialStarter } from "client/tutorial2/TutorialStarter";
import { TextButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { Element } from "engine/shared/Element";
import type { GameHost } from "engine/shared/GameHost";
import type { UnitTests } from "engine/shared/TestFramework";

namespace TestTutorialTests {
	export function show(di: DIContainer) {
		return new Control(
			Element.create(
				"Frame",
				{
					Size: new UDim2(1, 0, 1, 0),
					BackgroundTransparency: 1,
				},
				{
					list: Element.create("UIListLayout", { FillDirection: Enum.FillDirection.Vertical }),
					b6: TextButtonControl.create({
						Text: "Test tutorial",
						Size: new UDim2(0, 200, 0, 30),
					})
						.with((b) =>
							b.activated.Connect(() => {
								const stepController = new TutorialStarter();
								TestTutorial.start(stepController, true);
								di.resolve<GameHost>().parent(stepController);
							}),
						)
						.with((b) => b.enable()).instance,
				},
			),
		);
	}
}
export const _Tests: UnitTests = { TestTutorialTests };

import { ControlsPopup } from "client/gui/popup/ControlsPopup";
import { SavePopup } from "client/gui/popup/SavePopup";
import { WikiPopup } from "client/gui/popup/WikiPopup";
import { PlayerDataStorage } from "client/PlayerDataStorage";
import { TextButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { Element } from "engine/shared/Element";
import type { PopupController } from "client/gui/PopupController";
import type { UnitTests } from "engine/shared/TestFramework";

namespace PopupTests {
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
					b5123: TextButtonControl.create({
						Text: "Saves MAKS",
						Size: new UDim2(0, 200, 0, 30),
					})
						.with((b) =>
							b.activated.Connect(() => {
								const pds = PlayerDataStorage.forPlayer(2880942160);
								const scope = di.beginScope((builder) => {
									builder.registerSingletonValue(pds);
								});

								scope.resolve<PopupController>().showPopup(scope.resolveForeignClass(SavePopup));
							}),
						)
						.with((b) => b.enable()).instance,
					b6: TextButtonControl.create({
						Text: "Wiki",
						Size: new UDim2(0, 200, 0, 30),
					})
						.with((b) =>
							b.activated.Connect(() =>
								di.resolve<PopupController>().showPopup(di.resolveForeignClass(WikiPopup)),
							),
						)
						.with((b) => b.enable()).instance,
					b7: TextButtonControl.create({
						Text: "Controls",
						Size: new UDim2(0, 200, 0, 30),
					})
						.with((b) =>
							b.activated.Connect(() =>
								di.resolve<PopupController>().showPopup(di.resolveForeignClass(ControlsPopup)),
							),
						)
						.with((b) => b.enable()).instance,
				},
			),
		);
	}
}
export const _Tests: UnitTests = { PopupTests };

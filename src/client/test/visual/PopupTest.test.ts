import { ControlsPopup } from "client/gui/popup/ControlsPopup";
import { WikiPopup } from "client/gui/popup/WikiPopup";
import { TextButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { Element } from "engine/shared/Element";
import type { PopupController } from "client/gui/PopupController";
import type { UnitTests } from "engine/shared/TestFramework";

namespace PopupTests {
	export function show(di: DIContainer) {
		let idtb: TextBox;

		return new Control(
			Element.create(
				"Frame",
				{
					Size: new UDim2(1, 0, 1, 0),
					BackgroundTransparency: 1,
				},
				{
					list: Element.create("UIListLayout", { FillDirection: Enum.FillDirection.Vertical }),
					idtb: (idtb = Element.create("TextBox", {
						Text: "2235259826",
						Size: new UDim2(0, 200, 0, 30),
					})),
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

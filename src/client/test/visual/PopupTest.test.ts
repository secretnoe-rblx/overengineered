import { AlertPopup } from "client/gui/popup/AlertPopup";
import { ConfirmPopup } from "client/gui/popup/ConfirmPopup";
import { SelectButtonPopup } from "client/gui/popup/SelectButtonPopup";
import { TextButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { Element } from "engine/shared/Element";
import type { ControlsPopup } from "client/gui/popup/ControlsPopup";
import type { ReportSubmitController } from "client/gui/popup/ReportSubmitPopup";
import type { SavePopup } from "client/gui/popup/SavePopup";
import type { WikiPopup } from "client/gui/popup/WikiPopup";
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
					b1: TextButtonControl.create({
						Text: "Confirmation",
						Size: new UDim2(0, 200, 0, 30),
					})
						.with((b) =>
							b.activated.Connect(() =>
								ConfirmPopup.showPopup(
									"Show the next popup????",
									"this irreversible !!!",
									() => b.text.set("YES"),
									() => b.text.set("NO"),
								),
							),
						)
						.with((b) => b.enable()).instance,
					b2: TextButtonControl.create({
						Text: "Multi Confirmation",
						Size: new UDim2(0, 200, 0, 30),
					})
						.with((b) =>
							b.activated.Connect(() =>
								ConfirmPopup.showPopup(
									"Show the next popup????",
									"this irreversible !!!",
									() => {
										ConfirmPopup.showPopup(
											"Confirm????",
											"this will do nothing and is irreversible !!!",
											() => {},
											() => {},
										);
									},
									() => {},
								),
							),
						)
						.with((b) => b.enable()).instance,
					b3: TextButtonControl.create({
						Text: "Key Selection",
						Size: new UDim2(0, 200, 0, 30),
					})
						.with((b) =>
							b.activated.Connect(() =>
								SelectButtonPopup.showPopup(
									true,
									(btn) => b.text.set(btn),
									() => b.text.set("CANCEL"),
								),
							),
						)
						.with((b) => b.enable()).instance,
					b5: TextButtonControl.create({
						Text: "Saves",
						Size: new UDim2(0, 200, 0, 30),
					})
						.with((b) => b.activated.Connect(() => di.resolve<SavePopup>().show()))
						.with((b) => b.enable()).instance,
					b6: TextButtonControl.create({
						Text: "Wiki",
						Size: new UDim2(0, 200, 0, 30),
					})
						.with((b) => b.activated.Connect(() => di.resolve<WikiPopup>().show()))
						.with((b) => b.enable()).instance,
					b7: TextButtonControl.create({
						Text: "Controls",
						Size: new UDim2(0, 200, 0, 30),
					})
						.with((b) => b.activated.Connect(() => di.resolve<ControlsPopup>().show()))
						.with((b) => b.enable()).instance,
					b9: TextButtonControl.create({
						Text: "Alert",
						Size: new UDim2(0, 200, 0, 30),
					})
						.with((b) => b.activated.Connect(() => AlertPopup.showPopup("Important information")))
						.with((b) => b.enable()).instance,
					b10: TextButtonControl.create({
						Text: "Report",
						Size: new UDim2(0, 200, 0, 30),
					})
						.with((b) =>
							b.activated.Connect(() =>
								di.resolve<ReportSubmitController>().submit({ text: "test_data" }),
							),
						)
						.with((b) => b.enable()).instance,
				},
			),
		);
	}
}
export const _Tests: UnitTests = { PopupTests };

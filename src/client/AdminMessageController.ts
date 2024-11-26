import { GuiAnimator } from "client/gui/GuiAnimator";
import { Interface } from "client/gui/Interface";
import { TextButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { TextBoxControl } from "engine/client/gui/TextBoxControl";
import { Element } from "engine/shared/Element";
import { Colors } from "shared/Colors";
import { Remotes } from "shared/Remotes";

Remotes.Client.GetNamespace("Admin")
	.Get("SendMessage")
	.Connect((text, color, duration) => {
		const label = Element.create("TextLabel", {
			Text: text,
			BackgroundTransparency: 1,
			Size: new UDim2(1, 0, 1, 0),
			TextScaled: true,
			TextColor3: color ?? Colors.red,
			Parent: Interface.getGameUI(),
		});

		GuiAnimator.transition(label, 0.33, "down");
		task.delay(duration ?? 3, () => {
			GuiAnimator.hide(label, 0.33, "up");
			task.delay(0.33, () => label.Destroy());
		});
	});

export namespace AdminMessageController {
	// empty method to trigger subscription
	export function initialize() {}

	export function send(text: string, color?: Color3, duration?: number) {
		Remotes.Client.GetNamespace("Admin").Get("SendMessage").SendToServer(text, color, duration);
	}

	export function createControl() {
		const tb = new TextBoxControl(
			Element.create("TextBox", { Size: new UDim2(0, 500, 0, 30), ClearTextOnFocus: false, AutoLocalize: false }),
		);

		return new Control(
			Element.create(
				"Frame",
				{ Size: new UDim2(1, 0, 1, 0), BackgroundTransparency: 1 },
				{
					list: Element.create("UIListLayout", {
						FillDirection: Enum.FillDirection.Vertical,
						SortOrder: Enum.SortOrder.LayoutOrder,
					}),
				},
			),
		)
			.withParented(
				TextButtonControl.create({ Text: "test", Size: new UDim2(0, 100, 0, 30) }, () =>
					AdminMessageController.send("MESSAGE TEST THIS IS A WARNING\nNOT"),
				),
			)
			.withParented(
				TextButtonControl.create({ Text: "restart", Size: new UDim2(0, 100, 0, 30) }, () =>
					AdminMessageController.send("Server restart\nSave your builds"),
				),
			)
			.withParented(tb)
			.withParented(
				TextButtonControl.create({ Text: "custom", Size: new UDim2(0, 100, 0, 30) }, () =>
					AdminMessageController.send(tb.text.get()),
				),
			);
	}
}

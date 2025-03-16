import { GuiService } from "@rbxts/services";
import { Interface } from "client/gui/Interface";
import { ButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";

type TextPopupDefinition = GuiObject & {
	readonly Heading: Frame & {
		readonly CloseButton: TextButton;
		readonly TitleLabel: TextLabel;
	};
	readonly DoneButton: TextButton;
	readonly ScrollingFrame: ScrollingFrame & {
		readonly TextBox: TextBox;
	};
};

export class TextPopup extends Control<TextPopupDefinition> {
	private readonly doneButton;
	private readonly closeButton;

	constructor(text: string, ps: string = "", okFunc: (text: string) => void, noFunc: () => void) {
		const gui = Interface.getGameUI<{ Popup: { Text: TextPopupDefinition } }>().Popup.Text.Clone();
		super(gui);

		this.doneButton = this.parent(new ButtonControl(gui.DoneButton));
		this.closeButton = this.parent(new ButtonControl(gui.Heading.CloseButton));

		gui.Heading.TitleLabel.Text = text;
		gui.ScrollingFrame.TextBox.PlaceholderText = ps;
		this.event.subscribe(this.doneButton.activated, () => {
			okFunc(gui.ScrollingFrame.TextBox.Text);
			this.hide();
		});
		this.event.subscribe(this.closeButton.activated, () => {
			noFunc();
			this.hide();
		});

		this.event.onPrepareGamepad(() => (GuiService.SelectedObject = gui.ScrollingFrame.TextBox));
	}
}

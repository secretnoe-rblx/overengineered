import { Interface } from "client/gui/Interface";
import { TextButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";

type IDEPopupDefinition = GuiObject & {
	readonly Heading: Frame & {
		readonly CloseButton: TextButton;
		readonly TitleLabel: TextLabel;
	};
	readonly Content: Frame & {
		LimitReached: TextLabel;
		Buttons: {
			SaveButton: TextButton;
			CancelButton: TextButton;
		};
		Content: Frame & {
			ScrollingFrame: ScrollingFrame & {
				TextBox: TextBox;
			};
		};
	};
};

export default class IDEPopup extends Control<IDEPopupDefinition> {
	private saveButton: TextButtonControl = undefined!;

	constructor(lengthLimit: number, code: string, callback: (data: string) => void) {
		const gui = Interface.getInterface<{
			Popups: { Crossplatform: { IDE: IDEPopupDefinition } };
		}>().Popups.Crossplatform.IDE.Clone();
		super(gui);

		gui.Content.Content.ScrollingFrame.TextBox.Text = code;
		this.saveButton = new TextButtonControl(gui.Content.Buttons.SaveButton);

		this.event.subscribe(gui.Content.Content.ScrollingFrame.TextBox.GetPropertyChangedSignal("Text"), () => {
			if (gui.Content.Content.ScrollingFrame.TextBox.Text.size() > lengthLimit) {
				gui.Content.LimitReached.Visible = true;
				gui.Content.LimitReached.Text = `⚠️ Limit of ${lengthLimit} characters reached. (${gui.Content.Content.ScrollingFrame.TextBox.Text.size()})`;
				this.saveButton.buttonInteractabilityComponent().setInteractable(false);
			} else {
				gui.Content.LimitReached.Visible = false;
				this.saveButton.buttonInteractabilityComponent().setInteractable(true);
			}
		});

		this.parent(new Control(gui.Heading.CloseButton).addButtonAction(() => this.hideThenDestroy()));
		this.parent(new Control(gui.Content.Buttons.CancelButton).addButtonAction(() => this.hideThenDestroy()));
		this.parent(
			this.saveButton.addButtonAction(() => {
				callback(gui.Content.Content.ScrollingFrame.TextBox.Text);

				this.hide();
			}),
		);
	}
}

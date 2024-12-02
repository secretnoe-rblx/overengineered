import { GuiService } from "@rbxts/services";
import { SoundController } from "client/controller/SoundController";
import { Interface } from "client/gui/Interface";
import { Popup } from "client/gui/Popup";
import { Control } from "engine/client/gui/Control";
import type { ButtonDefinition } from "engine/client/gui/Button";

export type AlertPopupDefinition = GuiObject & {
	readonly Content: Frame & {
		readonly Text: TextLabel;
		readonly Buttons: {
			readonly OkButton: TextButton;
		};
	};
	readonly Heading: {
		readonly CloseButton: ButtonDefinition;
	};
};

export class AlertPopup extends Popup<AlertPopupDefinition> {
	private readonly okButton;

	static showPopup(text: string, okFunc?: () => void) {
		const popup = new AlertPopup(
			Interface.getGameUI<{
				Popup: { Crossplatform: { Alert: AlertPopupDefinition } };
			}>().Popup.Crossplatform.Alert.Clone(),
			text,
			okFunc,
		);

		popup.show();
	}
	constructor(gui: AlertPopupDefinition, text: string, okFunc?: () => void) {
		super(gui);

		this.okButton = this.parent(new Control(gui.Content.Buttons.OkButton));

		SoundController.getSounds().Warning.Play();

		gui.Content.Text.Text = text;

		this.okButton.addButtonAction(() => {
			okFunc?.();
			this.hide();
		});

		const closeButton = this.parent(new Control(gui.Heading.CloseButton).withButtonAction(() => this.hide()));

		this.okButton.setButtonInteractable(false);
		closeButton.setButtonInteractable(false);
		task.delay(3, () => {
			this.okButton.setButtonInteractable(true);
			closeButton.setButtonInteractable(true);
		});

		this.event.onPrepareGamepad(() => (GuiService.SelectedObject = this.okButton.instance));
	}
}

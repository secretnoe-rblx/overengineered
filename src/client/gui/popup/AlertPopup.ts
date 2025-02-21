import { GuiService } from "@rbxts/services";
import { SoundController } from "client/controller/SoundController";
import { Interface } from "client/gui/Interface";
import { Control } from "engine/client/gui/Control";
import type { ButtonDefinition } from "engine/client/gui/Button";

type AlertPopupDefinition = GuiObject & {
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

export class AlertPopup extends Control<AlertPopupDefinition> {
	private readonly okButton;

	constructor(text: string, okFunc?: () => void) {
		const gui = Interface.getGameUI<{
			Popup: { Crossplatform: { Alert: AlertPopupDefinition } };
		}>().Popup.Crossplatform.Alert.Clone();
		super(gui);

		this.okButton = this.parent(new Control(gui.Content.Buttons.OkButton));

		SoundController.getSounds().Warning.Play();

		gui.Content.Text.Text = text;

		this.okButton.addButtonAction(() => {
			okFunc?.();
			this.hide();
		});

		const closeButton = this.parent(new Control(gui.Heading.CloseButton).addButtonAction(() => this.hide()));

		this.okButton.setButtonInteractable(false);
		closeButton.setButtonInteractable(false);
		task.delay(3, () => {
			this.okButton.setButtonInteractable(true);
			closeButton.setButtonInteractable(true);
		});

		this.event.onPrepareGamepad(() => (GuiService.SelectedObject = this.okButton.instance));
	}
}

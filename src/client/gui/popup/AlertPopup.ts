import { GuiService } from "@rbxts/services";
import { SoundController } from "client/controller/SoundController";
import { ButtonControl } from "client/gui/controls/Button";
import { Gui } from "client/gui/Gui";
import { Popup } from "client/gui/Popup";
import type { ButtonDefinition } from "client/gui/controls/Button";

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
			Gui.getGameUI<{
				Popup: { Crossplatform: { Alert: AlertPopupDefinition } };
			}>().Popup.Crossplatform.Alert.Clone(),
			text,
			okFunc,
		);

		popup.show();
	}
	constructor(gui: AlertPopupDefinition, text: string, okFunc?: () => void) {
		super(gui);

		this.okButton = this.add(new ButtonControl(gui.Content.Buttons.OkButton));

		SoundController.getSounds().Warning.Play();

		this.gui.Content.Text.Text = text;
		this.event.subscribe(this.okButton.activated, () => {
			okFunc?.();
			this.hide();
		});
	}

	protected prepareGamepad(): void {
		GuiService.SelectedObject = this.okButton.instance;
	}
}

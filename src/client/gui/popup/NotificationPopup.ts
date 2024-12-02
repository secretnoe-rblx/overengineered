import { GuiService } from "@rbxts/services";
import { SoundController } from "client/controller/SoundController";
import { Interface } from "client/gui/Interface";
import { Popup } from "client/gui/Popup";
import { Control } from "engine/client/gui/Control";
import type { ButtonDefinition } from "engine/client/gui/Button";

export type NotificationPopupDefinition = GuiObject & {
	readonly Content: Frame & {
		readonly TextLabel1: TextLabel;
		readonly TextLabel2: TextLabel;
	};
	readonly Head: {
		readonly CloseButton: ButtonDefinition;
	};
	readonly Buttons: {
		readonly OkButton: TextButton;
	};
};

export class NotificationPopup extends Popup<NotificationPopupDefinition> {
	private readonly okButton;
	private readonly closeButton;

	static showPopup(text: string, ps: string = "") {
		const popup = new NotificationPopup(
			Interface.getGameUI<{ Popup: { Notification: NotificationPopupDefinition } }>().Popup.Notification.Clone(),
			text,
			ps,
		);

		popup.show();
	}
	constructor(gui: NotificationPopupDefinition, text: string, ps: string = "") {
		super(gui);

		this.okButton = this.parent(new Control(gui.Buttons.OkButton));
		this.closeButton = this.parent(new Control(gui.Head.CloseButton));

		SoundController.getSounds().Warning.Play();

		gui.Content.TextLabel1.Text = text;
		gui.Content.TextLabel2.Text = ps;
		this.okButton.addButtonAction(() => this.hide());
		this.closeButton.addButtonAction(() => this.hide());

		this.event.onPrepareGamepad(() => (GuiService.SelectedObject = this.okButton.instance));
	}
}

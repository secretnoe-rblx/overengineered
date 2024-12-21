import { GuiService } from "@rbxts/services";
import { SoundController } from "client/controller/SoundController";
import { Interface } from "client/gui/Interface";
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

export class NotificationPopup extends Control<NotificationPopupDefinition> {
	constructor(text: string, ps: string = "") {
		super(Interface.getGameUI<{ Popup: { Notification: NotificationPopupDefinition } }>().Popup.Notification);

		this.instance.Content.TextLabel1.Text = text;
		this.instance.Content.TextLabel2.Text = ps;
		this.onEnable(() => SoundController.getSounds().Warning.Play());

		const okButton = this.parent(new Control(this.instance.Buttons.OkButton)) //
			.addButtonAction(() => this.hide());
		this.event.onPrepareGamepad(() => (GuiService.SelectedObject = okButton.instance));

		this.parent(new Control(this.instance.Head.CloseButton)) //
			.addButtonAction(() => this.hide());
	}
}

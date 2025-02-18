import { GuiService } from "@rbxts/services";
import { SoundController } from "client/controller/SoundController";
import { Interface } from "client/gui/Interface";
import { Popup } from "client/gui/Popup";
import { Control } from "engine/client/gui/Control";
import { PartialControl } from "engine/client/gui/PartialControl";
import type { ButtonDefinition } from "engine/client/gui/Button";

export type ConfirmPopupDefinition = GuiObject & {
	readonly Content: Frame & {
		readonly TextLabel1: TextLabel;
		readonly TextLabel2: TextLabel;
	};
	readonly Head: {
		readonly CloseButton: ButtonDefinition;
	};
	readonly Buttons: {
		readonly AcceptButton: TextButton;
		readonly CancelButton: TextButton;
	};
};

export class ConfirmPopup extends Popup<ConfirmPopupDefinition> {
	private readonly confirmButton;
	private readonly cancelButton;
	private readonly closeButton;

	static showPopup(text: string, ps: string = "", okFunc?: () => void, noFunc?: () => void) {
		const popup = new ConfirmPopup(
			Interface.getGameUI<{ Popup: { Confirm: ConfirmPopupDefinition } }>().Popup.Confirm.Clone(),
			text,
			ps,
			okFunc,
			noFunc,
		);

		popup.show();
	}
	constructor(gui: ConfirmPopupDefinition, text: string, ps: string = "", okFunc?: () => void, noFunc?: () => void) {
		super(gui);

		this.confirmButton = this.parent(new Control(gui.Buttons.AcceptButton));
		this.cancelButton = this.parent(new Control(gui.Buttons.CancelButton));
		this.closeButton = this.parent(new Control(gui.Head.CloseButton));

		SoundController.getSounds().Warning.Play();

		gui.Content.TextLabel1.Text = text;
		gui.Content.TextLabel2.Text = ps;
		this.confirmButton.addButtonAction(() => {
			okFunc?.();
			this.hide();
		});
		this.cancelButton.addButtonAction(() => {
			noFunc?.();
			this.hide();
		});
		this.closeButton.addButtonAction(() => {
			noFunc?.();
			this.hide();
		});

		this.event.onPrepareGamepad(() => (GuiService.SelectedObject = this.cancelButton.instance));
	}
}

const template = Interface.getInterface<{
	Popups: { Crossplatform: { Confirmation: GuiObject } };
}>().Popups.Crossplatform.Confirmation;
template.Visible = false;

type ConfirmPopupParts = {
	readonly CloseButton: GuiButton;

	readonly TextLabel1: TextLabel;
	readonly TextLabel2: TextLabel;

	readonly AcceptButton: GuiButton;
	readonly CancelButton: GuiButton;
};
export class ConfirmPopup2 extends PartialControl<ConfirmPopupParts> {
	private readonly confirmButton;
	private readonly cancelButton;
	private readonly closeButton;

	constructor(text: string, ps: string = "", okFunc?: () => void, noFunc?: () => void) {
		const gui = template.Clone();
		super(gui);

		this.confirmButton = this.parent(new Control(this.parts.AcceptButton));
		this.cancelButton = this.parent(new Control(this.parts.CancelButton));
		this.closeButton = this.parent(new Control(this.parts.CloseButton));

		SoundController.getSounds().Warning.Play();

		this.parts.TextLabel1.Text = text;
		this.parts.TextLabel2.Text = ps;
		this.confirmButton.addButtonAction(() => {
			okFunc?.();
			this.hide();
		});
		this.cancelButton.addButtonAction(() => {
			noFunc?.();
			this.hide();
		});
		this.closeButton.addButtonAction(() => {
			noFunc?.();
			this.hide();
		});

		this.event.onPrepareGamepad(() => (GuiService.SelectedObject = this.cancelButton.instance));
	}
}

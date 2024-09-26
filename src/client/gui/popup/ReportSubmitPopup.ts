import { Base64 } from "@rbxts/crypto";
import { GuiService, Players } from "@rbxts/services";
import { SoundController } from "client/controller/SoundController";
import { ButtonControl } from "client/gui/controls/Button";
import { Gui } from "client/gui/Gui";
import { Popup } from "client/gui/Popup";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { JSON } from "shared/fixes/Json";
import type { ButtonDefinition } from "client/gui/controls/Button";
import type { PlayerDataStorage } from "client/PlayerDataStorage";
import type { SharedPlot } from "shared/building/SharedPlot";

const processDataForJsonSerializationForSubmit = (data: unknown): unknown => {
	if (typeIs(data, "Instance")) {
		return {
			__type: "Instance",
			instanceType: data.ClassName,
			name: data.Name,
			attributes: data.GetAttributes(),
			tags: data.GetTags(),
		};
	}

	if (typeIs(data, "table")) {
		const toserialize: Partial<Record<string | number | symbol, unknown>> = {};
		for (const [key, value] of pairs(data)) {
			toserialize[key as keyof typeof toserialize] = processDataForJsonSerializationForSubmit(value);
		}

		return toserialize;
	}

	return data;
};

const serialize = (data: unknown): string => {
	const str = JSON.serialize(data);
	return Base64.Encode(str);
};

@injectable
export class ReportSubmitController {
	constructor(
		@inject private readonly plot: SharedPlot,
		@inject private readonly playerDataStorage: PlayerDataStorage,
	) {}

	submit(data: object, text?: string) {
		const popup = new ReportSubmitPopup(
			Gui.getGameUI<{
				Popup: { Crossplatform: { ReportSubmit: ReportSubmitPopupDefinition } };
			}>().Popup.Crossplatform.ReportSubmit.Clone(),
			{
				...data,
				loadedSlotIdx: this.playerDataStorage.loadedSlot.get(),
				// loadedSlot: this.plot.getBlocks(), // too much text
				data: this.playerDataStorage.data.get(),
			},
			text,
		);

		popup.show();
	}
}

type ReportSubmitPopupDefinition = GuiObject & {
	readonly Content: Frame & {
		readonly Text: TextLabel;
		readonly TextBox: TextBox;
		readonly Buttons: {
			readonly OkButton: TextButton;
		};
	};
	readonly Heading: {
		readonly CloseButton: ButtonDefinition;
	};
};
class ReportSubmitPopup extends Popup<ReportSubmitPopupDefinition> {
	private readonly okButton;

	static showPopup(data: unknown, text?: string, okFunc?: () => void) {
		const popup = new ReportSubmitPopup(
			Gui.getGameUI<{
				Popup: { Crossplatform: { ReportSubmit: ReportSubmitPopupDefinition } };
			}>().Popup.Crossplatform.ReportSubmit.Clone(),
			data,
			text,
			okFunc,
		);

		popup.show();
	}
	constructor(gui: ReportSubmitPopupDefinition, data: unknown, text?: string, okFunc?: () => void) {
		super(gui);

		this.okButton = this.add(new ButtonControl(gui.Content.Buttons.OkButton));

		SoundController.getSounds().Warning.Play();

		this.gui.Content.Text.Text =
			text ??
			`
			An error has happened.\nPlease copy the text below and submit a bug report in our community server.
			`.trim();

		try {
			this.gui.Content.TextBox.Text = serialize({
				uid: Players.LocalPlayer.UserId,
				uname: Players.LocalPlayer.Name,
				udname: Players.LocalPlayer.DisplayName,
				text: "Never gonna give you up",
				env: GameDefinitions.getEnvironmentInfo(),
				trace: debug.traceback(undefined, 1)?.split("\n"),
				data: processDataForJsonSerializationForSubmit(data),
			});
		} catch {
			try {
				this.gui.Content.TextBox.Text = serialize({
					env: GameDefinitions.getEnvironmentInfo(),
					data: processDataForJsonSerializationForSubmit(data),
				});
			} catch {
				try {
					this.gui.Content.TextBox.Text = serialize({
						trace: debug.traceback(undefined, 1)?.split("\n"),
					});
				} catch {
					this.gui.Content.TextBox.Text = serialize("[ERRTOOLONG]");
				}
			}
		}

		this.event.subscribe(this.okButton.activated, () => {
			okFunc?.();
			this.hide();
		});
		this.add(new ButtonControl(this.gui.Heading.CloseButton, () => this.hide()));
	}

	protected prepareGamepad(): void {
		GuiService.SelectedObject = this.okButton.instance;
	}
}

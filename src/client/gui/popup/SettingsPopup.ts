import { Interface } from "client/gui/Interface";
import { MultiPlayerConfigControl } from "client/gui/PlayerConfigControls";
import { Popup } from "client/gui/Popup";
import { ButtonControl, TextButtonControl } from "engine/client/gui/Button";
import { Colors } from "shared/Colors";
import { PlayerConfigDefinition } from "shared/config/PlayerConfig";
import type { NewSettingsPopup } from "client/gui/popup/NewSettingsPopup";
import type { PlayerDataStorage } from "client/PlayerDataStorage";
import type { TextButtonDefinition } from "engine/client/gui/Button";
import type { Component } from "engine/shared/component/Component";
import type { GameHostBuilder } from "engine/shared/GameHostBuilder";

export type ConfigPartDefinition<T extends GuiObject> = GuiObject & {
	readonly HeadingLabel: TextLabel;
	readonly Control: T;
};

export type SettingsPopupDefinition = GuiObject & {
	readonly Content: {
		readonly ScrollingFrame: ScrollingFrame;
	};
	readonly Buttons: {
		readonly CancelButton: GuiButton;
	};
	readonly Head: {
		readonly CloseButton: GuiButton;
	};
};

@injectable
/** @deprecated */
export class SettingsPopup extends Popup<SettingsPopupDefinition> {
	static addAsService(host: GameHostBuilder) {
		const gui = Interface.getGameUI<{ Popup: { Settings: SettingsPopupDefinition } }>().Popup.Settings;
		host.services.registerTransientFunc((ctx) => ctx.resolveForeignClass(this, [gui.Clone()]));
	}

	private readonly config;

	constructor(gui: SettingsPopupDefinition, @inject playerData: PlayerDataStorage, @inject di: DIContainer) {
		super(gui);

		this.config = this.parent(new MultiPlayerConfigControl<PlayerConfigDefinition>(gui.Content.ScrollingFrame, di));

		this.event.subscribe(this.config.configUpdated, async (key, value) => {
			await playerData.sendPlayerConfigValue(key, value as PlayerConfig[keyof PlayerConfig]);
		});

		this.parent(new ButtonControl(gui.Buttons.CancelButton, () => this.hide()));
		this.parent(new ButtonControl(gui.Head.CloseButton, () => this.hide()));

		let permbtn: Component | undefined;

		this.event.subscribeObservable(
			playerData.config,
			(config) => {
				this.config.set(config, PlayerConfigDefinition);
				permbtn?.destroy();

				const btn = this.config.add(
					new TextButtonControl(
						Interface.getGameUI<{ Templates: { Button: TextButtonDefinition } }>().Templates.Button.Clone(),
						() => {
							const popup = di.resolve<NewSettingsPopup>();
							popup.setScene("Permissions");
							popup.show();
							this.hide();
						},
					),
				);
				permbtn = btn;
				btn.instance.LayoutOrder = 0;
				btn.instance.BackgroundColor3 = Colors.accentDark;
				btn.instance.Size = new UDim2(new UDim(1, 0), btn.instance.Size.Y);
				btn.text.set("Permissions");
			},
			true,
		);
	}
}

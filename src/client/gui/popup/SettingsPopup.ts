import { Interface } from "client/gui/Interface";
import { PlayerSettingsBlacklist } from "client/gui/playerSettings/PlayerSettingsBlacklist";
import { PlayerSettingsCamera } from "client/gui/playerSettings/PlayerSettingsCamera";
import { PlayerSettingsControls } from "client/gui/playerSettings/PlayerSettingsControls";
import { PlayerSettingsEnvironment } from "client/gui/playerSettings/PlayerSettingsEnvironment";
import { PlayerSettingsGeneral } from "client/gui/playerSettings/PlayerSettingsGeneral";
import { PlayerSettingsGraphics } from "client/gui/playerSettings/PlayerSettingsGraphics";
import { PlayerSettingsInterface } from "client/gui/playerSettings/PlayerSettingsInterface";
import { PlayerSettingsPhysics } from "client/gui/playerSettings/PlayerSettingsPhysics";
import { PlayerSettingsTheme } from "client/gui/playerSettings/PlayerSettingsTheme";
import { ButtonAnimatedClickComponent } from "engine/client/gui/ButtonAnimatedClickComponent";
import { Control } from "engine/client/gui/Control";
import { ComponentChild } from "engine/shared/component/ComponentChild";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { Objects } from "engine/shared/fixes/Objects";
import type { ConfigControlTemplateList } from "client/gui/configControls/ConfigControlsList";
import type { PlayerDataStorage } from "client/PlayerDataStorage";
import type { Component } from "engine/shared/component/Component";

type SidebarButton = GuiButton & {
	readonly ImageLabel: ImageLabel;
	readonly TextLabel: TextLabel;
};

type SidebarDefinition = ScrollingFrame & {
	readonly Template: SidebarButton;
};
class Sidebar extends Control<SidebarDefinition> {
	private readonly buttonTemplate;

	constructor(gui: SidebarDefinition) {
		super(gui);
		this.buttonTemplate = this.asTemplate(gui.Template);
	}

	addButton(text: string, image: number, action: () => void) {
		const btn = this.parent(new Control(this.buttonTemplate()));
		btn.instance.Name = text;
		btn.addButtonAction(action);
		btn.getComponent(ButtonAnimatedClickComponent);

		btn.setButtonText(text.upper());
		btn.instance.ImageLabel.Image = `rbxassetid://${image}`;

		return btn;
	}
}

type ContentDefinition = GuiObject & {
	readonly ScrollingFrame: ScrollingFrame & ConfigControlTemplateList;
};
class Content extends Control<ContentDefinition> {
	private readonly content;

	constructor(gui: ContentDefinition, config: ObservableValue<PlayerConfig>) {
		super(gui);

		const contentParent = this.parent(new ComponentChild(true)) //
			.withParentInstance(gui);

		for (const child of gui.ScrollingFrame.GetChildren()) {
			if (child.IsA("GuiObject")) {
				child.Visible = false;
			}
		}
		const contentScrollTemplate = this.asTemplate(gui.ScrollingFrame);

		const content = new ObservableValue<
			| ConstructorOf<Component, [ConfigControlTemplateList, ObservableValue<PlayerConfig>, ...args: never[]]>
			| undefined
		>(undefined);
		this.onDisable(() => content.set(undefined));
		this.content = content;

		this.onInject((di) => {
			content.subscribe((clazz) => {
				if (!clazz) {
					contentParent.clear();
					return;
				}

				contentParent.set(di.resolveForeignClass(clazz, [contentScrollTemplate(), config]));
			});
		});
	}

	set<T extends GuiObject>(
		clazz:
			| ConstructorOf<Component, [T & ConfigControlTemplateList, ObservableValue<PlayerConfig>, ...args: never[]]>
			| undefined,
	): void {
		this.content.set(clazz as never);
	}
}

const template = Interface.getInterface<{ Popups: { Crossplatform: { Settings: SettingsPopup2Definition } } }>().Popups
	.Crossplatform.Settings;
template.Visible = false;

type SettingsPopup2Definition = GuiObject & {
	readonly Content: GuiObject & {
		readonly Sidebar: GuiObject & {
			readonly ScrollingFrame: SidebarDefinition;
		};
		readonly Content: ContentDefinition;
	};
	readonly Heading: GuiObject & {
		readonly CloseButton: GuiButton;
		readonly TitleLabel: TextLabel;
	};
};
@injectable
export class SettingsPopup extends Control<SettingsPopup2Definition> {
	constructor(@inject playerData: PlayerDataStorage) {
		const gui = template.Clone();
		super(gui);

		const original = playerData.config.get();

		const content = this.parent(new Content(gui.Content.Content, playerData.config));
		const sidebar = this.parent(new Sidebar(gui.Content.Sidebar.ScrollingFrame));

		sidebar.addButton("general", 18627409276, () => content.set(PlayerSettingsGeneral));
		sidebar.addButton("interface", 18627409276, () => content.set(PlayerSettingsInterface));
		sidebar.addButton("camera", 18627409276, () => content.set(PlayerSettingsCamera));
		sidebar.addButton("colors", 18627409276, () => content.set(PlayerSettingsTheme));
		sidebar.addButton("graphics", 18626628666, () => content.set(PlayerSettingsGraphics));
		sidebar.addButton("environment", 18626647702, () => content.set(PlayerSettingsEnvironment));
		sidebar.addButton("controls", 18626685039, () => content.set(PlayerSettingsControls));
		sidebar.addButton("physics", 18626685039, () => content.set(PlayerSettingsPhysics));
		sidebar.addButton("blacklist", 18626826844, () => content.set(PlayerSettingsBlacklist));

		this.onDestroy(() => {
			const unchanged = Objects.deepEquals(original, playerData.config.get());
			if (unchanged) return;

			task.spawn(() => {
				playerData.sendPlayerConfig(playerData.config.get());
			});
		});

		this.parent(new Control(gui.Heading.CloseButton)) //
			.addButtonAction(() => this.hideThenDestroy());
	}
}

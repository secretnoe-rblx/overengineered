import { Interface } from "client/gui/Interface";
import { PlayerSettingsInterface } from "client/gui/playerSettings/PlayerSettingsInterface";
import { ButtonAnimatedClickComponent } from "engine/client/gui/ButtonAnimatedClickComponent";
import { Control } from "engine/client/gui/Control";
import { ComponentChild } from "engine/shared/component/ComponentChild";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import type { PlayerSettingsTemplateList } from "client/gui/playerSettings/PlayerSettingsList";
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
	readonly ScrollingFrame: ScrollingFrame & PlayerSettingsTemplateList;
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

		const content = new ObservableValue<ConstructorOf<Component> | undefined>(undefined);
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

	set(clazz: ConstructorOf<Component> | undefined): void {
		this.content.set(clazz);
	}
}

const template = Interface.getInterface<{
	Popups: { Crossplatform: { Settings_side_test: SettingsPopup2Definition } };
}>().Popups.Crossplatform.Settings_side_test;
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
export class SettingsPopup2 extends Control<SettingsPopup2Definition> {
	constructor(@inject playerData: PlayerDataStorage) {
		const gui = template.Clone();
		super(gui);

		const original = playerData.config.get();

		const content = this.parent(new Content(gui.Content.Content, playerData.config));
		const sidebar = this.parent(new Sidebar(gui.Content.Sidebar.ScrollingFrame));

		sidebar.addButton("environment", 18626647702, () => content.set(PlayerSettingsInterface));
		sidebar.addButton("permissions", 18626826844, () => content.set(undefined));

		this.parent(new Control(gui.Heading.CloseButton)).addButtonAction(() => this.destroy());
	}
}

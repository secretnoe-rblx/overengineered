import { Interface } from "client/gui/Interface";
import { Control } from "engine/client/gui/Control";
import { ComponentChild } from "engine/shared/component/ComponentChild";
import { Element } from "engine/shared/Element";
import { ObservableValue } from "engine/shared/event/ObservableValue";
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
		const btn = new Control(this.buttonTemplate());
		btn.instance.Name = text;
		btn.addButtonAction(action);

		btn.setButtonText(text.upper());
		btn.instance.ImageLabel.Image = `rbxassetid://${image}`;

		this.parent(btn);

		return btn;
	}
}

type ContentDefinition = GuiObject & {
	readonly ScrollingFrame: ScrollingFrame;
};
@injectable
class Content extends Control<ContentDefinition> {
	private readonly content;

	constructor(gui: ContentDefinition, @inject di: DIContainer) {
		super(gui);

		const contentParent = this.parent(new ComponentChild(true)) //
			.withParentInstance(gui);

		const contentScrollTemplate = this.asTemplate(gui.ScrollingFrame);

		const content = new ObservableValue<ConstructorOf<Component> | undefined>(undefined);
		this.onDisable(() => content.set(undefined));
		this.content = content;

		content.subscribe((clazz) => {
			if (!clazz) {
				contentParent.clear();
				return;
			}

			contentParent.set(di.resolveForeignClass(clazz, [contentScrollTemplate()]));
		});
	}

	set(clazz: ConstructorOf<Component> | undefined): void {
		this.content.set(clazz);
	}
}

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
	constructor(@inject di: DIContainer) {
		const gui = Interface.getInterface<{
			Popups: { Crossplatform: { Settings_side_test: SettingsPopup2Definition } };
		}>().Popups.Crossplatform.Settings_side_test.Clone();
		super(gui);

		const content = this.parent(di.resolveForeignClass(Content, [gui.Content.Content]));
		const sidebar = this.parent(new Sidebar(gui.Content.Sidebar.ScrollingFrame));

		sidebar.addButton("environment", 18626647702, () => content.set(SettingsInterface));
		sidebar.addButton("permissions", 18626826844, () => content.set(undefined));
	}
}

//

class SettingsInterface extends Control<ScrollingFrame> {
	constructor(gui: ScrollingFrame) {
		super(gui);

		this.parent(new Control(Element.create("Frame", { Size: new UDim2(0, 100, 0, 100) })));
	}
}

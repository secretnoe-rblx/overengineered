import { Interface } from "client/gui/Interface";
import { ButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { ComponentKeyedChildren } from "engine/shared/component/ComponentKeyedChildren";
import type { KeyChooserControlDefinition } from "client/gui/controls/KeyChooserControl";
import type { Keybinds } from "engine/client/Keybinds";

export type ControlsPopupDefinition = GuiObject & {
	readonly Heading: Frame & {
		readonly CloseButton: TextButton;
		readonly TitleLabel: TextLabel;
	};
	readonly Content: GuiObject & {
		readonly Template: GuiObject & {
			readonly HeadingLabel: TextLabel;
			readonly Control: KeyChooserControlDefinition;
		};
	};
};

export class ControlsPopup extends Control<ControlsPopupDefinition> {
	private readonly template;

	constructor() {
		const gui = Interface.getGameUI<{ Popup: { Controls: ControlsPopupDefinition } }>().Popup.Controls.Clone();
		super(gui);

		this.template = this.asTemplate(gui.Content.Template, true);
		const start = $autoResolve((keybinds: Keybinds) => {
			this.parent(new ButtonControl(gui.Heading.CloseButton, () => this.hide()));

			const children = this.parent(new ComponentKeyedChildren<string, Control>().withParentInstance(gui.Content));
			this.event.subscribeMap(
				keybinds.registrations,
				(key, value) => {
					if (!value) {
						children.remove(key);
						return;
					}

					const gui = this.template();
					gui.HeadingLabel.Text = value.displayPath[value.displayPath.size() - 1];

					// TODO:::
					// const control = new Control(gui);
					// const keyChooser = control.add(new KeyChooserControl(gui.Control));
					// keyChooser.value.set([...value.getKeys()][0]);
					// keyChooser.value.changed.Connect((key) => value.setKeys([key]));

					// children.add(key, control);
				},
				true,
			);
		});
		this.onInject(start);
	}
}

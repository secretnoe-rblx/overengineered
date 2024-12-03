import { Interface } from "client/gui/Interface";
import { Popup } from "client/gui/Popup";
import { ButtonControl } from "engine/client/gui/Button";
import { ComponentKeyedChildren } from "engine/shared/component/ComponentKeyedChildren";
import type { KeyChooserControlDefinition } from "client/gui/controls/KeyChooserControl";
import type { Keybinds } from "client/Keybinds";
import type { Control } from "engine/client/gui/Control";
import type { GameHostBuilder } from "engine/shared/GameHostBuilder";

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

@injectable
export class ControlsPopup extends Popup<ControlsPopupDefinition> {
	static addAsService(host: GameHostBuilder) {
		const gui = Interface.getGameUI<{ Popup: { Controls: ControlsPopupDefinition } }>().Popup.Controls;
		host.services.registerTransientFunc((ctx) => ctx.resolveForeignClass(this, [gui.Clone()]));
	}

	private readonly template;

	constructor(gui: ControlsPopupDefinition, @inject keybinds: Keybinds) {
		super(gui);

		this.template = this.asTemplate(gui.Content.Template, true);
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
	}
}

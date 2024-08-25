import { ClientComponent } from "client/component/ClientComponent";
import { Keys } from "shared/fixes/Keys";
import type { BlockConfigPrimitiveByControl } from "shared/blockLogic/BlockConfig";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import type { ILogicValueStorage } from "shared/blockLogic/BlockLogicValueStorage";

type Controls = BlockLogicTypes.Controls;
type ControlKeys = keyof Controls;

namespace ClientBlockControlsNamespace {
	export class keybool extends ClientComponent {
		constructor(
			value: ILogicValueStorage<"bool">,
			config: Controls["keybool"]["config"],
			definition: OmitOverUnion<Controls["keybool"], "default" | "config">,
		) {
			super();

			let val = config.reversed;
			const get = () => val;
			const set = (newValue: boolean) => value.set("bool", (val = newValue));

			set(config.reversed);

			const isKeyCode = (key: string): key is KeyCode => key in Keys;
			if (isKeyCode(config.key)) {
				if (definition.canBeSwitch && config.switch) {
					this.event.onKeyDown(config.key, () => set(!get()));
				} else {
					this.event.onKeyDown(config.key, () => set(!config.reversed));
					this.event.onKeyUp(config.key, () => set(config.reversed));
				}
			}
		}
	}
}

type ClientBlockControlStorage<TType extends ControlKeys> = (
	value: ILogicValueStorage<BlockConfigPrimitiveByControl<ControlKeys>>,
	config: Controls[ControlKeys]["config"],
	definition: OmitOverUnion<Controls[ControlKeys], "default" | "config">,
) => ClientComponent;
type GenericClientBlockControlStorage = (
	value: ILogicValueStorage<keyof BlockLogicTypes.Primitives>,
	config: Controls[ControlKeys]["config"],
	definition: OmitOverUnion<Controls[ControlKeys], "default" | "config">,
) => ClientComponent;

export const ClientBlockControls: { readonly [k in ControlKeys]?: GenericClientBlockControlStorage } = {
	keybool: (value, config, definition) => new ClientBlockControlsNamespace.keybool(value, config, definition),
} satisfies { readonly [k in ControlKeys]?: ClientBlockControlStorage<k> } as never;

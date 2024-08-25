import { ClientComponent } from "client/component/ClientComponent";
import { Keys } from "shared/fixes/Keys";
import type { BlockConfigPrimitiveByType } from "shared/blockLogic/BlockConfig";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import type { ILogicValueStorage } from "shared/blockLogic/BlockLogicValueStorage";

type AllTypes = BlockLogicTypes.Types;
type AllKeys = keyof AllTypes;

namespace ClientBlockControlsNamespace {
	export class keybool extends ClientComponent {
		constructor(
			value: ILogicValueStorage<"bool">,
			config: AllTypes["keybool"]["config"],
			definition: OmitOverUnion<AllTypes["keybool"], "default" | "config">,
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

type ClientBlockControlStorage<TType extends AllKeys> = new (
	value: ILogicValueStorage<BlockConfigPrimitiveByType<TType>>,
	config: AllTypes[TType]["config"],
	definition: OmitOverUnion<AllTypes[TType], "default" | "config">,
) => ClientComponent;
export const ClientBlockControls: { readonly [k in AllKeys]?: ClientBlockControlStorage<AllKeys> } = {
	...ClientBlockControlsNamespace,
} satisfies { readonly [k in AllKeys]?: ClientBlockControlStorage<k> } as never;

import { ClientComponent } from "client/component/ClientComponent";
import { KeyPressingDefinitionsController } from "client/controller/KeyPressingController";
import { isKey, Keys } from "shared/fixes/Keys";
import { MathUtils } from "shared/fixes/MathUtils";
import type { KeyDefinitions } from "client/controller/KeyPressingController";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import type { ILogicValueStorage } from "shared/blockLogic/BlockLogicValueStorage";

type Controls = BlockLogicTypes.Controls;
type ControlKeys = keyof Controls;

namespace ClientBlockControlsNamespace {
	export class Bool extends ClientComponent {
		constructor(
			value: ILogicValueStorage<"bool">,
			config: Controls["bool"]["config"],
			definition: OmitOverUnion<Controls["bool"], "config">,
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

	export class NumberSmooth extends ClientComponent {
		constructor(
			value: ILogicValueStorage<"number">,
			config: BlockLogicTypes.SmoothNumberControl["config"],
			definition: OmitOverUnion<BlockLogicTypes.SmoothNumberControl, "config">,
		) {
			super();

			const set = (newValue: number) => value.set("number", newValue);

			set(config.startValue);
			let amount = config.startValue;
			let movingUp = false;
			let movingDown = false;

			const start = (up: boolean) => {
				task.spawn(() => {
					const step = config.speed;
					while (up ? movingUp : movingDown) {
						const dt = task.wait();

						amount = math.clamp(amount + (up ? step : -step) * dt, definition.min, definition.max);
						set(MathUtils.round(amount, definition.step));
					}
				});
			};

			const def = {
				add: {
					key: config.add,
					conflicts: "sub",
					keyDown: () => {
						if (movingUp) return;

						movingUp = true;
						start(true);
					},
					keyUp: () => {
						movingUp = false;
					},
				},
				sub: {
					key: config.sub,
					conflicts: "add",
					keyDown: () => {
						if (movingDown) return;

						movingDown = true;
						start(false);
					},
					keyUp: () => {
						movingDown = false;
					},
				},
			} as const satisfies KeyDefinitions<"add" | "sub">;

			this.parent(new KeyPressingDefinitionsController(def));
		}
	}
	export class NumberHold extends ClientComponent {
		constructor(
			value: ILogicValueStorage<"number">,
			config: BlockLogicTypes.HoldNumberControl["config"],
			definition: OmitOverUnion<BlockLogicTypes.HoldNumberControl, "config">,
		) {
			super();

			const set = (newValue: number) => value.set("number", newValue);
			set(config.releasedValue);

			const holdingValue = MathUtils.round(
				math.clamp(config.holdingValue, definition.min, definition.max),
				definition.step,
			);
			const releasedValue = MathUtils.round(
				math.clamp(config.releasedValue, definition.min, definition.max),
				definition.step,
			);

			if (isKey(config.key)) {
				this.event.onKeyDown(config.key, () => set(holdingValue));
				this.event.onKeyUp(config.key, () => set(releasedValue));
			}
		}
	}
}

type ClientBlockControlStorage<TType extends ControlKeys> = (
	value: ILogicValueStorage<TType>,
	config: Controls[TType]["config"],
	definition: OmitOverUnion<Controls[TType], "config">,
) => ClientComponent;
type GenericClientBlockControlStorage = (
	value: ILogicValueStorage<keyof BlockLogicTypes.Primitives>,
	config: Controls[ControlKeys]["config"],
	definition: OmitOverUnion<Controls[ControlKeys], "config">,
) => ClientComponent;

export const ClientBlockControls: { readonly [k in ControlKeys]?: GenericClientBlockControlStorage } = {
	bool: (value, config, definition) => new ClientBlockControlsNamespace.Bool(value, config, definition),
	number: (value, config, definition) => {
		if (config.type === "hold") {
			return new ClientBlockControlsNamespace.NumberHold(value, config, definition);
		}

		return new ClientBlockControlsNamespace.NumberSmooth(value, config, definition);
	},
} satisfies { readonly [k in ControlKeys]?: ClientBlockControlStorage<k> } as never;

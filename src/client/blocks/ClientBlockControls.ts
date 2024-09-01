import { ClientComponent } from "client/component/ClientComponent";
import { Keys } from "shared/fixes/Keys";
import type { TouchModeButtonData } from "client/gui/ridemode/TouchModeButtonControl";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import type { ILogicValueStorage } from "shared/blockLogic/BlockLogicValueStorage";

type Controls = BlockLogicTypes.Controls;
type ControlKeys = keyof Controls;

namespace ClientBlockControlsNamespace {
	export class Bool extends ClientComponent implements IClientBlockControl {
		private readonly touchButtonDatas: readonly TouchModeButtonData[];

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

			this.touchButtonDatas = [
				{
					name: config.key,
					press: () => set(true),
					release: () => set(false),
					isPressed: () => get(),
					toggleMode: definition.canBeSwitch && config.switch,
				},
			];
		}

		getTouchButtonDatas(): readonly TouchModeButtonData[] {
			return this.touchButtonDatas;
		}
	}

	export class Number extends ClientComponent implements IClientBlockControl {
		private readonly touchButtonDatas: readonly TouchModeButtonData[];

		constructor(
			value: ILogicValueStorage<"number">,
			config: BlockLogicTypes.NumberControl["config"],
			definition: OmitOverUnion<BlockLogicTypes.NumberControl, "config">,
		) {
			super();

			this.touchButtonDatas = [];
		}

		getTouchButtonDatas(): readonly TouchModeButtonData[] {
			return this.touchButtonDatas;
		}
	}

	/*
	export class NumberSmooth extends ClientComponent implements IClientBlockControl {
		private readonly touchButtonDatas: readonly TouchModeButtonData[];

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

			const controller = this.parent(new KeyPressingDefinitionsController(def));

			this.touchButtonDatas = [
				{
					name: config.add,
					press: () => controller.controller.keyDown("add"),
					release: () => controller.controller.keyUp("add"),
					isPressed: () => controller.controller.isDown("add"),
					toggleMode: false,
				},
				{
					name: config.sub,
					press: () => controller.controller.keyDown("sub"),
					release: () => controller.controller.keyUp("sub"),
					isPressed: () => controller.controller.isDown("sub"),
					toggleMode: false,
				},
			];
		}

		getTouchButtonDatas(): readonly TouchModeButtonData[] {
			return this.touchButtonDatas;
		}
	}
	export class NumberHold extends ClientComponent implements IClientBlockControl {
		private readonly touchButtonDatas: readonly TouchModeButtonData[];

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

			this.touchButtonDatas = []; // does anyone even use this?
		}

		getTouchButtonDatas(): readonly TouchModeButtonData[] {
			return this.touchButtonDatas;
		}
	}
	export class NumberDoubleHold extends ClientComponent implements IClientBlockControl {
		private readonly touchButtonDatas: readonly TouchModeButtonData[];

		constructor(
			value: ILogicValueStorage<"number">,
			config: BlockLogicTypes.DoubleHoldNumberControl["config"],
			definition: OmitOverUnion<BlockLogicTypes.DoubleHoldNumberControl, "config">,
		) {
			super();

			let savedValue = config.releasedValue;
			const get = () => savedValue;
			const set = (newValue: number) => value.set("number", (savedValue = newValue));

			const holdingValue = MathUtils.round(
				math.clamp(config.holdingValue, definition.min, definition.max),
				definition.step,
			);
			const releasedValue = MathUtils.round(
				math.clamp(config.releasedValue, definition.min, definition.max),
				definition.step,
			);

			set(releasedValue);

			const def = {
				add: {
					key: config.add,
					conflicts: "sub",
					keyDown: () => {
						if (!config.switchmode) {
							set(-holdingValue);
						} else {
							set(get() === -holdingValue ? releasedValue : -holdingValue);
						}
					},
					keyUp: () => {
						if (!config.switchmode) {
							set(releasedValue);
						}
					},
				},
				sub: {
					key: config.sub,
					conflicts: "add",
					keyDown: () => {
						if (!config.switchmode) {
							set(holdingValue);
						} else {
							set(get() === holdingValue ? releasedValue : holdingValue);
						}
					},
					keyUp: () => {
						if (!config.switchmode) {
							set(releasedValue);
						}
					},
				},
			} as const satisfies KeyDefinitions<"add" | "sub">;

			const controller = this.parent(new KeyPressingDefinitionsController(def));

			this.touchButtonDatas = [
				{
					name: config.add,
					press: () => controller.controller.keyDown("add"),
					release: () => controller.controller.keyUp("add"),
					isPressed: () => controller.controller.isDown("add"),
					toggleMode: config.switchmode,
				},
				{
					name: config.sub,
					press: () => controller.controller.keyDown("sub"),
					release: () => controller.controller.keyUp("sub"),
					isPressed: () => controller.controller.isDown("sub"),
					toggleMode: config.switchmode,
				},
			];
		}

		getTouchButtonDatas(): readonly TouchModeButtonData[] {
			return this.touchButtonDatas;
		}
	}
	*/
}

export type IClientBlockControl = IComponent & {
	getTouchButtonDatas(): readonly TouchModeButtonData[];
};

type ClientBlockControlStorage<TType extends ControlKeys> = (
	value: ILogicValueStorage<TType>,
	config: Controls[TType]["config"],
	definition: OmitOverUnion<Controls[TType], "config">,
) => IClientBlockControl;
type GenericClientBlockControlStorage = (
	value: ILogicValueStorage<keyof BlockLogicTypes.Primitives>,
	config: Controls[ControlKeys]["config"],
	definition: OmitOverUnion<Controls[ControlKeys], "config">,
) => IClientBlockControl;

export const ClientBlockControls: { readonly [k in ControlKeys]?: GenericClientBlockControlStorage } = {
	bool: (value, config, definition) => new ClientBlockControlsNamespace.Bool(value, config, definition),
	number: (value, config, definition) => {
		return new ClientBlockControlsNamespace.Number(value, config, definition);
		// if (config.type === "hold") {
		// 	return new ClientBlockControlsNamespace.NumberHold(value, config, definition);
		// }
		// if (config.type === "doublehold") {
		// 	return new ClientBlockControlsNamespace.NumberDoubleHold(value, config, definition as never);
		// }
		// return new ClientBlockControlsNamespace.NumberSmooth(value, config, definition as never);
	},
} satisfies { readonly [k in ControlKeys]?: ClientBlockControlStorage<k> } as never;

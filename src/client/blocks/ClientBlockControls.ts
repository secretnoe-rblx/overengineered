import { ClientComponent } from "client/component/ClientComponent";
import { KeyPressingDefinitionsController } from "client/controller/KeyPressingController";
import { Keys } from "shared/fixes/Keys";
import { MathUtils } from "shared/fixes/MathUtils";
import { Objects } from "shared/fixes/objects";
import type { KeyDefinition, KeyDefinitions } from "client/controller/KeyPressingController";
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
		private readonly controller;

		constructor(
			value: ILogicValueStorage<"number">,
			config: BlockLogicTypes.NumberControl["config"],
			definition: Omit<BlockLogicTypes.NumberControl, "config">,
		) {
			super();

			if (config.mode.type === "smooth") {
				this.controller = this.parent(new NumberSmooth(value, config as never, definition));
			} else if (config.mode.type === "hold") {
				this.controller = this.parent(new NumberHold(value, config as never, definition));
			} else if (config.mode.type === "switch") {
				this.controller = this.parent(new NumberSwitch(value, config as never, definition));
			}
		}

		getTouchButtonDatas(): readonly TouchModeButtonData[] {
			return this.controller?.getTouchButtonDatas() ?? [];
		}
	}

	class NumberSmooth extends ClientComponent implements IClientBlockControl {
		private readonly touchButtonDatas: readonly TouchModeButtonData[];

		constructor(
			value: ILogicValueStorage<"number">,
			config: ReplaceWith<
				BlockLogicTypes.NumberControl["config"],
				{ readonly mode: BlockLogicTypes.NumberControlModeSmooth }
			>,
			definition: Omit<BlockLogicTypes.NumberControl, "config">,
		) {
			super();

			const set = (newValue: number) => value.set("number", newValue);

			set(config.startValue);
			let amount = config.startValue;
			let movingTowards: number | undefined = 0;

			const start = (towards: number) => {
				if (amount === towards) return;

				task.spawn(() => {
					const step = amount < towards ? config.mode.speed : -config.mode.speed;
					const direction = math.sign(step) as -1 | 1;

					while (movingTowards === towards) {
						const dt = task.wait();

						amount = math.clamp(amount + step * dt, definition.min, definition.max);

						if (direction < 0) amount = math.max(amount, towards);
						else amount = math.min(amount, towards);

						set(MathUtils.round(amount, definition.step));
					}
				});
			};

			const allKeys = config.keys.map((k) => k.key);
			const def: KeyDefinitions<string> = Objects.map(
				config.keys,
				(i, v) => v.key,
				(i, v): KeyDefinition<string> => ({
					key: v.key,
					conflicts: allKeys.except([v.key]),
					keyDown: () => {
						if (movingTowards) return;

						movingTowards = v.value;
						start(v.value);
					},
					keyUp: () => (movingTowards = undefined),
				}),
			);

			const controller = this.parent(new KeyPressingDefinitionsController(def));

			this.touchButtonDatas = config.keys.map(
				(k): TouchModeButtonData => ({
					name: k.key,
					press: () => controller.controller.keyDown(k.key),
					release: () => controller.controller.keyUp(k.key),
					isPressed: () => controller.controller.isDown(k.key),
					toggleMode: false,
				}),
			);
		}

		getTouchButtonDatas(): readonly TouchModeButtonData[] {
			return this.touchButtonDatas;
		}
	}
	class NumberHold extends ClientComponent implements IClientBlockControl {
		private readonly touchButtonDatas: readonly TouchModeButtonData[];

		constructor(
			value: ILogicValueStorage<"number">,
			config: ReplaceWith<
				BlockLogicTypes.NumberControl["config"],
				{ readonly mode: BlockLogicTypes.NumberControlModeHold }
			>,
			definition: Omit<BlockLogicTypes.NumberControl, "config">,
		) {
			super();

			const set = (newValue: number) => value.set("number", newValue);

			set(config.startValue);
			let amount = config.startValue;

			const allKeys = config.keys.map((k) => k.key);
			const def: KeyDefinitions<string> = Objects.map(
				config.keys,
				(i, v) => v.key,
				(i, v): KeyDefinition<string> => ({
					key: v.key,
					conflicts: allKeys.except([v.key]),
					keyDown: () => {
						amount = math.clamp(v.value, definition.min, definition.max);
						set(MathUtils.round(amount, definition.step));
					},
					keyUp: () => set(MathUtils.round((amount = config.startValue), definition.step)),
				}),
			);

			const controller = this.parent(new KeyPressingDefinitionsController(def));

			this.touchButtonDatas = config.keys.map(
				(k): TouchModeButtonData => ({
					name: k.key,
					press: () => controller.controller.keyDown(k.key),
					release: () => controller.controller.keyUp(k.key),
					isPressed: () => controller.controller.isDown(k.key),
					toggleMode: false,
				}),
			);
		}

		getTouchButtonDatas(): readonly TouchModeButtonData[] {
			return this.touchButtonDatas;
		}
	}
	class NumberSwitch extends ClientComponent implements IClientBlockControl {
		private readonly touchButtonDatas: readonly TouchModeButtonData[];

		constructor(
			value: ILogicValueStorage<"number">,
			config: ReplaceWith<
				BlockLogicTypes.NumberControl["config"],
				{ readonly mode: BlockLogicTypes.NumberControlModeSwitch }
			>,
			definition: Omit<BlockLogicTypes.NumberControl, "config">,
		) {
			super();

			const set = (newValue: number) => value.set("number", newValue);

			set(config.startValue);
			let amount = config.startValue;

			const allKeys = config.keys.map((k) => k.key);
			const def: KeyDefinitions<string> = Objects.map(
				config.keys,
				(i, v) => v.key,
				(i, v): KeyDefinition<string> => ({
					key: v.key,
					conflicts: allKeys.except([v.key]),
					keyDown: () => {
						amount = amount === v.value ? config.startValue : v.value;
						set(MathUtils.round(amount, definition.step));
					},
				}),
			);

			const controller = this.parent(new KeyPressingDefinitionsController(def));

			this.touchButtonDatas = config.keys.map(
				(k): TouchModeButtonData => ({
					name: k.key,
					press: () => controller.controller.keyDown(k.key),
					release: () => controller.controller.keyUp(k.key),
					isPressed: () => controller.controller.isDown(k.key),
					toggleMode: false,
				}),
			);
		}

		getTouchButtonDatas(): readonly TouchModeButtonData[] {
			return this.touchButtonDatas;
		}
	}
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
	number: (value, config, definition) => new ClientBlockControlsNamespace.Number(value, config, definition),
} satisfies { readonly [k in ControlKeys]?: ClientBlockControlStorage<k> } as never;

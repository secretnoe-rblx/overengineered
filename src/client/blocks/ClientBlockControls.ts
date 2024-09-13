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

	function createNumberController(
		value: ILogicValueStorage<"number">,
		config: BlockLogicTypes.NumberControl["config"],
		definition: Omit<BlockLogicTypes.NumberControl, "config">,
		configDefinition: Omit<BlockLogicTypes.Number, "config">,
	): KeyPressingDefinitionsController<KeyDefinitions<string>> {
		let currentValue = config.startValue;
		const actualSet = (newValue: number) => value.set("number", (currentValue = newValue));

		const clamp = configDefinition.clamp;

		let smoothMovingTask: thread | undefined;
		let smoothAmount = config.startValue;
		const smoothSet = (target: number) => {
			if (smoothMovingTask) {
				smoothCancel();
			}

			const step = smoothAmount < target ? config.mode.smoothSpeed : -config.mode.smoothSpeed;
			if (step === 0) return;

			const direction = math.sign(step) as -1 | 1;
			smoothMovingTask = task.spawn(() => {
				while (true as boolean) {
					const dt = task.wait();

					smoothAmount = MathUtils.clamp(smoothAmount + step * dt, clamp?.min, clamp?.max);

					if (direction < 0) smoothAmount = math.max(smoothAmount, target);
					else smoothAmount = math.min(smoothAmount, target);

					actualSet(MathUtils.round(smoothAmount, clamp?.step));

					// stop when reached the target
					if (direction > 0 && smoothAmount >= target) return;
					if (direction < 0 && smoothAmount <= target) return;
				}
			});
		};
		const smoothCancel = () => smoothMovingTask && task.cancel(smoothMovingTask);

		const set = config.mode.smooth ? smoothSet : actualSet;

		//

		const keySet = (value: number) => {
			set(value);
		};
		const keyReset = () => {
			if (config.mode.resetOnStop) {
				set(config.startValue);
			} else {
				smoothCancel();
			}
		};

		//

		set(config.startValue);

		const mapKeyHold = (_: unknown, v: BlockLogicTypes.NumberControlKey): KeyDefinition<string> => ({
			key: v.key,
			conflicts: allKeys.except([v.key]),
			keyDown: () => keySet(v.value),
			keyUp: () => keyReset(),
		});

		let movingTo: string | undefined;
		const mapKeySwitch = (_: unknown, v: BlockLogicTypes.NumberControlKey): KeyDefinition<string> => ({
			key: v.key,
			conflicts: allKeys.except([v.key]),
			keyDown: () => {
				if (movingTo === v.key) {
					keyReset();
					movingTo = undefined;
				} else {
					keySet(v.value);
					movingTo = v.key;
				}
			},
		});

		const allKeys = config.keys.map((k) => k.key);
		const def: KeyDefinitions<string> = Objects.map(
			config.keys,
			(i, v) => v.key,
			config.mode.stopOnRelease ? mapKeyHold : mapKeySwitch,
		);

		return new KeyPressingDefinitionsController(def);
	}

	export class Number extends ClientComponent implements IClientBlockControl {
		private readonly touchButtonDatas: readonly TouchModeButtonData[];

		constructor(
			value: ILogicValueStorage<"number">,
			config: BlockLogicTypes.NumberControl["config"],
			definition: Omit<BlockLogicTypes.NumberControl, "config">,
			configDefinition: Omit<BlockLogicTypes.Number, "config">,
		) {
			super();

			const controller = this.parent(createNumberController(value, config, definition, configDefinition));
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
	definition: MakeRequired<OmitOverUnion<BlockLogicTypes.Primitives[TType], "config">, "control">,
) => IClientBlockControl;
type GenericClientBlockControlStorage = (
	value: ILogicValueStorage<keyof BlockLogicTypes.Primitives>,
	config: Controls[ControlKeys]["config"],
	definition: MakeRequired<OmitOverUnion<BlockLogicTypes.Primitives[ControlKeys], "config">, "control">,
) => IClientBlockControl;

export const ClientBlockControls: { readonly [k in ControlKeys]?: GenericClientBlockControlStorage } = {
	bool: (value, config, definition) => new ClientBlockControlsNamespace.Bool(value, config, definition.control),
	number: (value, config, definition) =>
		new ClientBlockControlsNamespace.Number(value, config, definition.control, definition),
} satisfies { readonly [k in ControlKeys]?: ClientBlockControlStorage<k> } as never;

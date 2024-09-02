import { ColorChooser } from "client/gui/ColorChooser";
import { Control } from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";
import { ByteEditor } from "client/gui/controls/ByteEditorControl";
import { CheckBoxControl } from "client/gui/controls/CheckBoxControl";
import { DropdownList } from "client/gui/controls/DropdownList";
import { KeyOrStringChooserControl } from "client/gui/controls/KeyOrStringChooserControl";
import { NumberTextBoxControl } from "client/gui/controls/NumberTextBoxControl";
import { SliderControl } from "client/gui/controls/SliderControl";
import { TextBoxControl } from "client/gui/controls/TextBoxControl";
import { Gui } from "client/gui/Gui";
import { MultiKeyNumberControl } from "client/gui/MultiKeyNumberControl";
import { MemoryEditorPopup } from "client/gui/popup/MemoryEditorPopup";
import { BlockConfig } from "shared/blockLogic/BlockConfig";
import { BlockWireManager } from "shared/blockLogic/BlockWireManager";
import { Colors } from "shared/Colors";
import { ComponentChild } from "shared/component/ComponentChild";
import { ObservableValue } from "shared/event/ObservableValue";
import { ArgsSignal } from "shared/event/Signal";
import { Objects } from "shared/fixes/objects";
import type { ColorChooserDefinition } from "client/gui/ColorChooser";
import type { ByteEditorDefinition } from "client/gui/controls/ByteEditorControl";
import type { CheckBoxControlDefinition } from "client/gui/controls/CheckBoxControl";
import type { DropdownListDefinition } from "client/gui/controls/DropdownList";
import type { KeyOrStringChooserControlDefinition } from "client/gui/controls/KeyOrStringChooserControl";
import type { NumberTextBoxControlDefinition } from "client/gui/controls/NumberTextBoxControl";
import type { TextBoxControlDefinition } from "client/gui/controls/TextBoxControl";
import type { TooltipController } from "client/gui/controls/Tooltip";
import type { MultiKeyNumberControlDefinition, MultiKeyPart } from "client/gui/MultiKeyNumberControl";
import type { BlockConfigPart } from "shared/blockLogic/BlockConfig";
import type { BlockLogicWithConfigDefinitionTypes } from "shared/blockLogic/BlockLogic";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";

type Primitives = BlockLogicTypes.Primitives;
type PrimitiveKeys = keyof Primitives;

type Controls = BlockLogicTypes.Controls;
type ControlKeys = keyof Controls;

type MiniPrimitives = { readonly [k in PrimitiveKeys]: Omit<Primitives[k], "default"> };
type WithoutDefaultPrimitives = { readonly [k in PrimitiveKeys]: Omit<Primitives[k], "default"> };
type WithoutDefaultControls = { readonly [k in ControlKeys]: WithoutDefaultPrimitives[k] };

type OfBlocks<T> = { readonly [k in BlockUuid]: T };

export type VisualBlockConfigDefinition = {
	readonly displayName: string;
	readonly tooltip?: string;
	readonly unit?: string;
	readonly types: Partial<BlockLogicWithConfigDefinitionTypes<PrimitiveKeys>>;
	readonly connectorHidden?: boolean;
	readonly group?: string;
};
export type VisualBlockConfigDefinitions = {
	readonly [k in string]: VisualBlockConfigDefinition;
};

type ConfigPart<TKey extends PrimitiveKeys> = Primitives[TKey]["config"];
type ConfigParts<TKey extends PrimitiveKeys> = OfBlocks<ConfigPart<TKey>>;

type ControlDefinition<TKey extends PrimitiveKeys> = Primitives[TKey & keyof BlockLogicTypes.Controls]["control"] &
	defined;
type ControlConfigPart<TKey extends PrimitiveKeys> = ControlDefinition<TKey>["config"];
type ControlConfigParts<TKey extends PrimitiveKeys> = OfBlocks<ControlConfigPart<TKey>>;

type TypedConfigPart<K extends PrimitiveKeys = PrimitiveKeys> = BlockConfigPart<K>;
type BlocksConfigPart<K extends PrimitiveKeys = PrimitiveKeys> = OfBlocks<TypedConfigPart<K>>;
type BlocksConfig = OfBlocks<{ readonly [k in string]: TypedConfigPart }>;

/** Return the value if all of them are the same; Returns undefined otherwise */
const sameOrUndefined = <T>(configs: OfBlocks<T>, comparer?: (left: T, right: T) => boolean) => {
	let value: T | undefined;
	for (const [_, config] of pairs(configs)) {
		if (value !== undefined && !(comparer?.(value, config) ?? value === config)) {
			value = undefined;
			break;
		}

		value = config;
	}

	return value;
};

/** Map the config values, leaving the keys as is */
const map = <T, TOut extends defined>(
	configs: OfBlocks<T>,
	mapfunc: (value: T, key: BlockUuid) => TOut,
): OfBlocks<TOut> => {
	return asObject(asMap(configs).mapToMap((k, v) => $tuple(k, mapfunc(v, k))));
};

//

const template = Gui.getGameUI<{ Templates: { Config2: { Template: ConfigValueWrapperDefinition } } }>().Templates
	.Config2.Template;

const setWrapperColor = (wrapper: ConfigValueWrapper, valueType: PrimitiveKeys) => {
	wrapper.typeColor.set(BlockWireManager.typeGroups[BlockWireManager.groups[valueType]].color);
};
const setWrapperName = (control: Control<GuiObject & { readonly HeadingLabel: TextLabel }>, name: string) => {
	control.instance.HeadingLabel.Text = name;
};

namespace Controls {
	type SliderControlDefinition = GuiObject & {
		readonly TextBox: TextBox;
		readonly Control: GuiObject & {
			readonly Filled: GuiObject;
			readonly Knob: GuiObject;
		};
	};
	type ByteControlDefinition = GuiObject & {
		readonly Bottom: GuiObject & {
			readonly Buttons: ByteEditorDefinition["Buttons"] & defined;
		};
		readonly Top: GuiObject & {
			readonly TextBox: ByteEditorDefinition["TextBox"] & defined;
		};
	};
	type ControllableDefinition = GuiObject & {
		readonly Controllable: GuiObject & {
			readonly Controllable: GuiObject & {
				readonly Control: CheckBoxControlDefinition;
			};
			readonly Extended: GuiObject & {
				readonly Control: CheckBoxControlDefinition;
			};
		};
	};

	export type Templates = {
		readonly Unset: ConfigValueDefinition<GuiObject>;
		readonly Redirect: ConfigValueDefinition<GuiButton>;

		readonly Checkbox: ConfigValueDefinition<CheckBoxControlDefinition>;
		readonly Number: ConfigValueDefinition<NumberTextBoxControlDefinition>;
		readonly Text: ConfigValueDefinition<TextBoxControlDefinition>;
		readonly Slider: ConfigValueDefinition<SliderControlDefinition>;
		readonly Byte: ConfigValueDefinition<ByteControlDefinition>;
		readonly ByteArray: ConfigValueDefinition<GuiButton>;
		readonly Key: ConfigValueDefinition<KeyOrStringChooserControlDefinition>;
		readonly Color: ConfigValueDefinition<ColorChooserDefinition>;
		readonly Multi: ConfigValueDefinition<GuiObject>;
		readonly Controllable: ConfigValueDefinition<ControllableDefinition>;

		readonly MultiKeys: MultiKeyNumberControlDefinition;
	};
	type templates = {
		readonly [k in keyof Templates]: () => Templates[k];
	};
	export const templates: templates = {
		Unset: Control.asTemplateWithMemoryLeak(template.Content.Unset, true),
		Redirect: Control.asTemplateWithMemoryLeak(template.Content.Redirect, true),

		Checkbox: Control.asTemplateWithMemoryLeak(template.Content.Checkbox, true),
		Number: Control.asTemplateWithMemoryLeak(template.Content.Number, true),
		Text: Control.asTemplateWithMemoryLeak(template.Content.Text, true),
		Slider: Control.asTemplateWithMemoryLeak(template.Content.Slider, true),
		Byte: Control.asTemplateWithMemoryLeak(template.Content.Byte, true),
		ByteArray: Control.asTemplateWithMemoryLeak(template.Content.ByteArray, true),
		Key: Control.asTemplateWithMemoryLeak(template.Content.Key, true),
		Color: Control.asTemplateWithMemoryLeak(template.Content.Color, true),
		Multi: Control.asTemplateWithMemoryLeak(template.Content.Multi, true),
		Controllable: Control.asTemplateWithMemoryLeak(template.Content.Controllable, true),

		MultiKeys: Control.asTemplateWithMemoryLeak(template.Content.MultiKeys, true),
	};

	namespace Controls {
		const addSingleTypeWrapper = <T extends Control>(
			parent: Control<GuiObject> & { readonly control: GuiObject },
			control: T,
			parentTo?: Control,
		) => {
			const wrapper = new ConfigValueWrapper(template.Clone());
			wrapper.dropdown.hide();
			wrapper.controls.hide();
			wrapper.content.set(control);

			wrapper.instance.Parent = parent.control;
			(parentTo ?? parent).add(wrapper);
			return $tuple(wrapper, control);
		};
		const addSingleTypeWrapperAuto = <TKey extends PrimitiveKeys>(
			parent: Control<GuiObject> & { readonly control: GuiObject },
			displayName: string,
			def: MiniPrimitives[TKey] & { readonly type: TKey },
			configs: ConfigParts<TKey>,
			args: Args,
			parentTo?: Control,
		) => {
			const ctor = controls[def.type];
			if (!ctor) throw `No ctor for block config visual type ${def.type}`;

			const control = ctor(templates, def as WithoutDefaultPrimitives[PrimitiveKeys], configs, args, undefined!);
			setWrapperName(control, displayName);

			const [wrapper] = addSingleTypeWrapper(parent, control, parentTo);
			setWrapperColor(wrapper, def.type);

			return $tuple(wrapper, control as Control as Control & Submittable<TKey>);
		};

		type Submittable<TKey extends PrimitiveKeys> = {
			readonly submitted: ReadonlyArgsSignal<[value: ConfigParts<TKey>]>;
		};
		export abstract class Base<T extends GuiObject, TKey extends PrimitiveKeys> extends Control<
			ConfigValueDefinition<T>
		> {
			readonly submitted = new ArgsSignal<[value: ConfigParts<TKey>]>();
			readonly submittedControl = new ArgsSignal<[value: ControlConfigParts<TKey>]>();
			readonly control: T;

			constructor(gui: ConfigValueDefinition<T>) {
				super(gui);
				this.control = gui.Control;
			}
		}

		export class unset extends Base<GuiObject, "unset"> {
			constructor(templates: templates) {
				super(templates.Unset());
			}
		}
		export class wire extends Base<GuiButton, "wire"> {
			constructor(
				templates: templates,
				definition: MiniPrimitives["wire"],
				config: ConfigParts<"wire">,
				args: Args,
			) {
				super(templates.Redirect());

				const btn = this.add(
					new ButtonControl(this.gui.Control, () => args.travelTo(firstValue(config)!.blockUuid)),
				);

				if (asMap(config).size() !== 1) {
					btn.setInteractable(false);
				}
			}
		}

		export class bool extends Base<CheckBoxControlDefinition, "bool"> {
			constructor(templates: templates, definition: MiniPrimitives["bool"], config: ConfigParts<"bool">) {
				super(templates.Checkbox());

				const control = this.add(new CheckBoxControl(this.control));
				control.value.set(sameOrUndefined(config));

				control.submitted.Connect((v) => this.submitted.Fire((config = map(config, (_) => v))));
			}
		}

		export class Number extends Base<NumberTextBoxControlDefinition, "number"> {
			constructor(templates: templates, definition: MiniPrimitives["number"], config: ConfigParts<"number">) {
				super(templates.Number());

				const gui = this.control as NumberTextBoxControlDefinition;

				const control = this.add(
					definition.clamp
						? new NumberTextBoxControl<true>(
								gui,
								definition.clamp.min,
								definition.clamp.max,
								definition.clamp.step,
							)
						: new NumberTextBoxControl<true>(gui),
				);
				control.value.set(sameOrUndefined(config));

				control.submitted.Connect((v) => this.submitted.Fire((config = map(config, (_) => v))));
			}
		}
		export class ClampedNumber extends Base<SliderControlDefinition, "number"> {
			constructor(
				templates: templates,
				definition: MakeRequired<MiniPrimitives["number"], "clamp">,
				config: ConfigParts<"number">,
			) {
				super(templates.Slider());

				const gui = this.control as SliderControlDefinition;
				const clamp = definition.clamp;

				const control = this.add(
					new SliderControl<true>(gui, clamp.min, clamp.max, clamp.step, {
						Knob: gui.Control.Knob,
						Filled: gui.Control.Filled,
						Hitbox: gui.Control,
					}),
				);
				control.value.set(sameOrUndefined(config));

				control.submitted.Connect((v) => this.submitted.Fire((config = map(config, (_) => v))));
			}
		}

		export class _string extends Base<TextBoxControlDefinition, "string"> {
			constructor(templates: templates, definition: MiniPrimitives["string"], config: ConfigParts<"string">) {
				super(templates.Text());

				const control = this.add(new TextBoxControl(this.control));
				control.text.set(sameOrUndefined(config) ?? "");

				control.submitted.Connect((v) => this.submitted.Fire((config = map(config, (_) => v))));
			}
		}
		export class byte extends Base<ByteControlDefinition, "byte"> {
			constructor(templates: templates, definition: MiniPrimitives["byte"], config: ConfigParts<"byte">) {
				super(templates.Byte());

				const control = this.add(
					new ByteEditor(this.control, {
						Buttons: this.gui.Control.Bottom.Buttons,
						TextBox: this.gui.Control.Top.TextBox,
					}),
				);
				control.value.set(sameOrUndefined(config) ?? 0);

				control.submitted.Connect((v) => this.submitted.Fire((config = map(config, (_) => v))));
			}
		}
		export class key extends Base<KeyOrStringChooserControlDefinition, "key"> {
			readonly keyChooser;

			constructor(templates: templates, definition: MiniPrimitives["key"], config: ConfigParts<"key">) {
				super(templates.Key());

				this.keyChooser = this.add(new KeyOrStringChooserControl<true>(this.control));
				this.keyChooser.value.set(sameOrUndefined(config));

				this.keyChooser.submitted.Connect((v) => this.submitted.Fire((config = map(config, (_) => v))));
			}
		}
		export class bytearray extends Base<GuiButton, "bytearray"> {
			constructor(
				templates: templates,
				definition: MiniPrimitives["bytearray"],
				config: ConfigParts<"bytearray">,
			) {
				super(templates.ByteArray());

				const value = sameOrUndefined(config, (left, right) => {
					if (left.size() !== right.size()) {
						return false;
					}

					for (let i = 0; i < left.size(); i++) {
						if (left[i] !== right[i]) {
							return false;
						}
					}

					return true;
				});

				const control = this.add(
					new ButtonControl(this.control, () => {
						MemoryEditorPopup.showPopup(definition.lengthLimit, [...(value ?? [])], (v) =>
							this.submitted.Fire((config = map(config, (_) => v))),
						);
					}),
				);

				if (!value) {
					control.setInteractable(false);
				}
			}
		}
		export class color extends Base<ColorChooserDefinition, "color"> {
			constructor(templates: templates, definition: MiniPrimitives["color"], config: ConfigParts<"color">) {
				super(templates.Color());

				const control = this.add(new ColorChooser(this.control));
				control.value.set(sameOrUndefined(config) ?? Colors.white);

				control.value.submitted.Connect((v) => this.submitted.Fire((config = map(config, (_) => v))));
			}
		}

		export class vector3 extends Base<GuiObject, "vector3"> {
			constructor(
				templates: templates,
				definition: MiniPrimitives["vector3"],
				config: ConfigParts<"vector3">,
				args: Args,
			) {
				super(templates.Multi());

				const [, cx] = addSingleTypeWrapperAuto(
					this,
					"X",
					{ type: "number", config: 0 },
					map(config, (c) => c.X),
					args,
				);
				const [, cy] = addSingleTypeWrapperAuto(
					this,
					"Y",
					{ type: "number", config: 0 },
					map(config, (c) => c.Y),
					args,
				);
				const [, cz] = addSingleTypeWrapperAuto(
					this,
					"Z",
					{ type: "number", config: 0 },
					map(config, (c) => c.Z),
					args,
				);

				const vec = (parts: OfBlocks<number>, axis: "X" | "Y" | "Z") => {
					if (axis === "X") return map(config, (c, uuid) => new Vector3(parts[uuid], c.Y, c.Z));
					if (axis === "Y") return map(config, (c, uuid) => new Vector3(c.X, parts[uuid], c.Z));
					if (axis === "Z") return map(config, (c, uuid) => new Vector3(c.X, c.Y, parts[uuid]));

					throw "what";
				};

				cx.submitted.Connect((n) => this.submitted.Fire((config = vec(n, "X"))));
				cy.submitted.Connect((n) => this.submitted.Fire((config = vec(n, "Y"))));
				cz.submitted.Connect((n) => this.submitted.Fire((config = vec(n, "Z"))));
			}
		}

		//

		export class KeyBool extends Base<GuiObject, "bool"> {
			constructor(
				templates: templates,
				definition: ControlDefinition<"bool">,
				config: ControlConfigParts<"bool">,
				args: Args,
			) {
				super(templates.Multi());

				const defcfg = definition.config;

				const [, ckey] = addSingleTypeWrapperAuto(
					this,
					"Key",
					{ type: "key", config: defcfg.key },
					map(config, (c) => c.key),
					args,
				);
				ckey.submitted.Connect((v) =>
					this.submittedControl.Fire((config = map(config, (c, uuid) => ({ ...c, key: v[uuid] })))),
				);

				if (definition.canBeSwitch) {
					const [, cswitch] = addSingleTypeWrapperAuto(
						this,
						"Switch",
						{ type: "bool", config: defcfg.switch },
						map(config, (c) => c.switch),
						args,
					);
					cswitch.submitted.Connect((v) =>
						this.submittedControl.Fire((config = map(config, (c, uuid) => ({ ...c, switch: v[uuid] })))),
					);
				}

				if (definition.canBeReversed) {
					const [, creversed] = addSingleTypeWrapperAuto(
						this,
						"Reversed",
						{ type: "bool", config: defcfg.reversed },
						map(config, (c) => c.reversed),
						args,
					);
					creversed.submitted.Connect((v) =>
						this.submittedControl.Fire((config = map(config, (c, uuid) => ({ ...c, reversed: v[uuid] })))),
					);
				}
			}
		}

		export class NumberThrustControl extends Base<GuiObject, "number"> {
			constructor(
				templates: templates,
				definition: MakeRequired<MiniPrimitives["number"], "control">,
				config: BlocksConfigPart<"number">,
				args: Args,
			) {
				super(templates.Multi());

				const processConfig = (
					config: BlockLogicTypes.NumberControl["config"],
				): BlockLogicTypes.NumberControl["config"] => {
					let keys = [...config.keys];
					while (keys.size() > 2) {
						keys.pop();
					}
					while (keys.size() < 2) {
						keys.push(definition.control.config.keys[keys.size()]);
					}

					if (keys.mapToSet((k) => k.key).size() !== keys.size()) {
						// some keys are the same
						keys = [...definition.control.config.keys];
					}

					return { ...config, keys };
				};
				const getKeysArr = (keys: { readonly add?: string; readonly sub?: string }) => {
					return map(controlConfig, (c) => [
						{ ...c.keys[0], key: keys.add ?? c.keys[0].key, value: 100 },
						{ ...c.keys[1], key: keys.sub ?? c.keys[1].key, value: 0 },
					]);
				};

				let controlConfig = map(config, (c) => processConfig(c.controlConfig!));

				const mks = addMultiKeyControls(
					this,
					[
						{
							key: "add",
							displayName: "+",
							definition: { config: definition.control.config.keys[0].key },
							config: map(controlConfig, (c) => c.keys[0].key),
						},
						{
							key: "sub",
							displayName: "-",
							definition: { config: definition.control.config.keys[1].key },
							config: map(controlConfig, (c) => c.keys[1].key),
						},
					],
					args,
				);
				mks.submitted.Connect((v) => {
					const keys = getKeysArr(v);
					this.submittedControl.Fire(
						(controlConfig = map(controlConfig, (c, uuid) => ({ ...c, keys: keys[uuid] }))),
					);
				});

				const [, cSwitch] = addSingleTypeWrapperAuto(
					this,
					"Switch mode",
					{ type: "bool", config: definition.control.config.mode.type === "switch" },
					map(controlConfig, (c) => c.mode.type === "switch"),
					args,
				);
				cSwitch.submitted.Connect((v) =>
					this.submittedControl.Fire(
						(controlConfig = map(controlConfig, (c, uuid) => ({
							...c,
							mode: v[uuid] ? { type: "switch" } : definition.control.config.mode,
						}))),
					),
				);
			}
		}

		export class NumberExtendedControl extends Base<GuiObject, "number"> {
			constructor(
				templates: templates,
				definition: MakeRequired<MiniPrimitives["number"], "control">,
				config: BlocksConfigPart<"number">,
				args: Args,
			) {
				super(templates.Multi());

				const controlConfig = map(config, (c) => c.controlConfig!);

				const keysConfig = map(controlConfig, (c) => c.keys);
				const firstval = firstValue(keysConfig);

				let keys: readonly MultiKeyPart[];
				if (!firstval) {
					keys = [];
				} else {
					const allEquals = asMap(keysConfig).all((k, v) => Objects.deepEquals(firstval, v));
					if (!allEquals) keys = [];
					else keys = firstval;
				}

				const [wKeys, cKeys] = addSingleTypeWrapper(
					this,
					new MultiKeyNumberControl(
						templates.MultiKeys(),
						keys,
						definition.config,
						definition.control.min,
						definition.control.max,
					),
				);
				wKeys.typeColor.set(Colors.red);
			}
		}

		/*
		export class motorRotationSpeed extends Base<GuiObject, "motorRotationSpeed"> {
			constructor(
				templates: templates,
				definition: MiniTypes["motorRotationSpeed"],
				config: ConfigParts<"motorRotationSpeed">,
			) {
				super(templates.Multi());

				const mks = addMultiKeyControls(this, [
					{ key: "add", displayName: "+", definition: {}, config: map(config, (c) => c.rotation.add) },
					{ key: "sub", displayName: "-", definition: {}, config: map(config, (c) => c.rotation.sub) },
				]);
				const [, cMaxSpeed] = addSingleTypeWrapperAuto(
					this,
					"clampedNumber",
					"Max speed",
					{ min: 0, max: definition.maxSpeed, step: 0.01 },
					map(config, (c) => c.speed),
				);
				const [, cSwitch] = addSingleTypeWrapperAuto(
					this,
					"bool",
					"Switch mode",
					{},
					map(config, (c) => c.switchmode),
				);

				mks.submitted.Connect((v) =>
					this.submitted.Fire((config = map(config, (c) => ({ ...c, rotation: { ...c.rotation, ...v } })))),
				);
				cMaxSpeed.submitted.Connect((v) =>
					this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, speed: v[uuid] })))),
				);
				cSwitch.submitted.Connect((v) =>
					this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, switchmode: v[uuid] })))),
				);
			}
		}
		export class servoMotorAngle extends Base<GuiObject, "servoMotorAngle"> {
			constructor(
				templates: templates,
				definition: MiniTypes["servoMotorAngle"],
				config: ConfigParts<"servoMotorAngle">,
			) {
				super(templates.Multi());

				const mks = addMultiKeyControls(this, [
					{ key: "add", displayName: "+", definition: {}, config: map(config, (c) => c.rotation.add) },
					{ key: "sub", displayName: "-", definition: {}, config: map(config, (c) => c.rotation.sub) },
				]);
				const [, cAngle] = addSingleTypeWrapperAuto(
					this,
					"clampedNumber",
					"Angle",
					{ min: definition.minAngle, max: definition.maxAngle, step: 0.01 },
					map(config, (c) => c.angle),
				);
				const [, cSwitch] = addSingleTypeWrapperAuto(
					this,
					"bool",
					"Switch mode",
					{},
					map(config, (c) => c.switchmode),
				);

				mks.submitted.Connect((v) =>
					this.submitted.Fire((config = map(config, (c) => ({ ...c, rotation: { ...c.rotation, ...v } })))),
				);
				cAngle.submitted.Connect((v) =>
					this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, angle: v[uuid] })))),
				);
				cSwitch.submitted.Connect((v) =>
					this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, switchmode: v[uuid] })))),
				);
			}
		}
		export class thrust extends Base<GuiObject, "thrust"> {
			constructor(
				templates: templates,
				definition: MiniTypes["thrust"],
				config: ConfigParts<"thrust">,
			) {
				super(templates.Multi());

				const mks = addMultiKeyControls(this, [
					{ key: "add", displayName: "+", definition: {}, config: map(config, (c) => c.thrust.add) },
					{ key: "sub", displayName: "-", definition: {}, config: map(config, (c) => c.thrust.sub) },
				]);
				mks.submitted.Connect((v) =>
					this.submitted.Fire((config = map(config, (c) => ({ ...c, thrust: { ...c.thrust, ...v } })))),
				);

				if (definition.canBeSwitch) {
					const [, cSwitch] = addSingleTypeWrapperAuto(
						this,
						"bool",
						"Switch mode",
						{},
						map(config, (c) => c.switchmode),
					);
					cSwitch.submitted.Connect((v) =>
						this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, switchmode: v[uuid] })))),
					);
				}
			}
		}
		export class controllableNumber extends Base<GuiObject, "controllableNumber"> {
			constructor(
				templates: templates,
				definition: MiniTypes["controllableNumber"],
				config: ConfigParts<"controllableNumber">,
			) {
				super(templates.Multi());

				const mks = addMultiKeyControls(this, [
					{ key: "add", displayName: "+", definition: {}, config: map(config, (c) => c.control.add) },
					{ key: "sub", displayName: "-", definition: {}, config: map(config, (c) => c.control.sub) },
				]);
				const [, cValue] = addSingleTypeWrapperAuto(
					this,
					"clampedNumber",
					"Value",
					definition,
					map(config, (c) => c.value),
				);

				mks.submitted.Connect((v) =>
					this.submitted.Fire((config = map(config, (c) => ({ ...c, control: { ...c.control, ...v } })))),
				);
				cValue.submitted.Connect((v) =>
					this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, value: v[uuid] })))),
				);
			}
		}
		*/
		/*
		export class NumberSmooth extends ControlBase<GuiObject, "number"> {
			constructor(
				templates: templates,
				definition: BlockLogicTypes.SmoothNumberControl,
				config: OfBlocks<BlockLogicTypes.SmoothNumberControl["config"]>,
				args: Args,
			) {
				super(templates.Multi());

				const mks = addMultiKeyControls(
					this,
					[
						{
							key: "add",
							displayName: "+",
							definition: { config: definition.config.add },
							config: map(config, (c) => c.add),
						},
						{
							key: "sub",
							displayName: "-",
							definition: { config: definition.config.sub },
							config: map(config, (c) => c.sub),
						},
					],
					args,
				);
				mks.submitted.Connect((v) => this.submitted.Fire((config = map(config, (c) => ({ ...c, ...v })))));

				const [, cSpeed] = addSingleTypeWrapperAuto(
					this,
					"Speed",
					{
						type: "number",
						config: definition.config.speed,
						clamp: { showAsSlider: false, min: 0.01, max: definition.max, step: 0.01 },
					},
					map(config, (c) => c.speed),
					args,
				);
				cSpeed.submitted.Connect((v) =>
					this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, speed: v[uuid] })))),
				);

				const [, cStartValue] = addSingleTypeWrapperAuto(
					this,
					"Starting value",
					{
						type: "number",
						config: definition.config.startValue,
						clamp: { showAsSlider: false, min: definition.min, max: definition.max, step: 0.01 },
					},
					map(config, (c) => c.startValue),
					args,
				);
				cStartValue.submitted.Connect((v) =>
					this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, startValue: v[uuid] })))),
				);

				if (definition.canBeSwitch) {
					const [, cSwitchMode] = addSingleTypeWrapperAuto(
						this,
						"Switch",
						{ type: "bool", config: definition.config.switchmode },
						map(config, (c) => c.switchmode),
						args,
					);
					cSwitchMode.submitted.Connect((v) =>
						this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, switchmode: v[uuid] })))),
					);
				}
			}
		}
		export class NumberHold extends ControlBase<GuiObject, "number"> {
			constructor(
				templates: templates,
				definition: BlockLogicTypes.HoldNumberControl,
				config: OfBlocks<BlockLogicTypes.HoldNumberControl["config"]>,
				args: Args,
			) {
				super(templates.Multi());

				const [, cKey] = addSingleTypeWrapperAuto(
					this,
					"Key",
					{ type: "key", config: definition.config.key },
					map(config, (c) => c.key),
					args,
				);
				const [, cReleased] = addSingleTypeWrapperAuto(
					this,
					"Released value",
					{
						type: "number",
						config: definition.config.releasedValue,
						clamp: { showAsSlider: false, min: definition.min, max: definition.max, step: definition.step },
					},
					map(config, (c) => c.releasedValue),
					args,
				);
				const [, cHolding] = addSingleTypeWrapperAuto(
					this,
					"Holding value",
					{
						type: "number",
						config: definition.config.holdingValue,
						clamp: { showAsSlider: false, min: definition.min, max: definition.max, step: definition.step },
					},
					map(config, (c) => c.holdingValue),
					args,
				);

				cKey.submitted.Connect((v) =>
					this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, key: v[uuid] })))),
				);
				cReleased.submitted.Connect((v) =>
					this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, releasedValue: v[uuid] })))),
				);
				cHolding.submitted.Connect((v) =>
					this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, holdingValue: v[uuid] })))),
				);
			}
		}
		export class NumberDoubleHold extends ControlBase<GuiObject, "number"> {
			constructor(
				templates: templates,
				definition: BlockLogicTypes.DoubleHoldNumberControl,
				config: OfBlocks<BlockLogicTypes.DoubleHoldNumberControl["config"]>,
				args: Args,
			) {
				super(templates.Multi());

				const mks = addMultiKeyControls(
					this,
					[
						{
							key: "add",
							displayName: "+",
							definition: { config: definition.config.add },
							config: map(config, (c) => c.add),
						},
						{
							key: "sub",
							displayName: "-",
							definition: { config: definition.config.sub },
							config: map(config, (c) => c.sub),
						},
					],
					args,
				);
				mks.submitted.Connect((v) => this.submitted.Fire((config = map(config, (c) => ({ ...c, ...v })))));

				const [, cReleased] = addSingleTypeWrapperAuto(
					this,
					"Released value",
					{
						type: "number",
						config: definition.config.releasedValue,
						clamp: { showAsSlider: false, min: definition.min, max: definition.max, step: definition.step },
					},
					map(config, (c) => c.releasedValue),
					args,
				);
				cReleased.submitted.Connect((v) =>
					this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, releasedValue: v[uuid] })))),
				);

				const [, cHolding] = addSingleTypeWrapperAuto(
					this,
					"Holding value",
					{
						type: "number",
						config: definition.config.holdingValue,
						clamp: { showAsSlider: false, min: definition.min, max: definition.max, step: definition.step },
					},
					map(config, (c) => c.holdingValue),
					args,
				);
				cHolding.submitted.Connect((v) =>
					this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, holdingValue: v[uuid] })))),
				);

				if (definition.canBeSwitch) {
					const [, cSwitchMode] = addSingleTypeWrapperAuto(
						this,
						"Switch",
						{ type: "bool", config: definition.config.switchmode },
						map(config, (c) => c.switchmode),
						args,
					);
					cSwitchMode.submitted.Connect((v) =>
						this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, switchmode: v[uuid] })))),
					);
				}
			}
		}
		*/

		function addMultiKeyControls<TKeys extends string>(
			parent: Control<GuiObject> & { readonly control: GuiObject },
			stuffs: readonly {
				readonly key: TKeys;
				readonly displayName: string;
				readonly definition: MiniPrimitives["key"];
				readonly config: ConfigParts<"key">;
			}[],
			args: Args,
			parentTo?: Control,
		): { readonly submitted: ReadonlyArgsSignal<[config: { readonly [k in TKeys]?: string }]> } & {
			readonly [k in TKeys]: {
				readonly wrapper: ConfigValueWrapper;
				readonly control: Control & Submittable<"key">;
			};
		} {
			const submitted = new ArgsSignal<[config: { readonly [k in TKeys]: string }]>();
			const ret: { [k in TKeys]?: { readonly wrapper: ConfigValueWrapper; readonly control: key } } = {};

			const prevValues: { [k in TKeys]?: string } = {};

			for (const { key, displayName, definition, config } of stuffs) {
				const [wrapper, control] = addSingleTypeWrapperAuto(
					parent,
					displayName,
					{ type: "key", ...definition },
					config,
					args,
					parentTo,
				);
				const keycontrol = control as key;
				ret[key] = { wrapper, control: keycontrol };

				prevValues[key] = keycontrol.keyChooser.value.get();

				control.submitted.Connect((values) => {
					const changed: TKeys[] = [key];
					const value = firstValue(values);

					const prev = prevValues[key];
					prevValues[key] = value;
					for (const [otherkey, { control: otherControl }] of pairs(ret)) {
						if (control === otherControl) continue;

						const othervalue = otherControl.keyChooser.value.get();

						if (value === othervalue) {
							otherControl.keyChooser.value.set(prev);
							prevValues[otherkey] = prev;

							changed.push(otherkey);

							break;
						}
					}

					submitted.Fire(
						asObject(changed.mapToMap((k) => $tuple(k, ret[k]?.control.keyChooser.value.get()))),
					);
				});
			}

			return { submitted, ...(ret as { [k in TKeys]-?: (typeof ret)[k] & defined }) };
		}

		export type controls = {
			readonly [k in PrimitiveKeys]: (
				templates: templates,
				definition: WithoutDefaultPrimitives[k],
				config: ConfigParts<k>,
				parent: Args,
				fullConfig: BlocksConfigPart<k>,
			) => Base<GuiObject, k>;
		};
		export type genericControls = {
			readonly [k in PrimitiveKeys]: (
				templates: templates,
				definition: WithoutDefaultPrimitives[PrimitiveKeys],
				config: ConfigParts<PrimitiveKeys>,
				parent: Args,
				fullConfig: BlocksConfigPart<PrimitiveKeys>,
			) => Base<GuiObject, PrimitiveKeys>;
		};

		export type simpleControls = {
			readonly [k in ControlKeys]?: (
				templates: templates,
				definition: MakeRequired<WithoutDefaultControls[k] & { control?: unknown }, "control">,
				config: BlocksConfigPart<k>,
				parent: Args,
			) => Base<GuiObject, k>;
		};
		export type simpleGenericControls = {
			readonly [k in ControlKeys]?: (
				templates: templates,
				definition: MakeRequired<WithoutDefaultControls[ControlKeys], "control">,
				config: BlocksConfigPart<PrimitiveKeys>,
				parent: Args,
			) => Base<GuiObject, ControlKeys>;
		};

		export type extendedControls = {
			readonly [k in ControlKeys]?: (
				templates: templates,
				definition: MakeRequired<WithoutDefaultControls[k] & { control?: unknown }, "control">,
				config: BlocksConfigPart<k>,
				parent: Args,
			) => Base<GuiObject, k>;
		};
		export type extendedGenericControls = {
			readonly [k in ControlKeys]?: (
				templates: templates,
				definition: MakeRequired<WithoutDefaultControls[ControlKeys], "control">,
				config: BlocksConfigPart<PrimitiveKeys>,
				parent: Args,
			) => Base<GuiObject, ControlKeys>;
		};
	}

	export type Base<T extends GuiObject = GuiObject, TKey extends PrimitiveKeys = PrimitiveKeys> = Controls.Base<
		T,
		TKey
	>;
	export type Args = {
		travelTo(uuid: BlockUuid): void;
	};

	export const controls = {
		unset: (templates, definition, config, parent) => new Controls.unset(templates),
		wire: (templates, definition, config, parent) => new Controls.wire(templates, definition, config, parent),
		bool: (templates, definition, config, parent, fullConfig) => {
			if (definition.control) {
				return new Controls.KeyBool(
					templates,
					definition.control,
					map(fullConfig, (c) => c.controlConfig!),
					parent,
				);
			}

			return new Controls.bool(templates, definition, config);
		},
		number: (templates, definition, config) => {
			if (definition.clamp?.showAsSlider) {
				return new Controls.ClampedNumber(
					templates,
					definition as MakeRequired<typeof definition, "clamp">,
					config,
				);
			}

			return new Controls.Number(templates, definition, config);
		},
		string: (templates, definition, config, parent) => new Controls._string(templates, definition, config),
		byte: (templates, definition, config, parent) => new Controls.byte(templates, definition, config),
		key: (templates, definition, config, parent) => new Controls.key(templates, definition, config),
		bytearray: (templates, definition, config, parent) => new Controls.bytearray(templates, definition, config),
		color: (templates, definition, config, parent) => new Controls.color(templates, definition, config),
		vector3: (templates, definition, config, parent) => new Controls.vector3(templates, definition, config, parent),
	} satisfies Controls.controls as Controls.genericControls;

	export const simpleControls = {
		number: (templates, definition, config, parent) => {
			if (definition.control.simplified === "thrust") {
				return new Controls.NumberThrustControl(templates, definition, config, parent);
			}

			return undefined!;
		},
	} satisfies Controls.simpleControls as Controls.simpleGenericControls;

	export const extendedControls = {
		number: (templates, definition, config, parent) =>
			new Controls.NumberExtendedControl(templates, definition, config, parent),
	} satisfies Controls.extendedControls as Controls.extendedGenericControls;
}

type ConfigValueDefinition<T> = GuiObject & {
	readonly HeadingLabel: TextLabel;
	readonly Control: T;
};

type ConfigValueWrapperDefinition = GuiObject & {
	readonly TypeLine: Frame;
	readonly Content: GuiObject &
		Controls.Templates & {
			readonly TypeDropdown: DropdownListDefinition;
			readonly TypeControllable: GuiObject & {
				readonly Controllable: GuiObject & {
					readonly Control: CheckBoxControlDefinition;
				};
				readonly Extended: GuiObject & {
					readonly Control: CheckBoxControlDefinition;
				};
			};
		};
};
type m = "[multi]";
type mk = PrimitiveKeys | m;

class ConfigValueWrapper extends Control<ConfigValueWrapperDefinition> {
	readonly typeColor = new ObservableValue<Color3>(Colors.white);
	readonly dropdown;

	readonly controls;
	readonly controllable;
	readonly extended;

	readonly content;

	constructor(gui: ConfigValueWrapperDefinition) {
		super(gui);

		this.event.subscribeObservable(this.typeColor, (color) => (gui.TypeLine.BackgroundColor3 = color), true);

		this.dropdown = this.add(new DropdownList<mk>(gui.Content.TypeDropdown));

		this.content = new ComponentChild<Control>(this);
		this.content.childSet.Connect((child) => {
			if (!child) return;
			child.instance.Parent = gui.Content;
		});

		this.controls = this.add(new Control(gui.Content.TypeControllable));
		this.controllable = this.controls.add(new CheckBoxControl(this.controls.instance.Controllable.Control));
		this.extended = this.controls.add(new CheckBoxControl(this.controls.instance.Extended.Control));
	}
}

@injectable
class ConfigAutoValueWrapper extends Control<ConfigValueWrapperDefinition> {
	private readonly _submitted = new ArgsSignal<[config: BlocksConfigPart]>();
	readonly submitted = this._submitted.asReadonly();

	constructor(
		gui: ConfigValueWrapperDefinition,
		definition: VisualBlockConfigDefinition,
		configs: BlocksConfigPart,
		args: Controls.Args,
		key: string,
		wireTypes: WireTypes,
		@inject tooltipController: TooltipController,
	) {
		super(gui);

		const control = this.add(new ConfigValueWrapper(gui));

		// without a connector we can only configure the value with the config tool; thus, "unset" makes zero sense
		if (!definition.connectorHidden) {
			control.dropdown.addItem("unset");
		}

		const selectedType = new ObservableValue<mk>("unset");
		selectedType.subscribe((t) => control.dropdown.selectedItem.set(t), true);
		control.dropdown.selectedItem.subscribe((t) => t && selectedType.set(t));

		// all the possible types of every block
		const availableBlockTypes = asMap(configs).map(
			(k) =>
				wireTypes
					.get(k)
					?.find((t) => t.data.id === key)
					?.availableTypes.get() ?? [],
		);
		// only types that every block has
		const availableTypes = new Set(availableBlockTypes.flatmap((t) => t)).filter((t) =>
			availableBlockTypes.all((at) => at.includes(t)),
		);

		for (const k of availableTypes) {
			control.dropdown.addItem(k);
		}

		if (asMap(configs).any((k, v) => v.type === "wire")) {
			// if any of the configs is a wire connection

			selectedType.set("wire");
			control.dropdown.hide();
		} else if (asMap(definition.types).size() === 1) {
			// if there is only one definition type

			const key = firstKey(definition.types)!;
			selectedType.set(key);
			control.dropdown.hide();
		} else {
			// if there is multiple definition types

			const types = asSet(asMap(configs).mapToMap((k, v) => $tuple(v.type, true as const)));
			if (types.size() === 1) {
				// if every config has the same type set
				selectedType.set(firstKey(types)!);
			} else {
				// if configs have different types set
				selectedType.set("[multi]");
			}
		}

		this.event.subscribe(control.dropdown.submitted, (selectedType) => {
			if (selectedType === "[multi]" || selectedType === "wire") {
				return;
			}

			configs = map(
				configs,
				(_): TypedConfigPart => ({
					type: selectedType,
					config: selectedType === "unset" ? undefined! : definition.types[selectedType]!.config,
				}),
			);
			this._submitted.Fire(configs);
		});

		const reload = () => {
			let stype = selectedType.get();
			control.content.set(undefined);

			if (!stype) return;
			if (stype === "[multi]") stype = "unset";
			if (stype !== "unset" && stype !== "wire" && !(stype in definition.types)) return;

			setWrapperColor(control, stype);

			// initializing the top `Controllable` bar
			const initControls = () => {
				const def = definition.types[stype];
				if (!def) return;

				if (!("control" in def) || !def.control) {
					control.controls.setVisible(false);
					return;
				}

				control.controls.setVisible(true);

				// controlConfig should never be null if `control` is present in the definition, BlockConfig handles that.
				const controlConfigs = map(configs, (c) => c.controlConfig!);

				const initControllable = () => {
					const first = firstValue(controlConfigs);
					if (first) {
						control.controllable.value.set(first.enabled);
						return;
					}

					const enableds = new Set(asMap(map(controlConfigs, (c) => c.enabled)).values());
					if (enableds.size() === 1) {
						if (firstKey(enableds)) {
							// all configs are true
							control.controllable.value.set(true);
						} else {
							// all configs are false
							control.controllable.value.set(false);
						}
					} else {
						// configs have both true and false
						control.controllable.value.set(undefined);
					}
				};
				initControllable();

				const canBeSimplified = "simplified" in def.control && def.control.simplified !== undefined;
				const initExtended = () => {
					if (!canBeSimplified) {
						// if `simplified` isn't present, always use extended variant
						control.extended.value.set(true);
						control.controls.instance.Extended.Visible = false;

						return;
					}

					const isControllable = control.controllable.value.get() ?? false;
					control.controls.instance.Extended.Visible = isControllable;
					if (!isControllable) return;

					const extendeds = new Set(
						asMap(map(controlConfigs, (c) => "extended" in c && c.extended)).values(),
					);
					if (extendeds.size() === 1) {
						if (firstKey(extendeds)) {
							// all configs are true
							control.extended.value.set(true);
						} else {
							// all configs are false
							control.extended.value.set(false);
						}
					} else {
						// configs have both true and false
						control.extended.value.set(undefined);
					}
				};
				initExtended();
			};
			initControls();

			const createGui = (): Controls.Base | undefined => {
				if (stype === "unset") {
					return Controls.controls[stype](
						Controls.templates,
						{ config: {} as BlockLogicTypes.UnsetValue },
						{},
						args,
						{},
					);
				}
				if (stype === "wire") {
					return Controls.controls[stype](
						Controls.templates,
						{ config: undefined! },
						map(configs, (c) => c.config),
						args,
						{},
					);
				}

				const def = definition.types[stype];
				if (!def) return;

				const isControllable = control.controllable.value.get();
				const isExtended = control.extended.value.get();

				if (isControllable === undefined || isExtended === undefined) {
					// TODO: [mixed] message or somethin
					return;
				}

				if (!isControllable) {
					const cfg = map(configs, (c) => c.config);
					return Controls.controls[stype](Controls.templates, def, cfg, args, configs);
				}
				if (!isExtended) {
					if (!(stype in Controls.simpleControls)) return;

					const ctor = Controls.simpleControls[stype as ControlKeys];
					if (!ctor) return;

					return ctor(
						Controls.templates,
						def as MakeRequired<MiniPrimitives["number"], "control">,
						configs,
						args,
					);
				}
				if (isExtended) {
					if (!(stype in Controls.extendedControls)) return;

					const ctor = Controls.extendedControls[stype as ControlKeys];
					if (!ctor) return;

					return ctor(
						Controls.templates,
						def as MakeRequired<MiniPrimitives["number"], "control">,
						configs,
						args,
					);
				}

				// TODO:
			};
			const cfgcontrol = createGui();
			if (!cfgcontrol) return;

			setWrapperName(cfgcontrol, definition.displayName);
			if (definition.tooltip) {
				let tooltip = definition.tooltip;
				if (definition.unit) tooltip += ` (${definition.unit})`;

				tooltipController.registerControl(control.add(new Control(cfgcontrol.instance.HeadingLabel)), tooltip);
			}

			cfgcontrol.submitted.Connect((v) =>
				this._submitted.Fire((configs = map(configs, (c, uuid) => ({ ...c, type: stype, config: v[uuid] })))),
			);
			cfgcontrol.submittedControl.Connect((v) =>
				this._submitted.Fire(
					(configs = map(configs, (c, uuid) => ({
						...c,
						type: stype,
						controlConfig: v[uuid],
					}))),
				),
			);

			control.content.set(cfgcontrol);
		};

		this.event.subscribeObservable(selectedType, reload);
		this.event.subscribe(control.controllable.submitted, reload);
		this.event.subscribe(control.extended.submitted, reload);
		this.onEnable(reload);

		// controlConfig will not be undefined if the controls are visible so we don't need to check that
		this.event.subscribe(control.controllable.submitted, (enabled) =>
			this._submitted.Fire(
				(configs = map(configs, (c) => ({ ...c, controlConfig: { ...c.controlConfig!, enabled } }))),
			),
		);
		this.event.subscribe(control.extended.submitted, (extended) =>
			this._submitted.Fire(
				(configs = map(configs, (c) => ({ ...c, controlConfig: { ...c.controlConfig!, extended } }))),
			),
		);
	}
}

type WireTypes = ReadonlyMap<BlockUuid, readonly (BlockWireManager.Markers.Input | BlockWireManager.Markers.Output)[]>;
@injectable
export class MultiBlockConfigControl extends Control implements Controls.Args {
	private readonly _travelledTo = new ArgsSignal<[uuid: BlockUuid]>();
	readonly travelledTo = this._travelledTo.asReadonly();

	private readonly _submitted = new ArgsSignal<[config: BlocksConfig]>();
	readonly submitted = this._submitted.asReadonly();

	constructor(
		gui: GuiObject,
		definitions: VisualBlockConfigDefinitions,
		configs: BlocksConfig,
		order: readonly string[] | undefined,
		wireTypes: WireTypes,
		@inject di: DIContainer,
	) {
		super(gui);

		if (order) {
			const nonexistent = asMap(definitions)
				.keys()
				.filter((k) => !order.includes(k));
			if (nonexistent.size() > 0) {
				throw `Some definition keys were not present in the order (${nonexistent.join()})`;
			}

			const wrong = order.filter((k) => !(k in definitions));
			if (wrong.size() > 0) {
				throw `Some order keys were not present in the definitions (${wrong.join()})`;
			}
		}

		const create = () => {
			const grouped = new Map<ConfigAutoValueWrapper, string>();
			const grouped2 = new Map<string, { readonly wrapper: ConfigAutoValueWrapper; readonly key: string }[]>();

			for (const k of order ?? asMap(definitions).keys()) {
				const definition = definitions[k];

				const lconfigs = map(configs, (c) => c[k]);
				const wrapper = this.add(
					di.resolveForeignClass(ConfigAutoValueWrapper, [
						template.Clone(),
						definition,
						lconfigs,
						this,
						k,
						wireTypes,
					]),
				);

				if (definition.group) {
					grouped.set(wrapper, definition.group);
					grouped2.getOrSet(definition.group, () => []).push({ wrapper, key: k });
				}

				wrapper.submitted.Connect((v) => {
					let needsClearing = false;

					try {
						configs = map(configs, (c, uuid) => ({ ...c, [k]: v[uuid] }));

						if (!definition.group) return;
						const setType = firstValue(v)!.type;
						if (setType === "unset") return;

						const grouped = grouped2.get(definition.group) ?? [];
						if (grouped.size() === 1) return;

						needsClearing = true;
						configs = map(configs, (c) => {
							const ret = { ...c };

							for (const { key } of grouped) {
								const t = c[key];
								if (t.type === "unset") continue;
								if (t.type === "wire") continue;
								if (t.type === setType) continue;

								ret[key] = BlockConfig.addDefaults({ [key]: { type: setType } } as never, definitions)[
									key
								];
							}

							return ret;
						});
					} finally {
						this._submitted.Fire(configs);
					}

					if (needsClearing) {
						this.clear();
						create();
					}
				});
			}
		};
		create();
	}

	travelTo(uuid: BlockUuid): void {
		this._travelledTo.Fire(uuid);
	}
}

import { Colors } from "client/gui/Colors";
import { Control } from "client/gui/Control";
import { CheckBoxControl } from "client/gui/controls/CheckBoxControl";
import { DropdownList } from "client/gui/controls/DropdownList";
import { KeyOrStringChooserControl } from "client/gui/controls/KeyOrStringChooserControl";
import { NumberTextBoxControl } from "client/gui/controls/NumberTextBoxControl";
import { SliderControl } from "client/gui/controls/SliderControl";
import { Gui } from "client/gui/Gui";
import { BlockWireManager } from "shared/blockLogic/BlockWireManager";
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
import type {
	BlockConfigPart,
	BlockConfigPrimitiveByType,
	BlockConfigTypesByPrimitive,
} from "shared/blockLogic/BlockConfig";
import type { BlockLogicWithConfigDefinitionTypes } from "shared/blockLogic/BlockLogic";
import type { BlockLogicTypes3 } from "shared/blockLogic/BlockLogicTypes";

type Primitives = BlockLogicTypes3.Primitives;
type PrimitiveKeys = keyof Primitives;
type NonPrimitives = BlockLogicTypes3.NonPrimitives;
type NonPrimitiveKeys = keyof NonPrimitives;
type AllTypes = BlockLogicTypes3.Types;
type AllKeys = keyof AllTypes;

/** {@link BlockConfigTypes3.Types} without the `default` and `config` properties */
type AllMiniTypes = { readonly [k in AllKeys]: Omit<AllTypes[k], "default" | "type"> };
type AllWithoutDefaultTypes = { readonly [k in AllKeys]: Omit<AllTypes[k], "default"> };

type OfBlocks<T> = { readonly [k in BlockUuid]: T };

export type VisualBlockConfigDefinition = {
	readonly displayName: string;
	readonly types: Partial<BlockLogicWithConfigDefinitionTypes<PrimitiveKeys>>;
	readonly configHidden?: boolean;
};
export type VisualBlockConfigDefinitions = {
	readonly [k in string]: VisualBlockConfigDefinition;
};

type ConfigPart<TKey extends AllKeys> = AllTypes[TKey]["config"];
type ConfigParts<TKey extends AllKeys> = OfBlocks<ConfigPart<TKey>>;

type _ConfigPart<TKey extends PrimitiveKeys> = AllTypes[BlockConfigTypesByPrimitive<TKey>]["config"];
type _ConfigParts<TKey extends PrimitiveKeys> = OfBlocks<ConfigPart<TKey>>;

type TypedConfigPart = BlockConfigPart<PrimitiveKeys>;
type BlocksConfigPart = OfBlocks<TypedConfigPart>;
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
	};

	namespace Controls {
		const addSingleTypeWrapper = <T extends Base<GuiObject, AllKeys>>(
			parent: Base<GuiObject, AllKeys>,
			control: T,
		) => {
			const wrapper = new ConfigValueWrapper(template.Clone());
			wrapper.dropdown.hide();
			wrapper.content.set(control);

			wrapper.instance.Parent = parent.control;
			parent.add(wrapper);
			return $tuple(wrapper, control);
		};
		const addSingleTypeWrapperAuto = <TKey extends AllKeys>(
			parent: Base<GuiObject, AllKeys>,
			displayName: string,
			def: AllMiniTypes[TKey] & { readonly type: TKey },
			configs: ConfigParts<TKey>,
		) => {
			const ctor = controls[def.type];
			if (!ctor) throw `No ctor for block config visual type ${def.type}`;

			const control = new ctor(templates, def as AllWithoutDefaultTypes[AllKeys], configs);
			control.instance.HeadingLabel.Text = displayName;

			const [wrapper] = addSingleTypeWrapper(parent, control);
			wrapper.typeColor.set(BlockWireManager.typeGroups[BlockWireManager.groups[def.type]].color);

			return $tuple(wrapper, control as Control as Control & Submittable<BlockConfigPrimitiveByType<TKey>>);
		};

		type Submittable<TKey extends PrimitiveKeys> = {
			readonly submitted: ReadonlyArgsSignal<[value: ConfigParts<TKey>]>;
		};
		abstract class Base<T extends GuiObject, TKey extends AllKeys> extends Control<ConfigValueDefinition<T>> {
			readonly submitted = new ArgsSignal<[value: ConfigParts<TKey>]>();
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
		export class wire extends Base<GuiObject, "wire"> {
			constructor(templates: templates) {
				super(templates.Redirect());
			}
		}

		export class bool extends Base<CheckBoxControlDefinition, "bool"> {
			constructor(templates: templates, definition: AllMiniTypes["bool"], config: ConfigParts<"bool">) {
				super(templates.Checkbox());

				const control = this.add(new CheckBoxControl(this.control));
				control.value.set(sameOrUndefined(config));

				control.submitted.Connect((v) => this.submitted.Fire((config = map(config, (_) => v))));
			}
		}
		export class _number extends Base<NumberTextBoxControlDefinition, "number"> {
			constructor(templates: templates, definition: AllMiniTypes["number"], config: ConfigParts<"number">) {
				super(templates.Number());

				const control = this.add(new NumberTextBoxControl<true>(this.control));
				control.value.set(sameOrUndefined(config));

				control.submitted.Connect((v) => this.submitted.Fire((config = map(config, (_) => v))));
			}
		}
		// export class _string extends Base<TextBoxControlDefinition, "string"> {
		// 	constructor(
		// 		templates: templates,
		// 		definition: MiniTypes["string"],
		// 		config: ConfigParts<"string">,
		// 	) {
		// 		super(templates.Text());

		// 		const control = this.add(new TextBoxControl(this.control));
		// 		control.text.set(sameOrUndefined(config) ?? "");

		// 		control.submitted.Connect((v) => this.submitted.Fire((config = map(config, (_) => v))));
		// 	}
		// }
		export class clampedNumber extends Base<SliderControlDefinition, "clampedNumber"> {
			constructor(
				templates: templates,
				definition: AllMiniTypes["clampedNumber"],
				config: ConfigParts<"clampedNumber">,
			) {
				super(templates.Slider());

				const control = this.add(
					new SliderControl<true>(this.control, definition.min, definition.max, definition.step, {
						Knob: this.gui.Control.Control.Knob,
						Filled: this.gui.Control.Control.Filled,
					}),
				);
				control.value.set(sameOrUndefined(config));

				control.submitted.Connect((v) => this.submitted.Fire((config = map(config, (_) => v))));
			}
		}
		// export class byte extends Base<ByteControlDefinition, "byte"> {
		// 	constructor(
		// 		templates: templates,
		// 		definition: MiniTypes["byte"],
		// 		config: ConfigParts<"byte">,
		// 	) {
		// 		super(templates.Byte());

		// 		const control = this.add(
		// 			new ByteEditor(this.control, {
		// 				Buttons: this.gui.Control.Bottom.Buttons,
		// 				TextBox: this.gui.Control.Top.TextBox,
		// 			}),
		// 		);
		// 		control.value.set(sameOrUndefined(config) ?? 0);

		// 		control.submitted.Connect((v) => this.submitted.Fire((config = map(config, (_) => v))));
		// 	}
		// }
		export class key extends Base<KeyOrStringChooserControlDefinition, "key"> {
			readonly keyChooser;

			constructor(templates: templates, definition: AllMiniTypes["key"], config: ConfigParts<"key">) {
				super(templates.Key());

				this.keyChooser = this.add(new KeyOrStringChooserControl<true>(this.control));
				this.keyChooser.value.set(sameOrUndefined(config));

				this.keyChooser.submitted.Connect((v) => this.submitted.Fire((config = map(config, (_) => v))));
			}
		}
		// export class bytearray extends Base<GuiButton, "bytearray"> {
		// 	constructor(
		// 		templates: templates,
		// 		definition: MiniTypes["bytearray"],
		// 		config: ConfigParts<"bytearray">,
		// 	) {
		// 		super(templates.ByteArray());

		// 		const value = sameOrUndefined(config, (left, right) => {
		// 			if (left.size() !== right.size()) {
		// 				return false;
		// 			}

		// 			for (let i = 0; i < left.size(); i++) {
		// 				if (left[i] !== right[i]) {
		// 					return false;
		// 				}
		// 			}

		// 			return true;
		// 		});

		// 		const control = this.add(
		// 			new ButtonControl(this.control, () => {
		// 				MemoryEditorPopup.showPopup(definition.lengthLimit, [...(value ?? [])], (v) =>
		// 					this.submitted.Fire((config = map(config, (_) => v))),
		// 				);
		// 			}),
		// 		);

		// 		if (!value) {
		// 			control.setInteractable(false);
		// 		}
		// 	}
		// }
		// export class color extends Base<ColorChooserDefinition, "color"> {
		// 	constructor(
		// 		templates: templates,
		// 		definition: MiniTypes["color"],
		// 		config: ConfigParts<"color">,
		// 	) {
		// 		super(templates.Color());

		// 		const control = this.add(new ColorChooser(this.control));
		// 		control.value.set(sameOrUndefined(config) ?? Colors.white);

		// 		control.value.submitted.Connect((v) => this.submitted.Fire((config = map(config, (_) => v))));
		// 	}
		// }

		export class keybool extends Base<GuiObject, "keybool"> {
			constructor(templates: templates, definition: AllMiniTypes["keybool"], config: ConfigParts<"keybool">) {
				super(templates.Multi());

				const [, ckey] = addSingleTypeWrapperAuto(
					this,
					"Key",
					{ type: "key", config: definition.config.key },
					map(config, (c) => c.key),
				);
				ckey.submitted.Connect((v) =>
					this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, key: v[uuid] })))),
				);

				if (definition.canBeSwitch) {
					const [, cswitch] = addSingleTypeWrapperAuto(
						this,
						"Switch",
						{ type: "bool", config: definition.config.switch },
						map(config, (c) => c.switch),
					);
					cswitch.submitted.Connect((v) =>
						this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, switch: v[uuid] })))),
					);
				}

				if (definition.canBeReversed) {
					const [, creversed] = addSingleTypeWrapperAuto(
						this,
						"Reversed",
						{ type: "bool", config: definition.config.reversed },
						map(config, (c) => c.reversed),
					);
					creversed.submitted.Connect((v) =>
						this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, reversed: v[uuid] })))),
					);
				}
			}
		}
		// export class vector3 extends Base<GuiObject, "vector3"> {
		// 	constructor(
		// 		templates: templates,
		// 		definition: MiniTypes["vector3"],
		// 		config: ConfigParts<"vector3">,
		// 	) {
		// 		super(templates.Multi());

		// 		const [, cx] = addSingleTypeWrapperAuto(
		// 			this,
		// 			"number",
		// 			"X",
		// 			{},
		// 			map(config, (c) => c.X),
		// 		);
		// 		const [, cy] = addSingleTypeWrapperAuto(
		// 			this,
		// 			"number",
		// 			"Y",
		// 			{},
		// 			map(config, (c) => c.Y),
		// 		);
		// 		const [, cz] = addSingleTypeWrapperAuto(
		// 			this,
		// 			"number",
		// 			"Z",
		// 			{},
		// 			map(config, (c) => c.Z),
		// 		);

		// 		const vec = (parts: OfBlocks<number>, axis: "X" | "Y" | "Z") => {
		// 			if (axis === "X") return map(config, (c, uuid) => new Vector3(parts[uuid], c.Y, c.Z));
		// 			if (axis === "Y") return map(config, (c, uuid) => new Vector3(c.X, parts[uuid], c.Z));
		// 			if (axis === "Z") return map(config, (c, uuid) => new Vector3(c.X, c.Y, parts[uuid]));

		// 			throw "what";
		// 		};

		// 		cx.submitted.Connect((n) => this.submitted.Fire((config = vec(n, "X"))));
		// 		cy.submitted.Connect((n) => this.submitted.Fire((config = vec(n, "Y"))));
		// 		cz.submitted.Connect((n) => this.submitted.Fire((config = vec(n, "Z"))));
		// 	}
		// }
		// export class motorRotationSpeed extends Base<GuiObject, "motorRotationSpeed"> {
		// 	constructor(
		// 		templates: templates,
		// 		definition: MiniTypes["motorRotationSpeed"],
		// 		config: ConfigParts<"motorRotationSpeed">,
		// 	) {
		// 		super(templates.Multi());

		// 		const mks = addMultiKeyControls(this, [
		// 			{ key: "add", displayName: "+", definition: {}, config: map(config, (c) => c.rotation.add) },
		// 			{ key: "sub", displayName: "-", definition: {}, config: map(config, (c) => c.rotation.sub) },
		// 		]);
		// 		const [, cMaxSpeed] = addSingleTypeWrapperAuto(
		// 			this,
		// 			"clampedNumber",
		// 			"Max speed",
		// 			{ min: 0, max: definition.maxSpeed, step: 0.01 },
		// 			map(config, (c) => c.speed),
		// 		);
		// 		const [, cSwitch] = addSingleTypeWrapperAuto(
		// 			this,
		// 			"bool",
		// 			"Switch mode",
		// 			{},
		// 			map(config, (c) => c.switchmode),
		// 		);

		// 		mks.submitted.Connect((v) =>
		// 			this.submitted.Fire((config = map(config, (c) => ({ ...c, rotation: { ...c.rotation, ...v } })))),
		// 		);
		// 		cMaxSpeed.submitted.Connect((v) =>
		// 			this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, speed: v[uuid] })))),
		// 		);
		// 		cSwitch.submitted.Connect((v) =>
		// 			this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, switchmode: v[uuid] })))),
		// 		);
		// 	}
		// }
		// export class servoMotorAngle extends Base<GuiObject, "servoMotorAngle"> {
		// 	constructor(
		// 		templates: templates,
		// 		definition: MiniTypes["servoMotorAngle"],
		// 		config: ConfigParts<"servoMotorAngle">,
		// 	) {
		// 		super(templates.Multi());

		// 		const mks = addMultiKeyControls(this, [
		// 			{ key: "add", displayName: "+", definition: {}, config: map(config, (c) => c.rotation.add) },
		// 			{ key: "sub", displayName: "-", definition: {}, config: map(config, (c) => c.rotation.sub) },
		// 		]);
		// 		const [, cAngle] = addSingleTypeWrapperAuto(
		// 			this,
		// 			"clampedNumber",
		// 			"Angle",
		// 			{ min: definition.minAngle, max: definition.maxAngle, step: 0.01 },
		// 			map(config, (c) => c.angle),
		// 		);
		// 		const [, cSwitch] = addSingleTypeWrapperAuto(
		// 			this,
		// 			"bool",
		// 			"Switch mode",
		// 			{},
		// 			map(config, (c) => c.switchmode),
		// 		);

		// 		mks.submitted.Connect((v) =>
		// 			this.submitted.Fire((config = map(config, (c) => ({ ...c, rotation: { ...c.rotation, ...v } })))),
		// 		);
		// 		cAngle.submitted.Connect((v) =>
		// 			this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, angle: v[uuid] })))),
		// 		);
		// 		cSwitch.submitted.Connect((v) =>
		// 			this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, switchmode: v[uuid] })))),
		// 		);
		// 	}
		// }
		// export class thrust extends Base<GuiObject, "thrust"> {
		// 	constructor(
		// 		templates: templates,
		// 		definition: MiniTypes["thrust"],
		// 		config: ConfigParts<"thrust">,
		// 	) {
		// 		super(templates.Multi());

		// 		const mks = addMultiKeyControls(this, [
		// 			{ key: "add", displayName: "+", definition: {}, config: map(config, (c) => c.thrust.add) },
		// 			{ key: "sub", displayName: "-", definition: {}, config: map(config, (c) => c.thrust.sub) },
		// 		]);
		// 		mks.submitted.Connect((v) =>
		// 			this.submitted.Fire((config = map(config, (c) => ({ ...c, thrust: { ...c.thrust, ...v } })))),
		// 		);

		// 		if (definition.canBeSwitch) {
		// 			const [, cSwitch] = addSingleTypeWrapperAuto(
		// 				this,
		// 				"bool",
		// 				"Switch mode",
		// 				{},
		// 				map(config, (c) => c.switchmode),
		// 			);
		// 			cSwitch.submitted.Connect((v) =>
		// 				this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, switchmode: v[uuid] })))),
		// 			);
		// 		}
		// 	}
		// }
		// export class controllableNumber extends Base<GuiObject, "controllableNumber"> {
		// 	constructor(
		// 		templates: templates,
		// 		definition: MiniTypes["controllableNumber"],
		// 		config: ConfigParts<"controllableNumber">,
		// 	) {
		// 		super(templates.Multi());

		// 		const mks = addMultiKeyControls(this, [
		// 			{ key: "add", displayName: "+", definition: {}, config: map(config, (c) => c.control.add) },
		// 			{ key: "sub", displayName: "-", definition: {}, config: map(config, (c) => c.control.sub) },
		// 		]);
		// 		const [, cValue] = addSingleTypeWrapperAuto(
		// 			this,
		// 			"clampedNumber",
		// 			"Value",
		// 			definition,
		// 			map(config, (c) => c.value),
		// 		);

		// 		mks.submitted.Connect((v) =>
		// 			this.submitted.Fire((config = map(config, (c) => ({ ...c, control: { ...c.control, ...v } })))),
		// 		);
		// 		cValue.submitted.Connect((v) =>
		// 			this.submitted.Fire((config = map(config, (c, uuid) => ({ ...c, value: v[uuid] })))),
		// 		);
		// 	}
		// }

		function addMultiKeyControls<TKeys extends string>(
			parent: Base<GuiObject, AllKeys>,
			stuffs: readonly {
				readonly key: TKeys;
				readonly displayName: string;
				readonly definition: AllMiniTypes["key"];
				readonly config: ConfigParts<"key">;
			}[],
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
				);
				const keycontrol = control as key;
				ret[key] = { wrapper, control: keycontrol };

				prevValues[key] = keycontrol.keyChooser.value.get();

				control.submitted.Connect((values) => {
					const changed: TKeys[] = [key];
					const value = Objects.firstValue(values);

					const prev = prevValues[key];
					prevValues[key] = value;
					for (const [otherkey, { control: otherControl }] of pairs(ret)) {
						if (control === otherControl) continue;

						const othervalue = otherControl.keyChooser.value.get();
						print("this", value, "other", otherkey, othervalue);

						if (value === othervalue) {
							otherControl.keyChooser.value.set(prev);
							prevValues[otherkey] = prev;

							print(`setting from ${key} to ${otherkey} ${value}=>${prev} mega child values`);
							changed.push(otherkey);

							break;
						}
					}

					print(`FIRING ${changed.size()} changed`, changed);
					submitted.Fire(
						asObject(changed.mapToMap((k) => $tuple(k, ret[k]?.control.keyChooser.value.get()))),
					);
				});
			}

			return { submitted, ...(ret as { [k in TKeys]-?: (typeof ret)[k] & defined }) };
		}

		export type controls = {
			readonly [k in AllKeys]?: new (
				templates: templates,
				definition: AllWithoutDefaultTypes[k],
				config: ConfigParts<k>,
			) => Base<GuiObject, k>;
		};
		export type genericControls = {
			readonly [k in AllKeys]?: new (
				templates: templates,
				definition: AllWithoutDefaultTypes[AllKeys],
				config: ConfigParts<AllKeys>,
			) => Base<GuiObject, AllKeys>;
		};
	}

	export const controls = {
		...Controls,
		number: Controls._number,
		// string: Controls._string,
	} satisfies Controls.controls as Controls.genericControls;
}

type ConfigValueDefinition<T> = GuiObject & {
	readonly HeadingLabel: TextLabel;
	readonly Control: T;
};

type ConfigValueWrapperDefinition = GuiObject & {
	readonly TypeLine: Frame;
	readonly Content: GuiObject & Controls.Templates & { readonly Dropdown: DropdownListDefinition };
};
type m = "[multi]";
type mk = PrimitiveKeys | m;

class ConfigValueWrapper extends Control<ConfigValueWrapperDefinition> {
	readonly typeColor = new ObservableValue<Color3>(Colors.white);
	readonly dropdown;
	readonly content;

	constructor(gui: ConfigValueWrapperDefinition) {
		super(gui);

		this.event.subscribeObservable(this.typeColor, (color) => (gui.TypeLine.BackgroundColor3 = color), true);

		this.dropdown = this.add(new DropdownList<mk>(gui.Content.Dropdown));

		this.content = new ComponentChild<Control>(this);
		this.content.childSet.Connect((child) => {
			if (!child) return;
			child.instance.Parent = gui.Content;
		});
	}
}

class ConfigAutoValueWrapper extends Control<ConfigValueWrapperDefinition> {
	private readonly _submitted = new ArgsSignal<[config: BlocksConfigPart]>();
	readonly submitted = this._submitted.asReadonly();

	constructor(gui: ConfigValueWrapperDefinition, definition: VisualBlockConfigDefinition, configs: BlocksConfigPart) {
		super(gui);

		const control = this.add(new ConfigValueWrapper(gui));
		control.dropdown.addItem("unset");

		const selectedType = new ObservableValue<mk>("unset");
		selectedType.subscribe((t) => control.dropdown.selectedItem.set(t), true);
		control.dropdown.selectedItem.subscribe((t) => t && selectedType.set(t));

		for (const [k, type] of pairs(definition.types)) {
			control.dropdown.addItem(k);
		}

		if (asMap(configs).any((k, v) => v.type === "wire")) {
			// if any of the configs is a wire connection

			selectedType.set("wire");
			control.dropdown.hide();
		} else if (asMap(definition.types).size() === 1) {
			// if there is only one definition type

			const key = Objects.firstKey(definition.types)!;
			selectedType.set(key);
			control.dropdown.hide();
		} else {
			// if there is multiple definition types

			const types = asSet(asMap(configs).mapToMap((k, v) => $tuple(v.type, true as const)));
			if (types.size() === 1) {
				// if every config has the same type set
				selectedType.set(Objects.firstKey(types)!);
			} else {
				// if configs have different types set
				selectedType.set("[multi]");
			}
		}

		this.event.subscribe(control.dropdown.submitted, (selectedType) => {
			if (selectedType === "[multi]" || selectedType === "unset" || selectedType === "wire") {
				return;
			}

			configs = map(
				configs,
				(_): TypedConfigPart => ({
					type: selectedType,
					config: definition.types[selectedType]!.config,
				}),
			);
			this._submitted.Fire(configs);
		});

		this.event.subscribeObservable(
			selectedType,
			(selectedType) => {
				control.content.set(undefined);

				if (!selectedType) return;
				if (selectedType === "[multi]") selectedType = "unset";
				if (selectedType !== "unset" && selectedType !== "wire" && !(selectedType in definition.types)) return;

				control.typeColor.set(BlockWireManager.typeGroups[BlockWireManager.groups[selectedType]].color);

				const ctor = Controls.controls[selectedType];
				if (!ctor) return;

				let cfgcontrol: InstanceType<typeof ctor> | undefined = undefined;

				if (selectedType === "unset") {
					cfgcontrol = new ctor(
						Controls.templates,
						{ type: "unset", config: {} as BlockLogicTypes3.UnsetValue },
						{},
					);
				} else if (selectedType === "wire") {
					cfgcontrol = new ctor(
						Controls.templates,
						{ type: "wire", config: undefined! },
						map(configs, (c) => c.config),
					);
				} else {
					const def = definition.types[selectedType];
					if (!def) return;

					const partialConfigs = map(configs, (c) => c.config);
					cfgcontrol = new ctor(Controls.templates, def, partialConfigs);
				}

				cfgcontrol.instance.HeadingLabel.Text = definition.displayName;
				cfgcontrol.submitted.Connect((v) =>
					this._submitted.Fire(
						(configs = map(configs, (c, uuid) => ({ type: selectedType, config: v[uuid] }))),
					),
				);

				control.content.set(cfgcontrol);
			},
			true,
		);
	}
}

export class MultiBlockConfigControl extends Control {
	private readonly _submitted = new ArgsSignal<[config: BlocksConfig]>();
	readonly submitted = this._submitted.asReadonly();

	constructor(gui: GuiObject, definitions: VisualBlockConfigDefinitions, configs: BlocksConfig) {
		super(gui);

		for (const [k, definition] of pairs(definitions)) {
			const lconfigs = map(configs, (c) => c[k]);
			const wrapper = this.add(new ConfigAutoValueWrapper(template.Clone(), definition, lconfigs));

			wrapper.submitted.Connect((v) =>
				this._submitted.Fire((configs = map(configs, (c, uuid) => ({ ...c, [k]: v[uuid] })))),
			);
		}
	}
}

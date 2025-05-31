import { ConfigControlButton } from "client/gui/configControls/ConfigControlButton";
import { ConfigControlByte } from "client/gui/configControls/ConfigControlByte";
import { ConfigControlByteArray } from "client/gui/configControls/ConfigControlByteArray";
import { ConfigControlCheckbox } from "client/gui/configControls/ConfigControlCheckbox";
import { ConfigControlColor3 } from "client/gui/configControls/ConfigControlColor";
import { ConfigControlEmpty } from "client/gui/configControls/ConfigControlEmpty";
import { ConfigControlKeyOrString } from "client/gui/configControls/ConfigControlKey";
import { ConfigControlMulti } from "client/gui/configControls/ConfigControlMulti";
import { ConfigControlMultiKeys } from "client/gui/configControls/ConfigControlMultiKeys";
import { ConfigControlNumber } from "client/gui/configControls/ConfigControlNumber";
import { ConfigControlSlider } from "client/gui/configControls/ConfigControlSlider";
import { ConfigControlSound } from "client/gui/configControls/ConfigControlSound";
import { ConfigControlString } from "client/gui/configControls/ConfigControlString";
import { ConfigControlSwitch } from "client/gui/configControls/ConfigControlSwitch";
import { ConfigControlVector3 } from "client/gui/configControls/ConfigControlVector3";
import { CheckBoxControl } from "client/gui/controls/CheckBoxControl";
import { DropdownList } from "client/gui/controls/DropdownList";
import { Interface } from "client/gui/Interface";
import { Control } from "engine/client/gui/Control";
import { ComponentChild } from "engine/shared/component/ComponentChild";
import { ComponentChildren } from "engine/shared/component/ComponentChildren";
import { Observables } from "engine/shared/event/Observables";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { ArgsSignal } from "engine/shared/event/Signal";
import { Objects } from "engine/shared/fixes/Objects";
import { BlockConfig } from "shared/blockLogic/BlockConfig";
import { BlockWireManager } from "shared/blockLogic/BlockWireManager";
import { Colors } from "shared/Colors";
import type { ConfigControlMultiDefinition } from "client/gui/configControls/ConfigControlMulti";
import type { ConfigControlTemplateList } from "client/gui/configControls/ConfigControlsList";
import type { CheckBoxControlDefinition } from "client/gui/controls/CheckBoxControl";
import type { DropdownListDefinition } from "client/gui/controls/DropdownList";
import type { SwitchControlItem } from "client/gui/controls/SwitchControl";
import type { FakeObservableValue } from "engine/shared/event/FakeObservableValue.propmacro";
import type { BlockConfigPart } from "shared/blockLogic/BlockConfig";
import type { BlockLogicWithConfigDefinitionTypes } from "shared/blockLogic/BlockLogic";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";

type Primitives = BlockLogicTypes.Primitives;
type PrimitiveKeys = keyof Primitives;

type Controls = BlockLogicTypes.Controls;
type ControlKeys = keyof Controls;

type OfBlocks<T> = object & { readonly [k in BlockUuid]: T };

type VisualBlockConfigDefinition = {
	readonly displayName: string;
	readonly tooltip?: string;
	readonly unit?: string;
	readonly types: Partial<BlockLogicWithConfigDefinitionTypes<PrimitiveKeys>>;
	readonly connectorHidden?: boolean;
	readonly configHidden?: boolean;
	readonly group?: string;
};
export type VisualBlockConfigDefinitions = {
	readonly [k in string]: VisualBlockConfigDefinition;
};

type TypedConfigPart<K extends PrimitiveKeys = PrimitiveKeys> = BlockConfigPart<K>;
type BlocksConfigPart<K extends PrimitiveKeys = PrimitiveKeys> = OfBlocks<TypedConfigPart<K>>;
type BlocksConfig = OfBlocks<{ readonly [k in string]: TypedConfigPart }>;

/** Map the config values, leaving the keys as is */
const map = <T, TOut extends defined>(
	configs: OfBlocks<T>,
	mapfunc: (value: T, key: BlockUuid) => TOut,
): OfBlocks<TOut> => {
	return asObject(asMap(configs).mapToMap((k, v) => $tuple(k, mapfunc(v, k))));
};

//

const template = Interface.getInterface<{
	Main: { Left: { Config: { Content: { ScrollingFrame: { Template: ConfigValueWrapperDefinition } } } } };
}>().Main.Left.Config.Content.ScrollingFrame.Template;
template.Visible = false;

type ConfigValueWrapperDefinition = GuiObject & {
	readonly TypeLine: Frame;
	readonly Content: GuiObject & {
		readonly TypeDropdown: DropdownListDefinition;
		readonly TypeControllable: GuiObject & {
			readonly Controllable: GuiObject & {
				readonly Control: CheckBoxControlDefinition;
			};
		};
	};
	readonly ContentNew: GuiObject & {
		readonly TypeDropdown: DropdownListDefinition;
		readonly TypeControllable: GuiObject & {
			readonly Controllable: GuiObject & {
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

	readonly content;

	constructor(gui: ConfigValueWrapperDefinition) {
		super(gui);

		this.event.subscribeObservable(this.typeColor, (color) => (gui.TypeLine.BackgroundColor3 = color), true);
		this.dropdown = this.parent(new DropdownList<mk>(gui.ContentNew.TypeDropdown));

		gui.Visible = true;
		this.content = this.parent(new ComponentChild<Control>()).withParentInstance(gui.ContentNew);

		this.controls = this.parent(new Control(gui.ContentNew.TypeControllable));
		this.controllable = this.controls.parent(new CheckBoxControl(this.controls.instance.Controllable.Control));
	}
}

const clone = <T extends GuiObject>(instance: T): T => {
	const clone = instance.Clone();
	clone.Visible = true;

	return clone;
};
namespace ControllableControls {
	type args<k extends ControlKeys> = [
		values: OfBlocks<Controls[k]["config"]>,
		blockdef: VisualBlockConfigDefinition,
		def: Omit<Primitives[k], "default">,
	];

	export class Bool extends ConfigControlMulti<Controls["bool"]["config"]> {
		constructor(
			gui: ConfigControlMultiDefinition,
			name: string,
			templates: ConfigControlTemplateList,
			...[values, blockdef, def]: args<"bool">
		) {
			type t = Controls["bool"]["config"];
			super(gui, name);
			this.setValues(values);

			const ov = Objects.mapValues(values, (k, v) => new ObservableValue(v));
			for (const [, observable] of pairs(ov)) {
				observable.subscribe(() => this.submit(map(ov, (v, k) => v.get())));
			}

			const fromPath = <const TPath extends Objects.PathsOf<t>>(...path: TPath) => {
				type ret = { readonly [k in BlockUuid]: FakeObservableValue<Objects.ValueOf<t, TPath>> };
				return Objects.mapValues(ov, (k, ov) =>
					Observables.createObservableFromObjectPropertyTyped(ov, path),
				) as ret;
			};

			this.parent(new ConfigControlKeyOrString(clone(templates.Key), "Key")) //
				.initToObservables(fromPath("key"));

			if (def.control?.canBeSwitch) {
				this.parent(new ConfigControlCheckbox(clone(templates.Checkbox), "Switch")) //
					.initToObservables(fromPath("switch"));
			}

			if (def.control?.canBeReversed) {
				this.parent(new ConfigControlCheckbox(clone(templates.Checkbox), "Reversed")) //
					.initToObservables(fromPath("reversed"));
			}
		}
	}

	export class Number extends ConfigControlMulti<Controls["number"]["config"]> {
		constructor(
			gui: ConfigControlMultiDefinition,
			name: string,
			templates: ConfigControlTemplateList,
			...[values, blockdef, def]: args<"number">
		) {
			type t = Controls["number"]["config"];
			super(gui, name);
			this.setValues(values);

			const ov = Objects.mapValues(values, (k, v) => new ObservableValue(v));
			for (const [, observable] of pairs(ov)) {
				observable.subscribe(() => {
					this.submit(map(ov, (v, k) => v.get()));
					update();
				});
			}

			const fromPath = <const TPath extends Objects.PathsOf<t>>(...path: TPath) => {
				return Objects.mapValues(ov, (k, ov) => Observables.createObservableFromObjectPropertyTyped(ov, path));
			};
			const fromPathNoDeepCombine = <const TPath extends Objects.PathsOf<t>>(...path: TPath) => {
				return Objects.mapValues(ov, (k, ov) =>
					ov.fCreateBased(
						(c) => Objects.getValueByPathTyped(c, path),
						(c) => Objects.withValueByPath(ov.get(), c, path),
					),
				);
			};

			this.parent(
				new ConfigControlMultiKeys(
					clone(templates.MultiKeys),
					"Keys",
					def.config,
					def.clamp?.min,
					def.clamp?.max,
				),
			).initToObservables(fromPathNoDeepCombine("keys"));

			this.parent(
				new ConfigControlSwitch(clone(templates.Switch), "Type", [
					["smooth", { name: "Smooth" }],
					["instant", { name: "Instant" }],
				]),
			).initToObservables(fromPath("mode", "type"));

			const createSmoothMode = () => {
				const modeParent = this.parent(new ComponentChildren<Control>()).withParentInstance(gui);

				const modes: readonly (readonly [BlockLogicTypes.NumberControlModesSmoothMode, SwitchControlItem])[] = [
					[
						"stopOnRelease",
						{
							name: "Stop on release",
							description: "Stops upon releasing the key",
						},
					],
					[
						"stopOnDoublePress",
						{
							name: "Stop on double press",
							description: "Stops upon pressing the same key twice",
						},
					],
					[
						"resetOnRelease",
						{
							name: "Reset on release",
							description: "Smoothly resets upon releasing the key",
						},
					],
					[
						"instantResetOnRelease",
						{
							name: "Instant reset on release",
							description: "Resets upon releasing the key",
						},
					],
					[
						"resetOnDoublePress",
						{
							name: "Reset on double press",
							description: "Smoothly resets upon pressing the same key twice",
						},
					],
					[
						"instantResetOnDoublePress",
						{
							name: "Instant reset on double press",
							description: "Resets upon pressing the same key twice",
						},
					],
					[
						"never",
						{
							name: "Never",
							description: "Never stops or resets",
						},
					],
				];

				modeParent
					.add(new ConfigControlSwitch(clone(templates.Switch), "Smooth mode", modes))
					.initToObservables(fromPath("mode", "smooth", "mode"));

				modeParent
					.add(
						new ConfigControlSlider(clone(templates.Slider), "Speed", {
							min: 0,
							max: (def.clamp?.max ?? 200) - (def.clamp?.min ?? 0),
						}),
					)
					.initToObservables(fromPath("mode", "smooth", "speed"));

				return modeParent;
			};
			const createInstantMode = () => {
				const modeParent = this.parent(new ComponentChildren<Control>()).withParentInstance(gui);

				const modes: readonly (readonly [BlockLogicTypes.NumberControlModesResetMode, SwitchControlItem])[] = [
					[
						"onRelease",
						{
							name: "On release",
							description: "Resets upon releasing the key",
						},
					],
					[
						"onDoublePress",
						{
							name: "On double press",
							description: "Resets upon pressing the same key twice",
						},
					],
					[
						"never",
						{
							name: "Never",
							description: "Does not reset",
						},
					],
				];

				modeParent
					.add(new ConfigControlSwitch(clone(templates.Switch), "Instant mode", modes))
					.initToObservables(fromPath("mode", "instant", "mode"));
				return modeParent;
			};

			const modes = {
				smooth: createSmoothMode(),
				instant: createInstantMode(),
			};

			const update = () => {
				for (const [, container] of pairs(modes)) {
					for (const child of container.getAll()) {
						child.hide();
					}
				}

				const mode = this.multiOf(this.multiMap((k, v) => v.mode.type));
				if (mode) {
					for (const child of modes[mode].getAll()) {
						child.show();
					}
				}
			};
			this.onEnable(update);
		}
	}
}

type Args = {
	travelTo(uuid: BlockUuid): void;
};
class ConfigAutoValueWrapper extends Control<ConfigValueWrapperDefinition> {
	private readonly _submitted = new ArgsSignal<[config: BlocksConfigPart]>();
	readonly submitted = this._submitted.asReadonly();

	constructor(
		gui: ConfigValueWrapperDefinition,
		definition: VisualBlockConfigDefinition,
		configs: BlocksConfigPart,
		args: Args,
		key: string,
		wireTypes: WireTypes,
	) {
		super(gui);

		const control = this.parent(new ConfigValueWrapper(gui));

		// without a connector we can only configure the value with the config tool; thus, "unset" makes zero sense
		if (!definition.connectorHidden) {
			control.dropdown.addItem("unset");
		}

		const selectedType = new ObservableValue<mk>("unset");
		selectedType.subscribe((t) => control.dropdown.selectedItem.set(t), true);
		control.dropdown.selectedItem.subscribe((t) => t && selectedType.set(t));

		// all the possible types of every block
		const availableBlockTypes = asMap(configs).map((k) => {
			const marker = wireTypes.get(k)?.findValue((k, t) => t.data.id === key);
			if (!marker) return [];

			const intersectWithSameGroup = (types: readonly (keyof BlockLogicTypes.Primitives)[]) => {
				return BlockWireManager.intersectTypes([
					types,
					...(marker.sameGroupMarkers?.map((m) => m.availableTypes.get()) ?? []),
				]);
			};

			if (marker instanceof BlockWireManager.Markers.Input) {
				const connected = marker.connected.get();
				if (connected) {
					return intersectWithSameGroup(
						BlockWireManager.intersectTypes([marker.data.dataTypes, connected.availableTypes.get()]),
					);
				} else {
					return intersectWithSameGroup(marker.data.dataTypes);
				}
			} else {
				const connected = marker.getConnected();
				const intersected = BlockWireManager.intersectTypes(connected.map((c) => c.availableTypes.get()));
				return intersectWithSameGroup(intersected);
			}
		});
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

			control.typeColor.set(BlockWireManager.types[stype].color);

			// initializing the top `Controllable` bar
			const initControls = () => {
				control.controls.hide();

				const def = definition.types[stype];
				if (!def) return;

				if (!("control" in def) || !def.control) {
					return;
				}

				control.controls.show();

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
			};
			initControls();

			const templates: ConfigControlTemplateList = Interface.getInterface<{
				Popups: {
					Crossplatform: {
						Settings: {
							Content: { Content: { ScrollingFrame: GuiObject & ConfigControlTemplateList } };
						};
					};
				};
			}>().Popups.Crossplatform.Settings.Content.Content.ScrollingFrame.Clone();

			interface ConfigControl extends Control {
				submitted(func: (value: OfBlocks<prims[keys]["config"]>) => void): void;
				setDescription(text: string | undefined): void;
			}

			type prims = BlockLogicTypes.Primitives;
			type keys = keyof prims;

			type retf<k extends keys> = (
				values: OfBlocks<prims[k]["config"]>,
				blockdef: VisualBlockConfigDefinition,
				stype: k,
			) => ConfigControl;
			const controls = {
				unset: (values, blockdef) => {
					return new ConfigControlEmpty(clone(templates.Empty), blockdef.displayName);
				},
				wire: (values, blockdef) => {
					const size = Objects.size(values);
					if (size === 1) {
						const { blockUuid } = firstValue(values)!;

						return new ConfigControlButton(clone(templates.Button), blockdef.displayName, () => {
							args.travelTo(blockUuid);
						}).with((b) => b.button.setButtonText("→"));
					}

					return new ConfigControlButton(clone(templates.Button), blockdef.displayName, () => {}) //
						.with((b) => b.button.setButtonText("→"))
						.with((b) => b.button.setButtonInteractable(false));
				},

				number: (values, blockdef, stype) => {
					const def = definition.types[stype];
					if (!def) throw "what";

					if (def.clamp?.showAsSlider) {
						return new ConfigControlSlider(clone(templates.Slider), blockdef.displayName, {
							min: def.clamp.min,
							max: def.clamp.max,
							step: def.clamp.step,
						}).setValues(values);
					}

					return new ConfigControlNumber(
						clone(templates.Number),
						blockdef.displayName,
						def.clamp?.min,
						def.clamp?.max,
						def.clamp?.step,
					).setValues(values);
				},
				string: (values, blockdef) => {
					return new ConfigControlString(clone(templates.String), blockdef.displayName) //
						.setValues(values);
				},
				bool: (values, blockdef) => {
					return new ConfigControlCheckbox(clone(templates.Checkbox), blockdef.displayName) //
						.setValues(values);
				},
				color: (values, blockdef) => {
					return new ConfigControlColor3(clone(templates.Color), blockdef.displayName, Colors.white) //
						.setValues(values);
				},
				key: (values, blockdef) => {
					return new ConfigControlKeyOrString(clone(templates.Key), blockdef.displayName) //
						.setValues(values);
				},
				vector3: (values, blockdef) => {
					return new ConfigControlVector3(clone(templates.Vector3), blockdef.displayName) //
						.setValues(values);
				},
				enum: (values, blockdef, stype) => {
					const def = definition.types[stype];
					if (!def) throw "what";

					const items = def.elementOrder.map((k) => {
						const e = def.elements[k];
						const item = { name: e.displayName, description: e.tooltip } satisfies SwitchControlItem;

						return [k, item] as const;
					});

					return new ConfigControlSwitch(clone(templates.Switch), blockdef.displayName, items) //
						.setValues(values);
				},
				byte: (values, blockdef) => {
					return new ConfigControlByte(clone(templates.Byte), blockdef.displayName) //
						.setValues(values);
				},
				bytearray: (values, blockdef, stype) => {
					const def = definition.types[stype];
					if (!def) throw "what";

					return new ConfigControlByteArray(clone(templates.Edit), blockdef.displayName, def.lengthLimit) //
						.setValues(values);
				},
				sound: (values, blockdef, stype) => {
					const def = definition.types[stype];
					if (!def) throw "what";

					return new ConfigControlSound(clone(templates.Sound), blockdef.displayName) //
						.setValues(values);
				},
			} satisfies { readonly [k in keys]: retf<k> } as { readonly [k in keys]: retf<keys> };

			interface controlConfigControl extends Control {
				submitted(func: (value: OfBlocks<controlPrims[controlKeys]["config"]>) => void): void;
				setDescription(text: string | undefined): void;
			}

			type controlPrims = Controls;
			type controlKeys = keyof controlPrims;
			type controlRetf<k extends controlKeys> = (
				values: OfBlocks<controlPrims[k]["config"]>,
				blockdef: VisualBlockConfigDefinition,
				def: Omit<prims[k], "default">,
			) => controlConfigControl | undefined;

			const controlsControl = {
				bool: (values, blockdef, def) => {
					return new ControllableControls.Bool(
						clone(templates.Multi),
						blockdef.displayName,
						templates,
						values,
						blockdef,
						def,
					);
				},
				number: (values, blockdef, def) => {
					return new ControllableControls.Number(
						clone(templates.Multi),
						blockdef.displayName,
						templates,
						values,
						blockdef,
						def,
					);
				},
			} satisfies {
				readonly [k in controlKeys]: controlRetf<k> | undefined;
			} as {
				readonly [k in controlKeys]: controlRetf<controlKeys> | undefined;
			};

			//

			const cg = () => {
				const isControllable = control.controllable.value.get();
				if (isControllable === undefined) {
					// TODO: [mixed] message or somethin
					return;
				}

				const setDescription = (control: ConfigControl | controlConfigControl) => {
					if (definition.tooltip && definition.unit) {
						control.setDescription(`${definition.tooltip} (${definition.unit})`);
					} else if (definition.tooltip) {
						control.setDescription(`${definition.tooltip}`);
					} else if (definition.unit) {
						control.setDescription(`${definition.unit}`);
					}
				};

				if (!isControllable) {
					const ctor = controls[stype];
					const control = ctor(
						map(configs, (c) => c.config),
						definition,
						stype,
					);
					setDescription(control);

					control.submitted((values) => {
						this._submitted.Fire(
							(configs = map(configs, (c, uuid) => ({
								...c,
								type: stype,
								config: values[uuid],
							}))),
						);
					});
					return control;
				} else {
					const ctor = controlsControl[stype as controlKeys];
					if (!ctor) return;

					const def = definition.types[stype as controlKeys];
					if (!def) return;

					const control = ctor(
						map(configs, (c) => c.controlConfig!),
						definition,
						def,
					);
					if (!control) return;
					setDescription(control);

					control.submitted((values) => {
						this._submitted.Fire(
							(configs = map(configs, (c, uuid) => ({
								...c,
								type: stype,
								controlConfig: values[uuid],
							}))),
						);
					});
					return control;
				}
			};

			const cfgcontrol = cg();
			if (cfgcontrol) {
				control.content.set(cfgcontrol);
				return;
			}
		};

		this.event.subscribe(control.controllable.submitted, (enabled) => {
			// controlConfig will not be undefined if the controls are visible so we don't need to check that
			this._submitted.Fire(
				(configs = map(configs, (c) => ({ ...c, controlConfig: { ...c.controlConfig!, enabled } }))),
			);
			reload();
		});

		this.event.subscribeObservable(selectedType, reload);
		this.onEnable(reload);
	}
}

type WireTypes = ReadonlyMap<
	BlockUuid,
	ReadonlyMap<string, BlockWireManager.Markers.Input | BlockWireManager.Markers.Output>
>;
@injectable
export class MultiBlockConfigControl extends Control implements Args {
	private readonly _travelledTo = new ArgsSignal<[uuid: BlockUuid]>();
	readonly travelledTo = this._travelledTo.asReadonly();

	private readonly _submitted = new ArgsSignal<[config: BlocksConfig]>();
	readonly submitted = this._submitted.asReadonly();

	private readonly children;

	constructor(
		gui: GuiObject,
		definitions: VisualBlockConfigDefinitions,
		configs: BlocksConfig,
		order: readonly string[] | undefined,
		wireTypes: WireTypes,
		@inject di: DIContainer,
	) {
		super(gui);

		this.children = this.parent(new ComponentChildren().withParentInstance(gui));

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
				if (definition.configHidden && !asMap(configs).any((uuid, c) => c[k].type === "wire")) continue;

				const lconfigs = map(configs, (c) => c[k]);
				const wrapper = this.children.add(
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

						configs = map(configs, (c) => {
							const ret = { ...c };

							for (const { key } of grouped) {
								const t = c[key];
								if (t.type === "unset") continue;
								if (t.type === "wire") continue;
								if (t.type === setType) continue;

								needsClearing = true;
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
						this.children.clear();
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

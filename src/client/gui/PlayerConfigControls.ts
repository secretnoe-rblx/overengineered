import { ColorChooser } from "client/gui/ColorChooser";
import { DropdownList } from "client/gui/controls/DropdownList";
import { KeyChooserControl } from "client/gui/controls/KeyChooserControl";
import { NumberTextBoxControl } from "client/gui/controls/NumberTextBoxControl";
import { SliderControl } from "client/gui/controls/SliderControl";
import { ToggleControl } from "client/gui/controls/ToggleControl";
import { Interface } from "client/gui/Interface";
import { TextButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { ComponentChildren } from "engine/shared/component/ComponentChildren";
import { Signal } from "engine/shared/event/Signal";
import { Objects } from "engine/shared/fixes/Objects";
import type { ColorChooserDefinition } from "client/gui/ColorChooser";
import type { DropdownListDefinition } from "client/gui/controls/DropdownList";
import type { KeyChooserControlDefinition } from "client/gui/controls/KeyChooserControl";
import type { NumberTextBoxControlDefinition } from "client/gui/controls/NumberTextBoxControl";
import type { SliderControlDefinition } from "client/gui/controls/SliderControl";
import type { ToggleControlDefinition } from "client/gui/controls/ToggleControl";
import type { TutorialsService } from "client/tutorial/TutorialService";
import type { TextButtonDefinition } from "engine/client/gui/Button";
import type { ReadonlyArgsSignal } from "engine/shared/event/Signal";

type ConfigPartDefinition<T extends GuiObject> = GuiObject & {
	readonly HeadingLabel: TextLabel;
	readonly Control: T;
};
class ConfigValueControl<TGui extends GuiObject> extends Control<ConfigPartDefinition<TGui>> {
	constructor(gui: ConfigPartDefinition<TGui>, name: string) {
		super(gui);
		this.gui.HeadingLabel.Text = name;
	}
}

const templatesFolder = Interface.getGameUI<{
	readonly Templates: {
		readonly PlayerConfig: {
			readonly ToggleTemplate: ConfigPartDefinition<ToggleControlDefinition>;
			readonly ColorTemplate: ConfigPartDefinition<ColorChooserDefinition>;
			readonly NumberTemplate: ConfigPartDefinition<NumberTextBoxControlDefinition>;
			readonly SliderTemplate: ConfigPartDefinition<SliderControlDefinition>;
			readonly MultiTemplate: ConfigPartDefinition<GuiObject>;
			readonly DropdownTemplate: ConfigPartDefinition<DropdownListDefinition>;
			readonly KeyTemplate: ConfigPartDefinition<KeyChooserControlDefinition>;
		};
	};
}>().Templates.PlayerConfig;
const templates = {
	toggle: Control.asTemplateWithMemoryLeak(templatesFolder.ToggleTemplate, false),
	color: Control.asTemplateWithMemoryLeak(templatesFolder.ColorTemplate, false),
	number: Control.asTemplateWithMemoryLeak(templatesFolder.NumberTemplate, false),
	slider: Control.asTemplateWithMemoryLeak(templatesFolder.SliderTemplate, false),
	multi: Control.asTemplateWithMemoryLeak(templatesFolder.MultiTemplate, false),
	dropdown: Control.asTemplateWithMemoryLeak(templatesFolder.DropdownTemplate, false),
	key: Control.asTemplateWithMemoryLeak(templatesFolder.KeyTemplate, false),
} as const;

namespace ControlsSource {
	export class bool extends ConfigValueControl<ToggleControlDefinition> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.Bool["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.Bool["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Bool>,
		) {
			super(templates.toggle(), definition.displayName);

			const control = this.parent(new ToggleControl(this.gui.Control));
			control.value.set(config);

			this.event.subscribe(control.submitted, (value) => this.submitted.Fire(value));
		}
	}

	export class color extends ConfigValueControl<ColorChooserDefinition> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.Color["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.Color["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Color>,
		) {
			super(templates.color(), definition.displayName);

			const control = this.parent(new ColorChooser(this.gui.Control));
			control.value.set(config);

			this.event.subscribe(control.value.submitted, (value) => this.submitted.Fire(value));
		}
	}

	@injectable
	export class beacons extends ConfigValueControl<GuiObject> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.Beacons["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.Beacons["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Beacons>,
			@inject di: DIContainer,
		) {
			super(templates.multi(), definition.displayName);

			const def = {
				plot: {
					displayName: "Plot",
					type: "bool",
					config: true as boolean,
				},
				players: {
					displayName: "Players",
					type: "bool",
					config: false as boolean,
				},
			} as const satisfies PlayerConfigTypes.Definitions;
			const _compilecheck: ConfigDefinitionsToConfig<keyof typeof def, typeof def> = config;

			const control = this.parent(new MultiPlayerConfigControl(this.gui.Control, di));
			control.set(config, def);
			this.event.subscribe(control.configUpdated, (key, value) => {
				this.submitted.Fire((config = { ...config, [key]: value }));
			});
		}
	}

	@injectable
	export class camera extends ConfigValueControl<GuiObject> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.Camera["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.Camera["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Camera>,
			@inject di: DIContainer,
		) {
			super(templates.multi(), definition.displayName);

			const def = {
				improved: {
					displayName: "Improved",
					type: "bool",
					config: definition.config.improved,
				},
				strictFollow: {
					displayName: "Strict Following",
					type: "bool",
					config: definition.config.strictFollow,
				},
				playerCentered: {
					displayName: "Player Centered",
					type: "bool",
					config: definition.config.playerCentered,
				},
				fov: {
					displayName: "Field Of View",
					type: "clampedNumber",
					config: definition.config.fov,
					min: 1,
					max: 120,
					step: 0.01,
				},
			} as const satisfies PlayerConfigTypes.Definitions;
			const _compilecheck: ConfigDefinitionsToConfig<keyof typeof def, typeof def> = config;

			const control = this.parent(new MultiPlayerConfigControl<typeof def>(this.gui.Control, di));
			control.set(config, def);
			this.event.subscribe(control.configUpdated, (key, value) => {
				this.submitted.Fire((config = { ...config, [key]: value }));
			});

			const improved = control.get("improved");
			const strictFollow = control.get("strictFollow");
			const playerCentered = control.get("playerCentered");

			const setImprovedControlsEnabled = (enabled: boolean) => {
				strictFollow.setVisibleAndEnabled(enabled);
				playerCentered.setVisibleAndEnabled(enabled);
			};
			this.event.subscribe(improved.submitted, setImprovedControlsEnabled);
			setImprovedControlsEnabled(config.improved);
		}
	}

	export class clampedNumber extends ConfigValueControl<SliderControlDefinition> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.ClampedNumber["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.ClampedNumber["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.ClampedNumber>,
		) {
			super(templates.slider(), definition.displayName);

			const control = this.parent(
				new SliderControl(this.gui.Control, definition.min, definition.max, definition.step),
			);
			control.value.set(config);

			this.event.subscribe(control.submitted, (value) => this.submitted.Fire(value));
		}
	}

	@injectable
	export class dayCycle extends ConfigValueControl<GuiObject> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.DayCycle["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.DayCycle["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.DayCycle>,
			@inject di: DIContainer,
		) {
			super(templates.multi(), definition.displayName);

			const def = {
				automatic: {
					displayName: "Automatic",
					type: "bool",
					config: true as boolean,
				},
				manual: {
					displayName: "Manual time (hours)",
					type: "clampedNumber",
					config: 0 as number,
					min: 0,
					max: 24,
					step: 0.1,
				},
			} as const satisfies PlayerConfigTypes.Definitions;
			const _compilecheck: ConfigDefinitionsToConfig<keyof typeof def, typeof def> = config;

			const control = this.parent(new MultiPlayerConfigControl(this.gui.Control, di));
			control.set(config, def);
			this.event.subscribe(control.configUpdated, (key, value) => {
				this.submitted.Fire((config = { ...config, [key]: value }));
			});
		}
	}

	export class dropdown<T extends string = string> extends ConfigValueControl<DropdownListDefinition> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.Dropdown<T>["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.Dropdown<T>["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Dropdown<T>>,
		) {
			super(templates.dropdown(), definition.displayName);

			const control = this.parent(new DropdownList<T>(this.gui.Control));
			for (const item of definition.items) {
				control.addItem(item);
			}
			control.selectedItem.set(config);

			this.event.subscribeObservable(
				control.selectedItem,
				(value) => value !== undefined && this.submitted.Fire(value),
			);
		}
	}

	@injectable
	export class graphics extends ConfigValueControl<GuiObject> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.Graphics["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.Graphics["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Graphics>,
			@inject di: DIContainer,
		) {
			super(templates.multi(), definition.displayName);

			const def = {
				localShadows: {
					displayName: "Local shadows",
					type: "bool",
					config: definition.config.localShadows,
				},
				othersShadows: {
					displayName: "Other's shadows",
					type: "bool",
					config: definition.config.othersShadows,
				},
				othersEffects: {
					displayName: "Other's effects and sounds",
					type: "bool",
					config: definition.config.othersEffects,
				},
			} as const satisfies PlayerConfigTypes.Definitions;
			const _compilecheck: ConfigDefinitionsToConfig<keyof typeof def, typeof def> = config;

			const control = this.parent(new MultiPlayerConfigControl(this.gui.Control, di));
			control.set(config, def);
			this.event.subscribe(control.configUpdated, (key, value) => {
				this.submitted.Fire((config = { ...config, [key]: value }));
			});
		}
	}

	@injectable
	export class visuals extends ConfigValueControl<GuiObject> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.Visuals["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.Visuals["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Visuals>,
			@inject di: DIContainer,
		) {
			super(templates.multi(), definition.displayName);

			const selectionDef = {
				borderColor: {
					displayName: "Border color",
					type: "color",
					config: definition.config.selection.borderColor,
				},
				borderTransparency: {
					displayName: "Border transparency",
					type: "clampedNumber",
					config: definition.config.selection.borderTransparency,
					min: 0,
					max: 1,
					step: 0.01,
				},
				borderThickness: {
					displayName: "Border thickness",
					type: "clampedNumber",
					config: definition.config.selection.borderThickness,
					min: 0.01,
					max: 1,
					step: 0.01,
				},
				surfaceColor: {
					displayName: "Surface color",
					type: "color",
					config: definition.config.selection.surfaceColor,
				},
				surfaceTransparency: {
					displayName: "Surface transparency",
					type: "clampedNumber",
					config: definition.config.selection.surfaceTransparency,
					min: 0,
					max: 1,
					step: 0.01,
				},
			} as const satisfies PlayerConfigTypes.Definitions;
			const _compilecheck1: ConfigDefinitionsToConfig<keyof typeof selectionDef, typeof selectionDef> =
				config.selection;

			const parent = this.parent(new Control(this.gui.Control));

			// single block selection
			{
				const control = templates.multi();
				control.HeadingLabel.Text = "Single block selection";
				control.Parent = parent.instance;

				const selectionControl = parent.add(new MultiPlayerConfigControl(control.Control, di));
				selectionControl.set(config.selection, selectionDef);
				this.event.subscribe(selectionControl.configUpdated, (key, value) => {
					this.submitted.Fire((config = { ...config, selection: { ...config.selection, [key]: value } }));
				});
			}

			// multi block selection
			{
				const control = templates.multi();
				control.HeadingLabel.Text = "Multi block selection";
				control.Parent = parent.instance;

				const selectionControl = parent.add(new MultiPlayerConfigControl(control.Control, di));
				selectionControl.set(config.multiSelection, selectionDef);
				this.event.subscribe(selectionControl.configUpdated, (key, value) => {
					this.submitted.Fire(
						(config = { ...config, multiSelection: { ...config.multiSelection, [key]: value } }),
					);
				});
			}
		}
	}

	export class key extends ConfigValueControl<KeyChooserControlDefinition> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.Key["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.Key["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Key>,
		) {
			super(templates.key(), definition.displayName);

			const control = this.parent(new KeyChooserControl(this.gui.Control));
			control.value.set(config);

			this.event.subscribe(control.submitted, (value) => this.submitted.Fire(value));
		}
	}

	export class _number extends ConfigValueControl<NumberTextBoxControlDefinition> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.Number["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.Number["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Number>,
		) {
			super(templates.number(), definition.displayName);

			const control = this.parent(new NumberTextBoxControl(this.gui.Control));
			control.value.set(config);

			this.event.subscribe(control.submitted, (value) => this.submitted.Fire(value));
		}
	}

	@injectable
	export class terrain extends ConfigValueControl<GuiObject> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.Terrain["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.Terrain["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Terrain>,
			@inject di: DIContainer,
		) {
			super(templates.multi(), definition.displayName);

			const items: { readonly [k in typeof config.kind]: true } = {
				Flat: true,
				Classic: true,
				Triangle: true,
				Water: true,
				Lava: true,
			};
			const def = {
				kind: {
					displayName: "Type",
					type: "dropdown",
					config: definition.config.kind,
					items: Objects.keys(items),
				},
				resolution: {
					displayName: "Resolution",
					type: "clampedNumber",
					config: definition.config.resolution,
					min: 1,
					max: 16,
					step: 1,
				},
				foliage: {
					displayName: "Foliage",
					type: "bool",
					config: definition.config.foliage,
				},
				loadDistance: {
					displayName: "Load distance",
					type: "clampedNumber",
					config: definition.config.loadDistance,
					min: 1,
					max: 96,
					step: 1,
				},
				water: {
					displayName: "Enable water",
					type: "bool",
					config: definition.config.water,
				},
				snowOnly: {
					displayName: "Snow only",
					type: "bool",
					config: definition.config.snowOnly,
				},
				triangleAddSandBelowSeaLevel: {
					displayName: "Add sand below sea level",
					type: "bool",
					config: definition.config.triangleAddSandBelowSeaLevel,
				},
			} as const satisfies PlayerConfigTypes.Definitions;
			const _compilecheck: ConfigDefinitionsToConfig<keyof typeof def, typeof def> = config;

			const control = this.parent(new MultiPlayerConfigControl<typeof def>(this.gui.Control, di));
			control.set(config, def);
			this.event.subscribe(control.configUpdated, (key, value) => {
				this.submitted.Fire((config = { ...config, [key]: value }));
			});

			const resolutionControl = control.get("resolution");
			const foliageControl = control.get("foliage");
			const kindControl = control.get("kind") as dropdown<typeof config.kind>;
			const waterControl = control.get("water");
			const snowOnly = control.get("snowOnly");
			const triangleAddSandBelowSeaLevel = control.get("triangleAddSandBelowSeaLevel");

			const setImprovedControlsEnabled = (kind: string & typeof config.kind) => {
				resolutionControl.setVisibleAndEnabled(kind === "Triangle");
				triangleAddSandBelowSeaLevel.setVisibleAndEnabled(kind === "Triangle");
				waterControl.setVisibleAndEnabled(kind === "Triangle");
				foliageControl.setVisibleAndEnabled(kind === "Classic");
				snowOnly.setVisibleAndEnabled(kind !== "Water" && kind !== "Lava");
			};
			this.event.subscribe(kindControl.submitted, setImprovedControlsEnabled);
			setImprovedControlsEnabled(config.kind);
		}
	}

	@injectable
	export class tutorial extends ConfigValueControl<GuiObject> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.Tutorial["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.Tutorial["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Tutorial>,
			@inject tutorials: TutorialsService,
		) {
			super(templates.multi(), definition.displayName);

			const list = this.parent(new Control(this.gui.Control));
			for (const tutorial of tutorials.allTutorials) {
				list.add(
					new TextButtonControl(
						Interface.getGameUI<{ Templates: { Button: TextButtonDefinition } }>().Templates.Button.Clone(),
						() => tutorials.run(tutorial),
					).with((b) => b.text.set(`Tutorial: ${tutorial.name}`)),
				);
			}
		}
	}

	@injectable
	export class ragdoll extends ConfigValueControl<GuiObject> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.Ragdoll["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.Ragdoll["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Ragdoll>,
			@inject di: DIContainer,
		) {
			super(templates.multi(), definition.displayName);

			const def = {
				autoFall: {
					displayName: "Automatic triggering",
					type: "bool",
					config: definition.config.autoFall,
				},
				triggerByKey: {
					displayName: "Trigger on keypress",
					type: "bool",
					config: definition.config.triggerByKey,
				},
				triggerKey: {
					displayName: "Trigger key",
					type: "key",
					config: definition.config.triggerKey,
				},
				autoRecovery: {
					displayName: "Automatic recovery",
					type: "bool",
					config: definition.config.autoRecovery,
				},
			} as const satisfies PlayerConfigTypes.Definitions;
			const _compilecheck: ConfigDefinitionsToConfig<keyof typeof def, typeof def> = config;

			const control = this.parent(new MultiPlayerConfigControl<typeof def>(this.gui.Control, di));
			control.set(config, def);
			this.event.subscribe(control.configUpdated, (key, value) => {
				this.submitted.Fire((config = { ...config, [key]: value }));
			});

			const byKeyControl = control.get("triggerByKey");
			const keyControl = control.get("triggerKey");

			const setImprovedControlsEnabled = (byKey: boolean) => keyControl.setVisibleAndEnabled(byKey);
			this.event.subscribe(byKeyControl.submitted, setImprovedControlsEnabled);
			setImprovedControlsEnabled(config.triggerByKey);
		}
	}

	@injectable
	export class physics extends ConfigValueControl<GuiObject> {
		readonly submitted = new Signal<(config: PlayerConfigTypes.Physics["config"]) => void>();

		constructor(
			config: PlayerConfigTypes.Physics["config"],
			definition: ConfigTypeToDefinition<PlayerConfigTypes.Physics>,
			@inject di: DIContainer,
		) {
			super(templates.multi(), definition.displayName);

			const def = {
				simplified_aerodynamics: {
					displayName: "Simplified aerodynamics",
					type: "bool",
					config: definition.config.simplified_aerodynamics,
				},
				advanced_aerodynamics: {
					displayName: "Advanced aerodynamics",
					type: "bool",
					config: definition.config.advanced_aerodynamics,
				},
			} as const satisfies PlayerConfigTypes.Definitions;
			const _compilecheck: ConfigDefinitionsToConfig<keyof typeof def, typeof def> = config;

			const control = this.parent(new MultiPlayerConfigControl<typeof def>(this.gui.Control, di));
			control.set(config, def);
			this.event.subscribe(control.configUpdated, (key, value) => {
				this.submitted.Fire((config = { ...config, [key]: value }));
				updateVisibility();
			});

			const legacyWings = control.get("simplified_aerodynamics");
			const fluidForcesEverything = control.get("advanced_aerodynamics");

			const updateVisibility = () => {
				fluidForcesEverything.setVisibleAndEnabled(!config.simplified_aerodynamics);
				legacyWings.setVisibleAndEnabled(!config.advanced_aerodynamics);
			};
			updateVisibility();
		}
	}
}
const Controls = {
	...ControlsSource,
	number: ControlsSource._number,
} as const satisfies {
	readonly [k in keyof PlayerConfigTypes.Types]: new (
		config: PlayerConfigTypes.Types[k]["config"],
		definition: ConfigTypeToDefinition<PlayerConfigTypes.Types[k]>,
		...rest: never
	) => ConfigControl<k>;
};

interface ConfigControl<TKey extends keyof PlayerConfigTypes.Types> extends Control<GuiObject> {
	readonly submitted: ReadonlyArgsSignal<[config: PlayerConfigTypes.Types[TKey]["config"]]>;
}

type ConfigControlDefinition = GuiObject;
@injectable
export class MultiPlayerConfigControl<
	TDef extends PlayerConfigTypes.Definitions,
> extends Control<ConfigControlDefinition> {
	readonly configUpdated = new Signal<
		(key: keyof TDef, value: PlayerConfigTypes.Types[TDef[keyof TDef]["type"]]["config"]) => void
	>();

	private settedElements = new Map<keyof TDef, ConfigControl<keyof PlayerConfigTypes.Types>>();
	private readonly children;

	constructor(
		gui: ConfigControlDefinition,
		@inject private readonly di: DIContainer,
	) {
		super(gui);
		this.children = this.parent(new ComponentChildren().withParentInstance(gui));
	}

	get<TKey extends keyof TDef>(key: TKey): ConfigControl<TDef[TKey]["type"]> {
		return this.settedElements.get(key)!;
	}
	set(config: ConfigDefinitionsToConfig<keyof TDef, TDef>, definition: TDef) {
		this.children.clear();
		this.settedElements.clear();

		for (const [id, def] of Objects.entriesArray(definition).sort(
			(left, right) => tostring(left[0]) < tostring(right[0]),
		)) {
			const control = this.di.resolveForeignClass(
				Controls[def.type] as typeof Controls.bool,
				[config[id], def] as never,
			);
			this.children.add(control);
			this.settedElements.set(id, control);

			control.submitted.Connect((value) => this.configUpdated.Fire(id as string, value as never));
		}
	}
}

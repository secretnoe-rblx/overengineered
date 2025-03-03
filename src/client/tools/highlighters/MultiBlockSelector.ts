import { BlockSelectorModeGui } from "client/tools/highlighters/BlockSelectorModeGui";
import { BoxSelector } from "client/tools/highlighters/BoxSelector";
import { HoveredBlocksSelector } from "client/tools/highlighters/HoveredBlocksSelector";
import { HoldAction } from "engine/client/HoldAction";
import { Keybinds } from "engine/client/Keybinds";
import { Component } from "engine/shared/component/Component";
import { ComponentChild } from "engine/shared/component/ComponentChild";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { ArgsSignal } from "engine/shared/event/Signal";
import type { HoveredBlocksSelectorMode } from "client/tools/highlighters/HoveredBlocksSelector";
import type { ReadonlyObservableValue } from "engine/shared/event/ObservableValue";
import type { ReadonlyArgsSignal } from "engine/shared/event/Signal";
import type { SharedPlot } from "shared/building/SharedPlot";

export interface BlockSelector extends Component {
	readonly submit: ReadonlyArgsSignal<[blocks: readonly BlockModel[]]>;
}

const selectionKeybinds = {
	assembly: Keybinds.registerDefinition("selection_assembly", ["Assembly selection"], [["LeftControl"]]),
	machine: Keybinds.registerDefinition("selection_machine", ["Machine selection"], [["LeftAlt"]]),
	box: Keybinds.registerDefinition("selection_box", ["Box selection"], [["E"]]),
} as const;

export type BlockSelectorMode = HoveredBlocksSelectorMode | "box";
export type MultiBlockSelectorConfiguration = {
	readonly enabled?: readonly BlockSelectorMode[];
	readonly filter?: (blocks: readonly BlockModel[]) => readonly BlockModel[];
};
@injectable
export class MultiBlockSelector extends Component {
	private readonly _submit = new ArgsSignal<[blocks: readonly BlockModel[]]>();
	readonly submit = this._submit.asReadonly();
	readonly mode = new ObservableValue<BlockSelectorMode>("single");

	constructor(
		plot: ReadonlyObservableValue<SharedPlot>,
		config: MultiBlockSelectorConfiguration | undefined,
		@inject keybinds: Keybinds,
	) {
		super();

		this.onDisable(() => this.mode.set("single"));

		for (const [mode, keybindsDef] of pairs(selectionKeybinds)) {
			if (config?.enabled?.includes(mode) === false) continue;

			const action = this.parent(new HoldAction());
			action.initKeybind(keybinds.fromDefinition(keybindsDef), { sink: false });
			action.subscribe((enabled) => {
				if (enabled) {
					this.mode.set(mode);
				} else {
					if (this.mode.get() === mode) {
						this.mode.set("single");
					}
				}
			});
		}

		const origModeFuncs = HoveredBlocksSelector.Modes;
		const filter = (blocks: readonly BlockModel[]): readonly BlockModel[] => {
			blocks = blocks.filter(plot.get().hasBlock.bind(plot.get()));
			blocks = config?.filter?.(blocks) ?? blocks;

			return blocks;
		};
		const functions: Readonly<
			Record<
				HoveredBlocksSelectorMode,
				(block: BlockModel, highlighted: ReadonlySet<BlockModel>) => readonly BlockModel[]
			>
		> = {
			single: !filter ? origModeFuncs.single : (block, highlighted) => filter([block, ...highlighted]),
			assembly: !filter
				? origModeFuncs.assembly
				: (block, highlighted) => filter([...origModeFuncs.assembly(block), ...highlighted]),
			machine: !filter
				? origModeFuncs.machine
				: (block, highlighted) => filter([...origModeFuncs.machine(block), ...highlighted]),
		};

		const modes: Readonly<Record<BlockSelectorMode, () => BlockSelector>> = {
			single: () => new HoveredBlocksSelector(functions.single),
			assembly: () => new HoveredBlocksSelector(functions.assembly),
			machine: () => new HoveredBlocksSelector(functions.machine),
			box: () => new BoxSelector(plot.get(), filter),
		};
		const selector = this.parent(ComponentChild.fromObservable(this.mode, (mode) => modes[mode]()));
		selector.childSet.Connect((child) => child?.submit.Connect((blocks) => this._submit.Fire(blocks)));

		this.parent(new BlockSelectorModeGui(this.mode));
	}
}

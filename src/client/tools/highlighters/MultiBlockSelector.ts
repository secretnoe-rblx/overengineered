import { UserInputService } from "@rbxts/services";
import { BoxSelector } from "client/tools/highlighters/BoxSelector";
import { HoveredBlocksSelector } from "client/tools/highlighters/HoveredBlocksSelector";
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

export type BlockSelectorMode = HoveredBlocksSelectorMode | "box";
export type MultiBlockSelectorConfiguration = {
	readonly enabled?: readonly BlockSelectorMode[];
	readonly filter?: (blocks: readonly BlockModel[]) => readonly BlockModel[];
};
export class MultiBlockSelector extends Component {
	private readonly _submit = new ArgsSignal<[blocks: readonly BlockModel[]]>();
	readonly submit = this._submit.asReadonly();
	readonly mode = new ObservableValue<BlockSelectorMode>("single");

	constructor(plot: ReadonlyObservableValue<SharedPlot>, config?: MultiBlockSelectorConfiguration) {
		super();

		const buttons: Readonly<Record<BlockSelectorMode, KeyCode | undefined>> = {
			single: undefined,
			assembly: config?.enabled?.includes("assembly") === false ? undefined : "LeftControl",
			machine: config?.enabled?.includes("machine") === false ? undefined : "LeftAlt",
			box: config?.enabled?.includes("box") === false ? undefined : "E",
		};
		this.event.subInput((ih) => {
			for (const [bmode, button] of pairs(buttons)) {
				ih.onKeyDown(button, () => this.mode.set(bmode));
				ih.onKeyUp(button, () => {
					if (this.mode.get() === bmode) {
						this.mode.set("single");
					}
				});
			}
		});

		const setBasedOnCurrentInput = () => {
			for (const [bmode, button] of pairs(buttons)) {
				if (!UserInputService.IsKeyDown(button)) continue;

				this.mode.set(bmode);
				return;
			}

			this.mode.set("single");
		};
		this.onEnable(setBasedOnCurrentInput);

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

		const selectorParent = this.parent(new ComponentChild<BlockSelector>());
		selectorParent.childSet.Connect((child) => {
			if (child) {
				child.submit.Connect((blocks) => this._submit.Fire(blocks));
				return;
			}

			if (!this.isEnabled()) return;

			setBasedOnCurrentInput();
			if (!selectorParent.get()) {
				selectorParent.set(modes[this.mode.get()]());
			}
		});

		const updateSelector = () => selectorParent.set(modes[this.mode.get()]());
		this.event.subscribeObservable(this.mode, updateSelector);
		this.event.subscribeObservable(plot, updateSelector);
		this.onEnable(updateSelector);
	}
}

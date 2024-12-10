import { BlockSelect } from "client/tools/highlighters/BlockSelect";
import { BlockSelectorModeGui } from "client/tools/highlighters/BlockSelectorModeGui";
import { MultiBlockSelector as MBS } from "client/tools/highlighters/MultiBlockSelector";
import { InputController } from "engine/client/InputController";
import { Component } from "engine/shared/component/Component";
import type { BlockSelectorModeGuiDefinition } from "client/tools/highlighters/BlockSelectorModeGui";
import type { MultiBlockSelectorConfiguration } from "client/tools/highlighters/MultiBlockSelector";
import type { Keybinds } from "engine/client/Keybinds";
import type { ObservableCollectionSet } from "engine/shared/event/ObservableCollection";
import type { ReadonlyObservableValue } from "engine/shared/event/ObservableValue";
import type { SharedPlot } from "shared/building/SharedPlot";

@injectable
export class MultiBlockHighlightedSelector extends Component {
	readonly selected: ObservableCollectionSet<BlockModel>;
	private readonly plot: ReadonlyObservableValue<SharedPlot>;

	constructor(
		plot: ReadonlyObservableValue<SharedPlot>,
		selected: ObservableCollectionSet<BlockModel>,
		gui: BlockSelectorModeGuiDefinition | undefined,
		config: MultiBlockSelectorConfiguration | undefined,
		@inject keybinds: Keybinds,
	) {
		super();
		this.plot = plot;
		this.selected = selected;

		const fireSelected = (blocks: readonly BlockModel[]) => {
			if (!blocks || blocks.size() === 0) return;
			BlockSelect.selectBlocksByClick(this.selected, blocks, InputController.isShiftPressed());
		};
		const mbs = this.parent(new MBS(plot, config, keybinds));
		mbs.submit.Connect(fireSelected);

		if (gui) {
			this.parentGui(new BlockSelectorModeGui(gui, mbs.mode));
		}

		this.onDestroy(() => this.selected.clear());
	}

	selectPlot() {
		this.selected.add(...this.plot.get().getBlocks());
	}
	deselectAll() {
		this.selected.clear();
	}
}

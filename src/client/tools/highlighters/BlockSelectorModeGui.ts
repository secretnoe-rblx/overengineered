import { Component } from "engine/shared/component/Component";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";
import type { Theme } from "client/Theme";
import type { BlockSelectorMode } from "client/tools/highlighters/MultiBlockSelector";
import type { TextButtonDefinition } from "engine/client/gui/Button";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

export type BlockSelectorModeGuiDefinition = GuiObject & {
	readonly SingleSelection: TextButtonDefinition;
	readonly AssemblySelection: TextButtonDefinition;
	readonly MachineSelection: TextButtonDefinition;
};
export class BlockSelectorModeGui extends Component {
	constructor(mode: ObservableValue<BlockSelectorMode>) {
		super();

		this.$onInjectAuto((mainScreen: MainScreenLayout, theme: Theme) => {
			const create = (key: BlockSelectorMode) => {
				const button = this.parentGui(mainScreen.right.push(key.upper() + " SELECTION")) //
					.addButtonAction(() => mode.set(key));

				button
					.valuesComponent()
					.get("BackgroundColor3")
					.addChildOverlay(
						this.event.addObservable(
							mode.fReadonlyCreateBased((mode) =>
								theme.get(mode === key ? "buttonActive" : "buttonNormal"),
							),
						),
					)
					.addBasicTransform();
			};

			create("single");
			create("assembly");
			create("machine");
		});
	}
}

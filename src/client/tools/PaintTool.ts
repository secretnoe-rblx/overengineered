import { MaterialColorEditControl } from "client/gui/buildmode/MaterialColorEditControl";
import { Interface } from "client/gui/Interface";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { MultiBlockSelector } from "client/tools/highlighters/MultiBlockSelector";
import { ToolBase } from "client/tools/ToolBase";
import { LocalPlayer } from "engine/client/LocalPlayer";
import { Component } from "engine/shared/component/Component";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { BlockManager } from "shared/building/BlockManager";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { Keybinds } from "engine/client/Keybinds";

namespace Scene {
	@injectable
	export class PaintToolScene extends Component {
		readonly tool;

		constructor(@inject tool: PaintTool, @inject mainScreen: MainScreenLayout) {
			super();
			this.tool = tool;

			const enable = () => {
				// to not paint a block
				task.wait();

				this.tool.controller.enable();
			};
			const disable = () => {
				this.tool.controller.disable();
			};

			const paintLayer = this.parentGui(mainScreen.bottom.push());
			paintLayer
				.addButton("Paint Materials", undefined, undefined, { width: 150 }) //
				.addButtonAction(() => this.paintEverything(true, false));
			paintLayer
				.addButton("Paint Colors", undefined, undefined, { width: 150 }) //
				.addButtonAction(() => this.paintEverything(false, true));

			const layer = this.parentGui(mainScreen.bottom.push());
			const materialColorEditor = layer.parent(MaterialColorEditControl.autoCreate(true));
			materialColorEditor.autoSubscribe(tool.selectedMaterial, tool.selectedColor);

			materialColorEditor.materialPipette.onStart.Connect(disable);
			materialColorEditor.materialPipette.onEnd.Connect(enable);
			materialColorEditor.colorPipette.onStart.Connect(disable);
			materialColorEditor.colorPipette.onEnd.Connect(enable);

			// const materialEnabler = this.parent(new ToggleControl(this.instance.Bottom.Material.Header.EnabledToggle));
			// materialEnabler.value.set(tool.enableMaterial.get());
			// this.event.subscribeObservable(materialEnabler.value, (value) => tool.enableMaterial.set(value));
			// const colorEnabler = this.parent(new ToggleControl(this.instance.Bottom.Color.Header.EnabledToggle));
			// colorEnabler.value.set(tool.enableColor.get());
			// this.event.subscribeObservable(colorEnabler.value, (value) => tool.enableColor.set(value));
		}

		private paintEverything(enableColor?: boolean, enableMaterial?: boolean) {
			this.tool.paintEverything(enableColor, enableMaterial);
		}
	}
}

class Controller extends Component {
	constructor(tool: PaintTool, keybinds: Keybinds) {
		super();

		const fireSelected = (blocks: readonly BlockModel[]) => {
			if (!blocks || blocks.size() === 0) return;

			tool.paint(blocks);
		};
		const stuff = this.parent(new MultiBlockSelector(tool.mode.targetPlot, undefined, keybinds));
		stuff.submit.Connect(fireSelected);

		this.event.subInput((ih) => {
			const pick = () => {};
			if (Interface.isCursorOnVisibleGui()) return;

			// eslint-disable-next-line prefer-const
			let [material, color] = this.pick();
			if (!material || !color) return;

			tool.selectedMaterial.set(material);

			tool.selectedColor.set(color);
			ih.onMouse3Down(pick, false);
			ih.onKeyDown("P", pick);
		});
	}

	private pick() {
		const target = LocalPlayer.mouse.Target;
		if (!target) return $tuple();

		const block = BlockManager.getBlockDataByPart(target);
		if (!block) return $tuple();

		return $tuple(block.material, block.color);
	}
}

@injectable
export class PaintTool extends ToolBase {
	readonly selectedMaterial = new ObservableValue<Enum.Material>(Enum.Material.Plastic);
	readonly selectedColor = new ObservableValue<Color3>(Color3.fromRGB(255, 255, 255));
	readonly enableMaterial = new ObservableValue(true);
	readonly enableColor = new ObservableValue(true);
	readonly controller;

	constructor(@inject mode: BuildingMode, @inject keybinds: Keybinds, @inject di: DIContainer) {
		super(mode);

		this.parent(di.resolveForeignClass(Scene.PaintToolScene));
		this.controller = this.parent(new Controller(this, keybinds));
	}

	paintEverything(enableColor?: boolean, enableMaterial?: boolean) {
		return ClientBuilding.paintOperation.execute({
			plot: this.targetPlot.get(),
			blocks: "all",
			material: (enableMaterial ?? this.enableMaterial.get()) ? this.selectedMaterial.get() : undefined,
			color: (enableColor ?? this.enableColor.get()) ? this.selectedColor.get() : undefined,
		});
	}
	paint(
		blocks: readonly BlockModel[],
		original?: ReadonlyMap<BlockModel, { readonly material: Enum.Material; readonly color: Color3 }>,
	) {
		return ClientBuilding.paintOperation.execute({
			plot: this.targetPlot.get(),
			blocks,
			material: this.enableMaterial.get() ? this.selectedMaterial.get() : undefined,
			color: this.enableColor.get() ? this.selectedColor.get() : undefined,
			original,
		});
	}

	getDisplayName(): string {
		return "Painting";
	}
	getImageID(): string {
		return "http://www.roblox.com/asset/?id=15895846447";
	}
}

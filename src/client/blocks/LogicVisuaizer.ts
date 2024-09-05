import { Workspace } from "@rbxts/services";
import { Component } from "shared/component/Component";
import { ComponentInstance } from "shared/component/ComponentInstance";
import { Instances } from "shared/fixes/Instances";
import type { BlockLogicTickContext, GenericBlockLogic } from "shared/blockLogic/BlockLogic";
import type { BlockLogicRunner } from "shared/blockLogic/BlockLogicRunner";

export class LogicVisualizer extends Component {
	constructor(runner: BlockLogicRunner, blocks: readonly GenericBlockLogic[]) {
		super();

		const parent = new Instance("Folder", Workspace);
		parent.Name = "LogicVisualizer";
		ComponentInstance.init(this, parent);

		type label = BillboardGui & { readonly Label: TextLabel };
		const labelMap = new Map<GenericBlockLogic, label>();

		const labelTemplate = this.asTemplate(
			Instances.assets.WaitForChild("Wires").WaitForChild("MarkerValue") as label,
			false,
		);

		const setLabelsEnabled = (enabled: boolean) => {
			for (const [, label] of labelMap) {
				label.Enabled = enabled;
			}
		};
		this.onEnable(() => setLabelsEnabled(true));
		this.onEnable(() => setLabelsEnabled(false));

		const tick = (ctx: BlockLogicTickContext) => {
			for (const block of blocks) {
				const label = labelMap.getOrSet(block, () => {
					const label = labelTemplate();
					label.AlwaysOnTop = true;
					label.Name = block.instance!.Name;
					label.Adornee = block.instance!;
					label.Parent = parent;

					return label;
				});

				const info = block.getDebugInfo(ctx);
				label.Label.Text = info.join("\n");
			}
		};
		this.event.subscribeRegistration(() => runner.onAfterTick(tick));
	}
}

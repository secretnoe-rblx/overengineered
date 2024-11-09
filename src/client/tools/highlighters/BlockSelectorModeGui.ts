import { TextButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { Transforms } from "engine/shared/component/Transforms";
import { TransformService } from "engine/shared/component/TransformService";
import { Colors } from "shared/Colors";
import type { HoveredBlocksSelectorMode } from "client/tools/highlighters/HoveredBlocksSelector";
import type { BlockSelectorMode } from "client/tools/highlighters/MultiBlockSelector";
import type { TextButtonDefinition } from "engine/client/gui/Button";

export type BlockSelectorModeGuiDefinition = GuiObject & {
	readonly SingleSelection: TextButtonDefinition;
	readonly AssemblySelection: TextButtonDefinition;
	readonly MachineSelection: TextButtonDefinition;
};
export class BlockSelectorModeGui extends Control {
	constructor(gui: BlockSelectorModeGuiDefinition, mode: ObservableValue<BlockSelectorMode>) {
		super(gui);

		class MobileSelection extends Control<BlockSelectorModeGuiDefinition> {
			constructor(gui: BlockSelectorModeGuiDefinition) {
				super(gui);

				const single = this.add(new TextButtonControl(gui.SingleSelection, () => mode.set("single")));
				const assembly = this.add(new TextButtonControl(gui.AssemblySelection, () => mode.set("assembly")));
				const machine = this.add(new TextButtonControl(gui.MachineSelection, () => mode.set("machine")));
				const buttons: { readonly [k in HoveredBlocksSelectorMode]: TextButtonControl } = {
					single,
					assembly,
					machine,
				};

				this.event.subscribeObservable(
					mode,
					(active) => {
						for (const [name, button] of pairs(buttons)) {
							TransformService.run(button.instance, (builder, instance) =>
								builder
									.func(() => (instance.AutoButtonColor = instance.Active = active !== name))
									.transform(
										instance,
										"BackgroundColor3",
										active === name ? Colors.accentDark : Colors.staticBackground,
										animationProps,
									),
							);
						}
					},
					true,
				);

				const animate = (enable: boolean) => {
					const buttonsAreActive = enable;

					TransformService.run(gui, (builder, instance) =>
						builder.transform(
							instance,
							"AnchorPoint",
							new Vector2(buttonsAreActive ? 1 : 0, 0.5),
							animationProps,
						),
					);

					for (const [, control] of pairs(buttons)) {
						const button = control.instance;

						button.AutoButtonColor = button.Active = buttonsAreActive;
						TransformService.run(button, (builder, instance) =>
							builder.transform(instance, "Transparency", buttonsAreActive ? 0 : 0.6, animationProps),
						);
					}
				};

				this.onEnable(() => animate(true));
				this.onDisable(() => animate(false));
			}
		}

		const animationProps = Transforms.commonProps.quadOut02;

		const control = this.add(new MobileSelection(gui));
		this.onPrepare((inputType) =>
			control.setVisible(inputType === "Touch" || inputType === "Gamepad" || (true as boolean)),
		);
	}
}

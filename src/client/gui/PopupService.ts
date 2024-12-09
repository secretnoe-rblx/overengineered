import { Lighting } from "@rbxts/services";
import { AutoUIScaledComponent } from "client/gui/AutoUIScaledControl";
import { Colors } from "engine/shared/Colors";
import { ComponentChildren } from "engine/shared/component/ComponentChildren";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { Transforms } from "engine/shared/component/Transforms";
import { HostedService } from "engine/shared/di/HostedService";
import { Element } from "engine/shared/Element";
import type { Interfacec } from "client/gui/Interface";
import type { Control } from "engine/client/gui/Control";

@injectable
export class PopupService extends HostedService {
	readonly isShown: ReadonlyObservableValue<boolean>;
	private readonly children;
	private readonly screen: ScreenGui;

	constructor(@inject gui: Interfacec) {
		super();
		this.screen = gui.getPopupUI();

		this.children = this.parent(new ComponentChildren<InstanceComponent<ScreenGui>>()) //
			.withParentInstance(this.screen);
		this.isShown = this.children.children.createBased((c) => c.size() !== 0);

		const blur = Lighting.WaitForChild("Blur") as BlurEffect;
		this.event.subscribeObservable(this.isShown, (visible) => {
			const size = visible ? 12 : 0;

			Transforms.create() //
				.transform(blur, "Size", size, Transforms.quadOut02)
				.run(blur, true);
		});
	}

	showPopup(control: Control): void {
		const parentScreen = new InstanceComponent(
			Element.create(
				"ScreenGui",
				{ Name: `popup_${control.instance.Name}`, Parent: this.screen, IgnoreGuiInset: true },
				{
					bg: Element.create("Frame", {
						Active: true,
						Size: new UDim2(1, 0, 1, 0),
						BackgroundColor3: Colors.black,
						BackgroundTransparency: 0.5,
					}),
					popup: control.instance,
				},
			),
		);
		this.children.add(parentScreen);
		parentScreen.getComponent(AutoUIScaledComponent);

		control.onDestroy(() => parentScreen.destroy());
	}
}

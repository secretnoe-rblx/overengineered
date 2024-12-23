import { Lighting } from "@rbxts/services";
import { AutoUIScaledComponent } from "engine/client/gui/AutoUIScaledControl";
import { Interface } from "client/gui/Interface";
import { LocalPlayer } from "engine/client/LocalPlayer";
import { Colors } from "engine/shared/Colors";
import { ComponentChildren } from "engine/shared/component/ComponentChildren";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { Transforms } from "engine/shared/component/Transforms";
import { HostedService } from "engine/shared/di/HostedService";
import { Element } from "engine/shared/Element";
import type { ReadonlyObservableValue } from "engine/shared/event/ObservableValue";

@injectable
export class PopupController extends HostedService {
	readonly isShown: ReadonlyObservableValue<boolean>;
	private readonly children;
	private readonly screen: ScreenGui;

	constructor(@inject private readonly di: DIContainer) {
		super();
		this.screen = Interface.getPopupUI();

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

		const controls = LocalPlayer.getPlayerModule().GetControls();
		this.event.subscribeObservable(
			this.isShown,
			(shown) => {
				if (shown) controls.Disable();
				else controls.Enable();
			},
			true,
		);
	}

	createAndShow<TArgs extends unknown[]>(
		clazz: ConstructorOf<InstanceComponent<GuiObject>, TArgs>,
		...args: Partial<TArgs>
	): void {
		this.showPopup(this.di.resolveForeignClass(clazz, args));
	}

	showPopup(control: InstanceComponent<GuiObject>): void {
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
						ZIndex: -9999,
					}),
					popup: control.instance,
				},
			),
		);
		parentScreen.parentGui(control);
		this.children.add(parentScreen);
		parentScreen.getComponent(AutoUIScaledComponent);

		control.onDestroy(() => parentScreen.destroy());
	}
}

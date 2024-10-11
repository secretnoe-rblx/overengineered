import { Lighting, TweenService } from "@rbxts/services";
import { Interface } from "client/gui/Interface";
import { ScaledScreenGui } from "client/gui/ScaledScreenGui";
import { Control } from "engine/client/gui/Control";
import { Element } from "engine/shared/Element";
import { Signal } from "engine/shared/event/Signal";
import { Colors } from "shared/Colors";

export class Popup<T extends GuiObject = GuiObject> extends Control<T> {
	static readonly onAnyShow = new Signal<() => void>();
	static readonly onAnyHide = new Signal<() => void>();
	static readonly onAllHide = new Signal<() => void>();
	private static readonly popupsScreenGui = Interface.getPopupUI();
	private static readonly blur = Lighting.WaitForChild("Blur") as BlurEffect;

	static {
		Popup.onAnyShow.Connect(() => Popup.tweenBlur(12));
		Popup.onAllHide.Connect(() => Popup.tweenBlur(0));
	}

	protected readonly parentScreen: ScaledScreenGui<ScreenGui>;
	constructor(gui: T) {
		super(gui);

		this.parentScreen = new ScaledScreenGui(
			Element.create(
				"ScreenGui",
				{ Name: `popup_${gui.Name}`, Parent: Popup.popupsScreenGui, IgnoreGuiInset: true },
				{
					bg: Element.create("Frame", {
						Active: true,
						Size: new UDim2(1, 0, 1, 0),
						BackgroundColor3: Colors.black,
						BackgroundTransparency: 0.5,
					}),
					popup: this.instance,
				},
			),
		);
	}

	private static tweenBlur(size: number) {
		TweenService.Create(Popup.blur, new TweenInfo(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
			Size: size,
		}).Play();
	}

	show() {
		super.show();
		this.parentScreen.enable();
		Popup.onAnyShow.Fire();
	}
	hide() {
		super.hide();
		this.parentScreen.instance.Destroy();
		Popup.onAnyHide.Fire();

		// 1 for UIScale
		if (Popup.popupsScreenGui.GetChildren().size() === 1) {
			Popup.onAllHide.Fire();
		}
	}
}

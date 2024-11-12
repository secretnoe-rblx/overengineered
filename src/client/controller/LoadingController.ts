import { Workspace } from "@rbxts/services";
import { Interface } from "client/gui/Interface";
import { Control } from "engine/client/gui/Control";
import { Transforms } from "engine/shared/component/Transforms";
import { TransformService } from "engine/shared/component/TransformService";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import type { TransformProps } from "engine/shared/component/Transform";

class LoadingImage extends Control {
	runShowAnimation() {
		const startanim = () => {
			if (!this.isEnabled()) return;

			Transforms.create()
				.transform(this.instance, "Rotation", this.instance.Rotation + 90, {
					duration: 0.8,
					style: "Quad",
					direction: "InOut",
				})
				.then()
				.func(startanim)
				.run(this.instance);
		};

		TransformService.cancel(this.instance);
		Transforms.create()
			.then()
			.transform(this.instance, "Rotation", () => this.instance.Rotation + 270, {
				duration: 0.3,
				style: "Quad",
				direction: "Out",
			})
			.then()
			.func(startanim)
			.run(this.instance);
	}
	runHideAnimation() {
		this.disable();

		TransformService.cancel(this.instance);
		Transforms.create()
			.transform(this.instance, "Rotation", () => this.instance.Rotation - 270, {
				duration: 0.3,
				style: "Quad",
				direction: "In",
			})
			.run(this.instance);
	}
}

type LoadingPopupDefinition = GuiObject & {
	readonly LoadingImage: GuiObject;
	readonly TextLabel: TextLabel;
};
class LoadingPopup extends Control<LoadingPopupDefinition> {
	private readonly loadingImage;

	constructor(gui: LoadingPopupDefinition) {
		super(gui);
		this.loadingImage = this.parent(new LoadingImage(gui.LoadingImage));
	}

	show(): void {
		if (this.isEnabled()) {
			return;
		}

		super.show();
		TransformService.cancel(this.instance);

		this.loadingImage.runShowAnimation();
		const params: TransformProps = {
			duration: 0.3,
			style: "Quad",
			direction: "Out",
		};
		Transforms.create() //
			.moveY(this.instance, new UDim(0, 80), params)
			.run(this.instance);
	}
	hide(): void {
		const params: TransformProps = {
			duration: 0.4,
			style: "Quad",
			direction: "In",
		};

		task.wait(0.5);

		this.loadingImage.runHideAnimation();
		TransformService.cancel(this.instance);
		Transforms.create()
			.moveY(this.instance, new UDim(0, -200), params)
			.then()
			.func(() => super.hide())
			.run(this.instance);
	}

	setText(text: string) {
		this.gui.TextLabel.Text = text;
	}
}

spawn(() => {
	const gui = Workspace.WaitForChild("Obstacles")
		.WaitForChild("Baseplate 2")
		.WaitForChild("Part")
		.WaitForChild("SurfaceGui")
		.WaitForChild("Spinner") as GuiObject;

	const loading = new LoadingImage(gui);
	loading.enable();
	loading.runShowAnimation();

	task.delay(10_000, () => loading.disable());
});

const control = new LoadingPopup(Interface.getGameUI<{ Loading: LoadingPopupDefinition }>().Loading);
control.hide();

const state = new ObservableValue<boolean>(false);
export namespace LoadingController {
	export const isLoading = state.asReadonly();

	export function show(text: string) {
		$log(text);
		control.setText(`${text}...`);
		control.show();
		state.set(true);
	}
	export function hide() {
		control.hide();
		state.set(false);
	}

	export function run<T>(text: string, func: () => T) {
		try {
			LoadingController.show(text);
			return func();
		} finally {
			LoadingController.hide();
		}
	}
	export async function runAsync<T>(text: string, func: () => T | Promise<T>) {
		try {
			LoadingController.show(text);
			return await func();
		} finally {
			LoadingController.hide();
		}
	}
}

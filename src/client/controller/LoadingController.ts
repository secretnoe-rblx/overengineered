import { Workspace } from "@rbxts/services";
import { Interface } from "client/gui/Interface";
import { Control } from "engine/client/gui/Control";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { Transforms } from "engine/shared/component/Transforms";
import { ObservableValue } from "engine/shared/event/ObservableValue";

class LoadingImage extends Control {
	constructor(gui: GuiObject) {
		super(gui);

		this.onEnable(() => {
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
					.run(this.instance, true);
			};

			Transforms.create()
				.then()
				.transform(this.instance, "Rotation", () => this.instance.Rotation + 270, {
					duration: 0.3,
					style: "Quad",
					direction: "Out",
				})
				.then()
				.func(startanim)
				.run(this.instance, true);
		});

		this.onDisable(() => {
			Transforms.create()
				.transform(this.instance, "Rotation", () => this.instance.Rotation - 270, {
					duration: 0.3,
					style: "Quad",
					direction: "In",
				})
				.run(this.instance, true);
		});
	}
}

type LoadingPopupDefinition = GuiObject & {
	readonly LoadingImage: GuiObject;
	readonly TextLabel: TextLabel;
};
class LoadingPopup extends InstanceComponent<LoadingPopupDefinition> {
	constructor(gui: LoadingPopupDefinition) {
		super(gui);

		this.parent(new LoadingImage(gui.LoadingImage));

		this.onEnable(() => {
			Transforms.create() //
				.show(this.instance)
				.moveY(this.instance, new UDim(0, 80), { duration: 0.3, style: "Quad", direction: "Out" })
				.run(this.instance, true);
		});
		this.onDisable(() => {
			Transforms.create()
				.moveY(this.instance, new UDim(0, -200), { duration: 0.4, style: "Quad", direction: "In" })
				.then()
				.hide(this.instance)
				.run(this.instance, true);
		});

		this.instance.Visible = false;
	}

	setText(text: string) {
		this.instance.TextLabel.Text = text;
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

	task.delay(60, () => loading.disable());
});

const control = new LoadingPopup(Interface.getGameUI<{ Loading: LoadingPopupDefinition }>().Loading);

const state = new ObservableValue<boolean>(false);
export namespace LoadingController {
	export const isLoading = state.asReadonly();

	export function show(text: string) {
		$log(text);
		control.setText(`${text}...`);
		control.enable();
		state.set(true);
	}
	export function hide() {
		control.disable();
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

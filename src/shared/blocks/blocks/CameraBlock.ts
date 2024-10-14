import { RunService, Workspace } from "@rbxts/services";
import { Component } from "engine/shared/component/Component";
import { Element } from "engine/shared/Element";
import { Objects } from "engine/shared/fixes/Objects";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		enabled: {
			displayName: "Enabled",
			types: {
				bool: {
					config: false,
					control: {
						config: {
							enabled: true,
							key: "F",
							reversed: false,
							switch: true,
						},
						canBeReversed: true,
						canBeSwitch: true,
					},
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

const defaultCamera = Workspace.CurrentCamera;
if (RunService.IsClient() && defaultCamera) {
	// Upon setting the Workspace.CurrentCamera, all cameras that are children of Workspace get deleted, so we create a nested folder for the camera
	defaultCamera.Parent = Element.create("Folder", { Name: "Camera", Parent: Workspace });
}

const enabledCameras = new Set<Logic>();

export type { Logic as CameraBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		if (!RunService.IsClient()) return;

		const target = this.instance.WaitForChild("Target") as BasePart;
		const camera = Element.create("Camera", {
			CFrame: target.CFrame,
			CameraSubject: target,
			CameraType: Enum.CameraType.Scriptable,
			Parent: this.instance,
		});

		const ticker = new Component();
		ticker.event.subscribe(RunService.RenderStepped, () => {
			camera.CFrame = target.CFrame;
		});
		this.onDisable(() => ticker.disable());
		this.onDescendantDestroyed(() => ticker.destroy());

		this.event
			.observableFromInstanceParam(Workspace, "CurrentCamera")
			.subscribe((wcamera) => ticker.setEnabled(wcamera === camera));

		this.on(({ enabled }) => {
			if (enabled) {
				enabledCameras.add(this);
				Workspace.CurrentCamera = camera;
			} else {
				enabledCameras.delete(this);
				Workspace.CurrentCamera =
					(Objects.firstKey(enabledCameras)?.instance.FindFirstChild("Camera") as Camera | undefined) ??
					defaultCamera;
			}
		});

		this.onDisable(() => {
			enabledCameras.delete(this);
			Workspace.CurrentCamera = defaultCamera;
		});
	}
}

export const CameraBlock = {
	...BlockCreation.defaults,
	id: "camera",
	displayName: "Camera",
	description: "Does camera things",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;

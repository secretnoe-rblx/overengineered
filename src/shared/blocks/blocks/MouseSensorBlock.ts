import { UserInputService, Workspace } from "@rbxts/services";
import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	outputOrder: ["position", "angle", "direction", "angle3d"],
	input: {},
	output: {
		position: {
			displayName: "Position",
			unit: "Vector2 0-1",
			types: ["vector3"],
		},
		angle: {
			displayName: "Angle around the center",
			unit: "Degrees",
			types: ["number"],
		},
		direction: {
			displayName: "3D Direction",
			unit: "Vector3 unit",
			types: ["vector3"],
		},
		angle3d: {
			displayName: "3D Angle of direction",
			unit: "Radians",
			types: ["vector3"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as MouseSensorBlockLogic };
class Logic extends BlockLogic<typeof definition> {
	constructor(block: BlockLogicArgs) {
		super(definition, block);

		this.onRecalcInputs(() => {
			const mousePos = UserInputService.GetMouseLocation();
			const relaPos = mousePos.div(Workspace.CurrentCamera!.ViewportSize);

			this.output.position.set("vector3", new Vector3(relaPos.X, relaPos.Y, 0));
			this.output.angle.set("number", math.deg(math.atan2(-(relaPos.Y - 0.5), relaPos.X - 0.5)));

			const camera = Workspace.CurrentCamera;
			if (camera) {
				const ray = camera.ViewportPointToRay(mousePos.X, mousePos.Y);
				const [x, y, z] = CFrame.lookAt(Vector3.zero, ray.Direction).ToOrientation();

				this.output.direction.set("vector3", ray.Direction);
				this.output.angle3d.set("vector3", new Vector3(x, y, z));
			}
		});
	}
}

export const MouseSensorBlock = {
	...BlockCreation.defaults,
	id: "mousesensor",
	displayName: "Mouse Sensor",
	description: "Returns the cursor position, relative to the screen",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;

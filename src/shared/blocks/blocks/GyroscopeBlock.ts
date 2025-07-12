import { Players, RunService, Workspace } from "@rbxts/services";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["targetAngle", "gyroMode", "torque", "responsiveness"],
	input: {
		targetAngle: {
			displayName: "Target Angle",
			tooltip: "The angle it's going to follow (in degrees)",
			types: {
				vector3: {
					config: Vector3.zero,
				},
			},
		},
		gyroMode: {
			displayName: "Mode",
			types: {
				enum: {
					config: "followCamera",
					elementOrder: ["localAngle", "followAngle", "followCamera", "followCursor"],
					elements: {
						localAngle: { displayName: "Local Angle", tooltip: "Make the block follow the global angle" },
						followAngle: { displayName: "Follow Angle", tooltip: "Make the block follow the global angle" },
						followCamera: { displayName: "Follow Camera", tooltip: "Follow player's camera angle" },
						followCursor: { displayName: "Follow Cursor", tooltip: "Follow player's cursor" },
					},
				},
			},
			connectorHidden: true,
		},
		torque: {
			displayName: "Torque",
			tooltip: "The amount of rotational force applied to the gyroscope",
			types: {
				number: {
					config: 10000,
					clamp: {
						min: 0,
						max: 1_000_000,
						showAsSlider: true,
					},
				},
			},
		},
		responsiveness: {
			displayName: "Responsiveness",
			tooltip: "How fast it will adjust to a target angle",
			types: {
				number: {
					config: 10,
					clamp: {
						min: 0,
						max: 100,
						showAsSlider: true,
					},
				},
			},
		},
		enabled: {
			displayName: "Enable",
			types: {
				bool: {
					config: true,
				},
			},
		},
	},

	output: {},
} as const satisfies BlockLogicFullBothDefinitions;

type GyroBlockModel = BlockModel & {
	Base: BasePart & {
		AlignOrientation: AlignOrientation;
		Attachment: Attachment;
		ringZ: BasePart;
		ringY: BasePart;
		ringX: BasePart;
	};
};

export type { Logic as GyroscopeBlockLogic };

@injectable
class Logic extends InstanceBlockLogic<typeof definition, GyroBlockModel> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const targetAngle = this.initializeInputCache("targetAngle");
		const enabled = this.initializeInputCache("enabled");
		const gMode = this.initializeInputCache("gyroMode");

		const base = this.instance.Base;
		const attachment = base.Attachment;
		const Xring = base.ringX;
		const Yring = base.ringY;
		const Zring = base.ringZ;

		const baseCFrame = base.CFrame;
		const player = Players.LocalPlayer;

		base.AlignOrientation.CFrame = baseCFrame;

		const getTargetAngle = (): Vector3 => {
			const mode = gMode.get();

			if (mode === "followAngle") {
				const tg = targetAngle.get().apply((v) => math.rad(v));
				const cf = (base.AlignOrientation.CFrame = CFrame.fromOrientation(tg.X, tg.Y, tg.Z));
				base.AlignOrientation.CFrame = cf;
				return targetAngle.get();
			}

			if (mode === "followCamera") {
				const res = Workspace.CurrentCamera!.CFrame.mul(CFrame.fromOrientation(0, math.pi / 2, 0));
				base.AlignOrientation.CFrame = res;
				return new Vector3(...res.ToEulerAnglesXYZ()).apply((v) => math.deg(v));
			}

			if (mode === "followCursor") {
				const mouse = player.GetMouse();
				const dir = Workspace.CurrentCamera!.ScreenPointToRay(mouse.X, mouse.Y).Direction;
				const pos = attachment.Position;
				const res = CFrame.lookAt(pos, pos.add(dir)).mul(CFrame.fromOrientation(0, math.pi / 2, 0));
				base.AlignOrientation.CFrame = res;
				return new Vector3(...res.ToEulerAnglesXYZ()).apply((v) => math.deg(v));
			}

			return Vector3.zero;
		};

		this.event.subscribe(RunService.Heartbeat, () => {
			if (!enabled.get()) return;
			const ta = targetAngle.get();
			if (gMode.get() !== "localAngle") {
				const resAngle = getTargetAngle();
				Xring.Rotation = new Vector3(0, 0, resAngle.Z);
				Yring.Rotation = new Vector3(0, resAngle.Y, resAngle.Z);
				Zring.Rotation = new Vector3(resAngle.X, resAngle.Y, resAngle.Z);
				[Xring.Position, Yring.Position, Zring.Position] = [base.Position, base.Position, base.Position];
				return;
			}

			const bcf = base.CFrame;
			const res = bcf.RightVector.mul(ta.X).add(bcf.UpVector.mul(ta.Y)).add(bcf.LookVector.mul(ta.Z));
			base.ApplyAngularImpulse(res);
		});

		this.on(({ responsiveness, torque, gyroMode, enabled }) => {
			// constraint parameters
			base.AlignOrientation.Enabled = enabled;
			base.AlignOrientation.Enabled = gyroMode !== "localAngle";
			base.AlignOrientation.Responsiveness = responsiveness;
			base.AlignOrientation.MaxTorque = torque;
		});
	}
}

export const GyroscopeBlock = {
	...BlockCreation.defaults,
	id: "gyroscope",
	displayName: "Gyroscope",
	description: "Makes your things rotate to desired angle. Has different modes.",
	limit: 20,
	devOnly: true,

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;

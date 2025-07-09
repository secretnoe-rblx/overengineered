import { RunService } from "@rbxts/services";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["targetAngle", "relativeAngle", "torque", "responsiveness"],
	input: {
		// gyroMode: {
		// 	displayName: "Mode",
		// 	types: {
		// 		enum: {
		// 			config: "followTarget",
		// 			elementOrder: ["followTarget", "angleAsSpin"],
		// 			elements: {
		// 				followTarget: {
		// 					displayName: "Follow target angle",
		// 				},
		// 				angleAsSpin: {
		// 					displayName: "Target angle as spin",
		// 				},
		// 			},
		// 		},
		// 	},
		// 	connectorHidden: true,
		// },
		targetAngle: {
			displayName: "Target Angle",
			tooltip: "The angle it's going to follow (in degrees)",
			types: {
				vector3: {
					config: Vector3.zero,
				},
			},
		},
		relativeAngle: {
			displayName: "Relative Angle",
			tooltip: "Make Target Angle relative to the gyroscope",
			types: {
				bool: {
					config: false,
				},
			},
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
		const isAngleRelative = this.initializeInputCache("relativeAngle");
		const rsp = this.initializeInputCache("responsiveness");

		const base = this.instance.Base;
		const Xring = base.ringX;
		const Yring = base.ringY;
		const Zring = base.ringZ;

		const baseAngle = base.Rotation;

		this.event.subscribe(RunService.Heartbeat, () => {
			const ta = targetAngle.get();
			if (!isAngleRelative.get()) {
				const resAngle = ta.sub(baseAngle).apply((v) => math.fmod(v, 360));
				Xring.Rotation = new Vector3(0, 0, resAngle.Z);
				Yring.Rotation = new Vector3(0, resAngle.Y, resAngle.Z);
				Zring.Rotation = new Vector3(resAngle.X, resAngle.Y, resAngle.Z);
				return;
			}

			const bcf = base.CFrame;
			const res = bcf.RightVector.mul(ta.X).add(bcf.UpVector.mul(ta.Y)).add(bcf.LookVector.mul(ta.Z));
			base.ApplyAngularImpulse(res);
		});

		this.on(({ responsiveness, targetAngle, torque, relativeAngle }) => {
			// constraint parameters
			base.AlignOrientation.Enabled = !relativeAngle;
			base.AlignOrientation.Responsiveness = responsiveness;
			base.AlignOrientation.MaxTorque = torque;

			// attachment parameters
			base.Attachment.Orientation = targetAngle.sub(baseAngle);
		});
	}
}

export const GyroscopeBlock = {
	...BlockCreation.defaults,
	id: "gyroscope",
	displayName: "Gyroscope",
	description: "N/A",
	limit: 20,

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;

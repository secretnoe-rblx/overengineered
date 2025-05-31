import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { BlockManager } from "shared/building/BlockManager";
import { RemoteEvents } from "shared/RemoteEvents";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		rotationSpeed: {
			displayName: "Angular Speed",
			unit: "Radians/second",
			types: {
				number: {
					config: 0,
					clamp: {
						showAsSlider: false,
						min: -150,
						max: 150,
					},
					control: {
						config: {
							enabled: true,
							startValue: 0,
							mode: {
								type: "instant",
								instant: {
									mode: "onRelease",
								},
								smooth: {
									speed: 60,
									mode: "stopOnRelease",
								},
							},
							keys: [
								{ key: "R", value: 15 },
								{ key: "F", value: -15 },
							],
						},
					},
				},
			},
		},
		max_torque: {
			displayName: "Max Torque",
			tooltip: "The maximum torque that Motor can apply when trying to reach its desired Angular Speed",
			unit: "RMU stud²/s²",
			types: {
				number: {
					config: 200,
					clamp: {
						max: 600,
						min: 0,
						showAsSlider: true,
					},
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type MotorBlock = BlockModel & {
	readonly Base: Part & {
		readonly HingeConstraint: HingeConstraint;
	};
	readonly Attach: Part;
};

export type { Logic as MotorBlockLogic };
export class Logic extends InstanceBlockLogic<typeof definition, MotorBlock> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const blockScale = BlockManager.manager.scale.get(this.instance) ?? Vector3.one;
		const scale = blockScale.X * blockScale.Y * blockScale.Z;
		this.on((ctx) => {
			if (!this.instance.FindFirstChild("Base")?.FindFirstChild("HingeConstraint")) {
				this.disableAndBurn();
				return;
			}

			this.instance.Base.HingeConstraint.AngularVelocity = ctx.rotationSpeed;
			this.instance.Base.HingeConstraint.MotorMaxTorque = ctx.max_torque * 1_000_000 * scale;
		});

		this.onTicc(() => {
			const base = this.instance.FindFirstChild("Base") as BasePart | undefined;
			const attach = this.instance.FindFirstChild("Attach") as BasePart | undefined;
			if (!attach || !base) {
				this.disableAndBurn();
				return;
			}

			if (attach.Position.sub(base.Position).Magnitude > 3 * blockScale.Y) {
				RemoteEvents.ImpactBreak.send([base]);

				this.disable();
			}
		});
		this.onDisable(() => {
			if (this.instance.FindFirstChild("Base")?.FindFirstChild("HingeConstraint")) {
				this.instance.Base.HingeConstraint.AngularVelocity = 0;
			}
		});
	}
}

export const MotorBlock = {
	...BlockCreation.defaults,
	id: "motorblock",
	displayName: "Motor",
	description: "Rotates attached blocks. For unpowered rotation, use the Hinge block.",
	limit: 100,

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;

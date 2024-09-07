import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { RemoteEvents } from "shared/RemoteEvents";
import { RobloxUnit } from "shared/RobloxUnit";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		rotationSpeed: {
			displayName: "Angular Speed",
			unit: "radians/second",
			types: {
				number: {
					config: 0,
					control: {
						min: -150,
						max: 150,
						simplified: "motorRotationSpeed",
						config: {
							enabled: true,
							extended: false,
							startValue: 0,
							mode: {
								type: "hold",
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

		this.on((ctx) => {
			if (!this.instance.FindFirstChild("Base")) {
				this.disableAndBurn();
				return;
			}

			this.instance.Base.HingeConstraint.AngularVelocity = ctx.rotationSpeed;
			this.instance.Base.HingeConstraint.MotorMaxTorque = RobloxUnit.RowtonStuds_To_NewtonMeters(
				ctx.max_torque * 1_000_000,
			);
		});

		this.onTicc(() => {
			const base = this.instance.FindFirstChild("Base") as BasePart | undefined;
			const attach = this.instance.FindFirstChild("Attach") as BasePart | undefined;
			if (!attach || !base) {
				this.disableAndBurn();
				return;
			}

			if (attach.Position.sub(base.Position).Magnitude > 3) {
				RemoteEvents.ImpactBreak.send([base]);

				this.disable();
			}
		});
		this.onDescendantDestroyed(() => {
			if (this.instance.FindFirstChild("Base")) {
				this.instance.Base.HingeConstraint.AngularVelocity = 0;
			}

			this.disable();
		});
	}
}

export const MotorBlock = {
	...BlockCreation.defaults,
	id: "motorblock",
	displayName: "Motor",
	description: "Rotates attached blocks",
	limit: 100,

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;

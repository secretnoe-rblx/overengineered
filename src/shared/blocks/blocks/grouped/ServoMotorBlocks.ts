import { InstanceBlockLogic as InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { BlockManager } from "shared/building/BlockManager";
import { RemoteEvents } from "shared/RemoteEvents";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuildersWithoutIdAndDefaults } from "shared/blocks/Block";

const servoDefinition = {
	input: {
		speed: {
			displayName: "Angular Speed",
			unit: "radians/second",
			types: {
				number: {
					config: 15,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 50,
						step: 0.01,
					},
				},
			},
		},
		angle: {
			displayName: "Target Angle",
			unit: "Degrees",
			types: {
				number: {
					config: 0,
					clamp: {
						showAsSlider: false,
						min: -180,
						max: 180,
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
									speed: 72,
									mode: "stopOnRelease",
								},
							},
							keys: [
								{ key: "R", value: 45 },
								{ key: "F", value: -45 },
							],
						},
					},
				},
			},
		},
		stiffness: {
			displayName: "Responsiveness",
			tooltip: "Specifies the sharpness of the servo motor in reaching the Target Angle",
			types: {
				number: {
					config: 45,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 100,
						step: 0.01,
					},
				},
			},
			connectorHidden: true,
		},
		max_torque: {
			displayName: "Max Torque",
			types: {
				number: {
					config: 200,
					clamp: {
						showAsSlider: true,
						max: 600,
						min: 0,
						step: 0.1,
					},
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;
const sidewaysServoDefinition = {
	...servoDefinition,
	input: {
		...servoDefinition.input,
		angle: {
			...servoDefinition.input.angle,
			types: {
				...servoDefinition.input.angle.types,
				number: {
					...servoDefinition.input.angle.types.number,
					clamp: {
						...servoDefinition.input.angle.types.number.clamp,
						min: -90,
						max: 90,
					},
				},
			},
		},
	},
} as const satisfies BlockLogicFullBothDefinitions;

type ServoMotorModel = BlockModel & {
	readonly Base: Part & {
		readonly HingeConstraint: HingeConstraint;
	};
	readonly Attach: Part;
};

export type { Logic as ServoMotorLogic };
class Logic extends InstanceBlockLogic<typeof servoDefinition, ServoMotorModel> {
	private readonly hingeConstraint;

	constructor(definition: typeof servoDefinition, block: InstanceBlockLogicArgs) {
		super(definition, block);

		const blockScale = BlockManager.manager.scale.get(this.instance) ?? Vector3.one;
		const scale = blockScale.X * blockScale.Y * blockScale.Z;

		this.hingeConstraint = this.instance.Base.HingeConstraint;
		this.instance.GetDescendants().forEach((desc) => {
			if (!desc.IsA("BasePart")) return;

			const materialPhysProp = new PhysicalProperties(desc.Material);
			const newPhysProp = new PhysicalProperties(materialPhysProp.Density, materialPhysProp.Friction, 0);
			desc.CustomPhysicalProperties = newPhysProp;
		});

		this.onk(["stiffness"], ({ stiffness }) => (this.hingeConstraint.AngularResponsiveness = stiffness));
		this.onk(["speed"], ({ speed }) => (this.hingeConstraint.AngularSpeed = speed));
		this.onk(["angle"], ({ angle }) => (this.hingeConstraint.TargetAngle = angle));
		this.onk(["max_torque"], ({ max_torque }) => max_torque * 1_000_000 * scale);

		this.onTicc(() => {
			const base = this.instance.FindFirstChild("Base") as BasePart | undefined;
			const attach = this.instance.FindFirstChild("Attach") as BasePart | undefined;
			if (!attach || !base) {
				this.disable();
				return;
			}

			if (attach.Position.sub(base.Position).Magnitude > 3 * blockScale.Y) {
				RemoteEvents.ImpactBreak.send([base]);
				this.disable();
			}
		});
	}
}

const list: BlockBuildersWithoutIdAndDefaults = {
	servomotorblock: {
		displayName: "Servo",
		description: "Turns to the configured angle",
		limit: 100,
		logic: {
			definition: servoDefinition,
			ctor: class extends Logic {
				constructor(block: InstanceBlockLogicArgs) {
					super(servoDefinition, block);
				}
			},
		},
	},
	sidewaysservo: {
		displayName: "Sideways servo",
		description: "Servo but sideways and with some degree of freedom",
		limit: 100,
		logic: {
			definition: sidewaysServoDefinition,
			ctor: class extends Logic {
				constructor(block: InstanceBlockLogicArgs) {
					super(sidewaysServoDefinition, block);
				}
			},
		},
	},
};
export const ServoMotorBlocks = BlockCreation.arrayFromObject(list);

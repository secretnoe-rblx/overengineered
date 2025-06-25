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
			unit: "radians/second",
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
		clutch_release: {
			displayName: "Clutch release",
			types: {
				bool: {
					config: false,
					control: {
						config: {
							enabled: false,
							key: "Y",
							switch: false,
							reversed: false,
						},
						canBeSwitch: true,
						canBeReversed: true,
					},
				},
			},
		},
		max_torque: {
			displayName: "Max Torque",
			tooltip:
				"The maximum torque that Motor can apply when trying to reach its desired Angular Speed. Does not affect the operation of CFrame version.",
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
		cframe: {
			displayName: "CFrame-powered",
			tooltip: "May break something, use with caution.",
			types: {
				bool: {
					config: false,
				},
			},
			connectorHidden: true,
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type MotorBlock = BlockModel & {
	readonly Base: Part & {
		readonly HingeConstraint: HingeConstraint;
		readonly Weld: Weld;
	};
	readonly Attach: Part;
};

export type { Logic as MotorBlockLogic };
export class Logic extends InstanceBlockLogic<typeof definition, MotorBlock> {
	private readonly hingeConstraint;
	private readonly rotationWeld;
	private currentRotation = 0;

	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.hingeConstraint = this.instance.Base.HingeConstraint;
		this.rotationWeld = this.instance.Base.Weld;

		const blockScale = BlockManager.manager.scale.get(this.instance) ?? Vector3.one;
		const scale = blockScale.X * blockScale.Y * blockScale.Z;

		this.onk(["rotationSpeed"], ({ rotationSpeed }) => {
			if (this.rotationWeld.Enabled) {
				// Clean up existing connection
				this.event.eventHandler.unsubscribeAll();

				// Only create connection if rotation speed is not zero
				if (rotationSpeed !== 0) {
					const RunService = game.GetService("RunService");
					this.event.eventHandler.subscribe(RunService.Heartbeat, (deltaTime) => {
						this.currentRotation += rotationSpeed * deltaTime;
						this.rotationWeld.C0 = new CFrame().mul(CFrame.Angles(this.currentRotation, 0, 0));
					});
				}
			} else {
				this.hingeConstraint.AngularVelocity = rotationSpeed;
			}
		});

		this.onk(["max_torque"], ({ max_torque }) => {
			if (this.rotationWeld.Enabled) {
				return;
			}

			this.hingeConstraint.MotorMaxTorque = max_torque * 1_000_000 * math.max(1, scale);
		});

		this.onk(["cframe"], ({ cframe }) => {
			this.rotationWeld.Enabled = cframe;
			this.hingeConstraint.Enabled = !cframe;

			// Security check to prevent issues
			if (!cframe) {
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
			}
		});

		this.onk(["clutch_release"], ({ clutch_release }) => {
			if (this.rotationWeld.Enabled && clutch_release) {
				this.disableAndBurn();
			}

			this.hingeConstraint.ActuatorType = Enum.ActuatorType[clutch_release ? "None" : "Motor"];
		});

		this.onDisable(() => {
			if (this.instance.FindFirstChild("Base")?.FindFirstChild("HingeConstraint")) {
				this.hingeConstraint.AngularVelocity = 0;
			}
			this.event.eventHandler.unsubscribeAll();
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

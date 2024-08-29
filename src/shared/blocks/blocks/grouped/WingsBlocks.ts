import { RunService, Workspace } from "@rbxts/services";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { GameEnvironment } from "shared/data/GameEnvironment";
import { ObservableValue } from "shared/event/ObservableValue";
import { Switches } from "shared/Switches";
import type { PlacedBlockConfig } from "shared/blockLogic/BlockConfig";
import type {
	BlockLogicFullBothDefinitions,
	GenericBlockLogic,
	InstanceBlockLogicArgs,
} from "shared/blockLogic/BlockLogic";
import type { BlockBuildersWithoutIdAndDefaults, BlockLogicInfo } from "shared/blocks/Block";

const definition = {
	input: {
		enabled: {
			displayName: "Enabled",
			tooltip: "Disables aerodynamic properties if you are a fan of using this block for other purposes",
			types: {
				bool: {
					config: true,
				},
			},
			connectorHidden: true,
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type WingBlock = BlockModel & {
	readonly WingSurface:
		| BasePart
		| (UnionOperation & {
				readonly VectorForce: VectorForce;
		  });
};

const fluidForcesEnabled = new ObservableValue(RunService.IsStudio());
Switches.register("Fluid forces enabled", fluidForcesEnabled);

export type { Logic as WingsBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition, WingBlock> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		// Enable fluidforces for roblox engineers
		if (fluidForcesEnabled.get()) {
			this.instance.WingSurface.EnableFluidForces = true;
			return;
		}

		this.onkStart(["enabled"], ({ enabled }) => {
			if (!enabled) {
				this.disable();
				return;
			}

			// Create force constraints
			const attachment = new Instance("Attachment", this.instance.WingSurface);
			const vectorForce = new Instance("VectorForce", this.instance.WingSurface);
			vectorForce.RelativeTo = Enum.ActuatorRelativeTo.Attachment0;
			vectorForce.Attachment0 = attachment;

			// Set up wing material properties
			const density = math.max(0.7, new PhysicalProperties(this.instance.WingSurface.Material).Density / 2);
			this.instance.WingSurface.CustomPhysicalProperties = new PhysicalProperties(density, 0.3, 0.5, 1, 1);

			const surface = this.findWingSurface(this.instance.WingSurface);
			this.event.subscribe(RunService.Heartbeat, () => {
				const force = surface
					.mul(
						this.instance.WingSurface.CFrame.PointToObjectSpace(
							this.instance.WingSurface.Position.add(this.instance.WingSurface.Velocity),
						).mul(-21),
					)
					.add(vectorForce.Force)
					.div(2)
					.mul(
						math.clamp(
							1 -
								math.pow(
									(this.instance.WingSurface.Position.Y - GameDefinitions.HEIGHT_OFFSET) /
										GameEnvironment.ZeroAirHeight,
									2,
								),
							0,
							1,
						),
					);
				vectorForce.Enabled = force.Magnitude > Workspace.Gravity * this.instance.WingSurface.Mass;
				vectorForce.Force = force;
			});
		});
	}

	initializeInputs(config: PlacedBlockConfig, allBlocks: ReadonlyMap<BlockUuid, GenericBlockLogic>): void {
		super.initializeInputs(config, allBlocks);
	}

	private findWingSurface(wingSurface: BasePart) {
		const Z = wingSurface.Size.X * wingSurface.Size.Z;
		const X = Z * 0.05;
		return wingSurface.IsA("WedgePart") ? new Vector3(Z, X, X).mul(0.5) : new Vector3(X, Z, X);
	}
}

const logic: BlockLogicInfo = { definition, ctor: Logic };
const list = {
	wing1x1: {
		displayName: "Wing 1x1",
		description: "A part with advanced aerodynamic properties",
		logic,
		mirror: {
			behaviour: "wedgeWing",
		},
	},
	wing1x2: {
		displayName: "Wing 1x2",
		description: "A part with advanced aerodynamic properties but a bit longer",
		logic,
		mirror: {
			behaviour: "wedgeWing",
		},
	},
	wing1x3: {
		displayName: "Wing 1x3",
		description: "A part with advanced aerodynamic properties but two bits longer",
		logic,
		mirror: {
			behaviour: "wedgeWing",
		},
	},
	wing1x4: {
		displayName: "Wing 1x4",
		description: "A part with advanced aerodynamic properties but the joke is overused",
		logic,
		mirror: {
			behaviour: "wedgeWing",
		},
	},
	wedgewing1x1: {
		displayName: "Wedge Wing 1x1",
		description: "A wedge shaped wing",
		logic,
		mirror: {
			behaviour: "wedgeWing",
		},
	},
	wedgewing1x2: {
		displayName: "Wedge Wing 1x2",
		description: "A wedge shaped wing but longer",
		logic,
		mirror: {
			behaviour: "wedgeWing",
		},
	},
	wedgewing1x3: {
		displayName: "Wedge Wing 1x3",
		description: "A wedge shaped wing but much longer",
		logic,
		mirror: {
			behaviour: "wedgeWing",
		},
	},
	wedgewing1x4: {
		displayName: "Wedge Wing 1x4",
		description: "A humongously long wedge shaped wing",
		logic,
		mirror: {
			behaviour: "wedgeWing",
		},
	},
} satisfies BlockBuildersWithoutIdAndDefaults;
export const WingBlocks = BlockCreation.arrayFromObject(list);

export type WingBlockIds = keyof typeof list;

import { RunService } from "@rbxts/services";
import { InstanceBlockLogic as InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["maxDistance", "detectionSize", "visibility", "relativePositioning", "minimalDistance"],
	input: {
		maxDistance: {
			displayName: "Max Distance",
			unit: "Studs",
			types: {
				number: {
					config: 100,
					clamp: {
						showAsSlider: true,
						min: 1,
						max: 2048,
					},
				},
			},
		},
		detectionSize: {
			displayName: "Detection Area Size",
			types: {
				number: {
					config: 1,
					clamp: {
						showAsSlider: true,
						min: 1,
						max: 5,
					},
				},
			},
		},
		visibility: {
			displayName: "Detection Area Visibility",
			types: {
				bool: {
					config: false,
				},
			},
		},
		relativePositioning: {
			displayName: "Object-Relative Output",
			types: {
				bool: {
					config: true,
				},
			},
		},
		minimalDistance: {
			displayName: "Minimal Detection Distance",
			types: {
				number: {
					config: 0,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 2048,
					},
				},
			},
		},
	},
	output: {
		distance: {
			displayName: "Offset",
			types: ["vector3"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as RadarSectionBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		let updateTask: thread;
		let minDistance = 0;
		const originalView = this.instance.FindFirstChild("RadarView");
		const view = originalView?.Clone();
		originalView?.Destroy();
		const metalPlate = this.instance.FindFirstChild("MetalPlate");
		const maxDist = definition.input.maxDistance.types.number.clamp.max;
		const halvedMaxDist = maxDist / 2;

		if (!view?.IsA("BasePart")) return;
		if (!metalPlate?.IsA("BasePart")) return;

		view.Parent = this.instance;

		const updateDistance = (detectionSize: number, maxDistance: number) => {
			const ds = detectionSize * (detectionSize - math.sqrt(halvedMaxDist / (maxDistance + halvedMaxDist))) * 10;
			view.Size = new Vector3(ds, view.Size.Y, ds);
			view.PivotOffset = new CFrame(0, -view.Size.Y / 2 - 0.4, 0);
			this.triggerDistanceListUpdate = true;
		};

		this.onk(["visibility"], ({ visibility }) => (view.Transparency = visibility ? 0.8 : 1));
		this.onk(["relativePositioning"], ({ relativePositioning }) => (this.isRelativePosition = relativePositioning));
		this.onk(["detectionSize", "maxDistance"], ({ detectionSize, maxDistance }) => {
			const pivo = metalPlate.GetPivot();
			view.Position = pivo.PointToWorldSpace(Vector3.xAxis.mul(maxDistance / 2 + 0.5));
			view.Size = new Vector3(view.Size.X, maxDistance, view.Size.Z);

			updateDistance(detectionSize, maxDistance);
		});

		this.onAlwaysInputs(({ minimalDistance }) => (minDistance = minimalDistance));

		this.event.subscribe(view.Touched, (part) => {
			if (part.HasTag("RADARVIEW")) return;
			if (!minDistance) return;
			//if (this.getDistanceTo(part).Magnitude < minDistance) return;

			this.allTouchedBlocks.add(part);
			//if (this.closestDetectedPart === undefined) {
			//	return (this.closestDetectedPart = part);
			//}

			this.triggerDistanceListUpdate = true;
		});

		this.event.subscribe(view.TouchEnded, (part) => {
			this.allTouchedBlocks.delete(part);
			if (this.triggerDistanceListUpdate) return;
			this.triggerDistanceListUpdate = part === this.closestDetectedPart;
		});

		this.event.subscribe(RunService.Heartbeat, () => {
			if (this.closestDetectedPart?.Parent === undefined || this.triggerDistanceListUpdate) {
				this.triggerDistanceListUpdate = false;

				this.closestDetectedPart = this.findClosestPart(minDistance);

				if (updateTask) task.cancel(updateTask);
				updateTask = task.delay(5, () => (this.triggerDistanceListUpdate = true));
			}
			this.output.distance.set(
				"vector3",
				this.closestDetectedPart ? this.getDistanceTo(this.closestDetectedPart) : Vector3.zero,
			);

			/*
				this.closestDetectedPart = this.findClosestPart(minDistance);

				if (this.closestDetectedPart) {
					const d = this.getDistanceTo(this.closestDetectedPart);
					this.output.distance.set("vector3", d);
				} else this.output.distance.set("vector3", Vector3.zero);
			*/

			view.AssemblyLinearVelocity = Vector3.zero;
			view.AssemblyAngularVelocity = Vector3.zero;
			view.PivotTo(this.instance.PrimaryPart!.CFrame);
		});

		this.onDisable(() => {
			if (view) view.Transparency = 1;
			this.allTouchedBlocks.clear();
		});
	}

	private isRelativePosition = false;
	private triggerDistanceListUpdate: boolean = false;
	private closestDetectedPart: BasePart | undefined = undefined;
	private readonly allTouchedBlocks: Set<BasePart> = new Set<BasePart>();

	private getDistanceTo = (part: BasePart) => {
		if (this.instance === undefined) return Vector3.zero;
		if (part === undefined) return Vector3.zero;
		if (this.isRelativePosition) return this.instance.GetPivot().ToObjectSpace(part.GetPivot()).Position;
		return part.GetPivot().Position.sub(this.instance.GetPivot().Position);
	};

	private findClosestPart(minDist: number) {
		let smallestDistance: Vector3 | undefined;
		let closestPart: BasePart | undefined;

		for (const bp of this.allTouchedBlocks) {
			const d = this.getDistanceTo(bp);

			if (d.Magnitude < minDist) continue;
			if (smallestDistance === undefined) {
				[smallestDistance, closestPart] = [d, bp];
				continue;
			}

			if (d.Magnitude > smallestDistance.Magnitude) continue;
			[smallestDistance, closestPart] = [d, bp];
		}
		return closestPart;
	}
}

export const RadarSectionBlock = {
	...BlockCreation.defaults,
	id: "radarsection",
	displayName: "Radar Section",
	description: "Returns the position of the closest object in its field of view",
	limit: 400,

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;

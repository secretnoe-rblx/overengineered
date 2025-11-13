import { Players, RunService } from "@rbxts/services";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { SharedPlots } from "shared/building/SharedPlots";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { CustomRemotes } from "shared/Remotes";
import { TagUtils } from "shared/utils/TagUtils";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

interface RadarChunks {
	radarChunk: Part;
	c: number;
	moveVector: CFrame;
	isDetected: boolean;
	detectedCords: Vector3;
}

const ownDetectablesSet = new Set<BasePart>();

if (RunService.IsClient()) {
	const p = Players.LocalPlayer;
	CustomRemotes.modes.set.sent.Connect(({ mode }) => {
		if (mode === "ride") {
			const blocks = SharedPlots.instance.getPlotComponentByOwnerID(p.UserId).getBlocks();

			for (const b of blocks) {
				if (!b.PrimaryPart) continue;
				ownDetectablesSet.add(b.PrimaryPart);
			}
			return;
		}

		ownDetectablesSet.clear();
	});
}

const definition = {
	inputOrder: ["chunkStartIndex", "chunkCap", "chunkSpawnRate", "endSize", "visibility", "detectSelf"],
	input: {
		chunkStartIndex: {
			displayName: "Chunk Start Index",
			types: {
				number: {
					config: 1,
					clamp: {
						showAsSlider: true,
						min: 1,
						max: 1024,
					},
				},
			},
		},
		chunkCap: {
			displayName: "chunkCap",
			types: {
				number: {
					config: 60,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 2048,
					},
				},
			},
		},
		chunkSpawnRate: {
			displayName: "chunkSpawnRate",
			types: {
				number: {
					config: 20,
					clamp: {
						showAsSlider: true,
						min: 2,
						max: 24000,
					},
				},
			},
		},
		endSize: {
			displayName: "endSize",
			types: {
				number: {
					config: 2048,
					clamp: {
						showAsSlider: true,
						min: 1,
						max: 2048,
					},
				},
			},
			connectorHidden: true,
		},
		visibility: {
			displayName: "Detection Area Visibility",
			types: {
				bool: {
					config: true,
				},
			},
			connectorHidden: true,
		},
		detectSelf: {
			displayName: "Detect Self",
			types: {
				bool: {
					config: true,
				},
			},
			connectorHidden: true,
		},
	},
	output: {
		gps: {
			displayName: "Offset",
			types: ["vector3"],
		},
		isDetected: {
			displayName: "Is Detected",
			types: ["bool"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as DistantRadarSectionBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		let inputValues = {
			chunkStartIndex: 0,
			chunkCap: 0,
			chunkSpawnRate: 0,
			endSize: 0,
			visibility: false,
			detectSelf: false,
		};
		this.on((data) => (inputValues = data));
		this.output.gps.set("vector3", new Vector3(0, 0, 0));

		const radarChunksList: RadarChunks[] = [];

		const metalBase = this.instance.FindFirstChild("MetalBase") as BasePart;

		const offset = new Vector3(0, -GameDefinitions.HEIGHT_OFFSET, 0);

		let c = 0;
		this.onTicc(() => {
			if (c > inputValues.chunkSpawnRate) {
				// Create a new Part
				const radarChunk = new Instance("Part") as Part;

				// Setting up basic properties
				radarChunk.Name = "RadarChunk";
				radarChunk.Color = new Color3(245 / 255, 205 / 255, 48 / 255);
				radarChunk.Size = new Vector3(100, 1, 1);
				radarChunk.CFrame = metalBase.CFrame;
				radarChunk.Material = Enum.Material.Plastic;
				radarChunk.Reflectance = 0;
				radarChunk.Anchored = true;
				radarChunk.CanTouch = true;
				radarChunk.Massless = true;
				radarChunk.CastShadow = false;
				radarChunk.CanCollide = false;

				radarChunk.Parent = metalBase;

				// move to the starting position
				radarChunk.CFrame = radarChunk.CFrame.mul(new CFrame(inputValues.chunkStartIndex * 100, 0, 0));

				if (inputValues.visibility) {
					radarChunk.Transparency = 0.8;
				} else {
					radarChunk.Transparency = 1;
				}

				const item: RadarChunks = {
					radarChunk: radarChunk,
					c: inputValues.chunkStartIndex,
					moveVector: radarChunk.CFrame,
					isDetected: false,
					detectedCords: new Vector3(0, 0, 0),
				};

				const connection = radarChunk.Touched.Connect((otherPart) => {
					if (otherPart.HasTag(TagUtils.allTags.SPECIAL_RADARVIEW)) return; // ignore special tags
					if (!inputValues.detectSelf && ownDetectablesSet.has(otherPart)) return; // ignore your blocks if this option is set

					// save data
					item.isDetected = true;
					item.detectedCords = otherPart.Position;

					// block the event so as not to detect other blocks without reason
					connection?.Disconnect();
				});

				radarChunksList.push(item);

				c = 0;
			}

			const toRemove = [];
			let detectedCords = new Vector3(0, 0, 0);
			let isDetected = false;
			let i = 0; // iterator
			// we run through the created chunks to move them forward
			for (const item of radarChunksList) {
				// if a chunk exceeds the allowed distance or intersects with a block, then we move it to the array for deletion, so as not to spam chunks endlessly
				if (item.c > inputValues.chunkCap || item.isDetected) {
					if (item.isDetected) {
						detectedCords = item.detectedCords;
						isDetected = item.isDetected;
					}
					toRemove.push(i);
					continue;
				}

				// move the block by 100 units
				item.moveVector = item.moveVector.mul(new CFrame(100, 0, 0));

				item.radarChunk.CFrame = item.moveVector;

				const newSize = (inputValues.endSize * item.c) / inputValues.chunkCap;
				item.radarChunk.Size = new Vector3(100, newSize, newSize);

				item.c++;
				i++;
			}

			for (const item of toRemove) {
				radarChunksList[item].radarChunk.Destroy();

				radarChunksList.remove(item);
			}

			if (isDetected) {
				this.output.gps.set("vector3", offset.add(detectedCords));
			}
			this.output.isDetected.set("bool", isDetected);

			c++;
		});
	}
}

export const DistantRadarSectionBlock = {
	...BlockCreation.defaults,
	id: "distantradar",
	displayName: "Distant Radar",
	description:
		"Will handle chunks that move away from the radar at a certain distance and disappear if an object is detected",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;

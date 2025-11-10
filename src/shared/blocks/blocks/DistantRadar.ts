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

type radarBlock = BlockModel & {
	RadarView: BasePart | UnionOperation | MeshPart;
};

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

const ownDetectablesSet = new Set<BasePart>();

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
				// Создаем новый Part
				const radarChunk = new Instance("Part") as Part;

				// Настраиваем базовые свойства
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
					if (otherPart.HasTag(TagUtils.allTags.SPECIAL_RADARVIEW)) return; // игнорируем спец теги
					if (!inputValues.detectSelf && ownDetectablesSet.has(otherPart)) return; // игнорируем свои блоки если выставлена такая возможность

					// сохраняем данные
					item.isDetected = true;
					item.detectedCords = otherPart.Position;

					// блокируем эвент чтобы не детектить другие блоки просто так
					connection?.Disconnect();
				});

				radarChunksList.push(item);

				c = 0;
			}

			const toRemove = [];
			let detectedCords = new Vector3(0, 0, 0);
			let isDetected = false;
			let i = 0; // итератор
			// пробегаемся по созданным чанкам чтобы переместить их вперёд
			for (const item of radarChunksList) {
				// если чанк привысил допустимое расстояние или пересёкся с блоком, то перемещаем его в массив на удаление, чтобы не спамить чанками бесконечно
				if (item.c > inputValues.chunkCap || item.isDetected) {
					if (item.isDetected) {
						detectedCords = item.detectedCords;
						isDetected = item.isDetected;
					}
					toRemove.push(i);
					continue;
				}

				// перемещаем блок на 100 едениц
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

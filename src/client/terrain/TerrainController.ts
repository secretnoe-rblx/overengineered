import { ChunkLoader } from "client/terrain/ChunkLoader";
import { DefaultChunkGenerator } from "client/terrain/DefaultChunkGenerator";
import { FlatTerrainRenderer } from "client/terrain/FlatTerrainRenderer";
import { TerrainChunkRenderer } from "client/terrain/TerrainChunkRenderer";
import { TriangleChunkRenderer } from "client/terrain/TriangleChunkRenderer";
import { WaterTerrainChunkRenderer } from "client/terrain/WaterTerrainChunkRenderer";
import { ComponentChildren } from "engine/shared/component/ComponentChildren";
import { HostedService } from "engine/shared/di/HostedService";
import type { PlayerDataStorage } from "client/PlayerDataStorage";

@injectable
export class TerrainController extends HostedService {
	constructor(@inject playerData: PlayerDataStorage) {
		super();

		const loaders = new ComponentChildren<ChunkLoader>(this, true);
		const terrain = playerData.config.createBased((c) => c.terrain);

		this.event.subscribeObservable(
			terrain,
			(terrain) => {
				loaders.clear();

				const config = {
					snowOnly: terrain.snowOnly,
					addSandBelowSeaLevel: terrain.triangleAddSandBelowSeaLevel,
					isLava: terrain.kind === "Lava",
				};

				switch (terrain.kind) {
					case "Triangle":
						loaders.add(
							new ChunkLoader(
								TriangleChunkRenderer(DefaultChunkGenerator, terrain.resolution, config),
								terrain.loadDistance,
							),
						);

						if (terrain.water) {
							loaders.add(new ChunkLoader(WaterTerrainChunkRenderer(), terrain.loadDistance * 2));
						}

						break;
					case "Classic":
						loaders.add(
							new ChunkLoader(
								TerrainChunkRenderer(DefaultChunkGenerator, terrain.foliage, config),
								terrain.loadDistance,
							),
						);
						break;
					case "Flat":
					case "Lava":
						loaders.add(
							new ChunkLoader(
								FlatTerrainRenderer(0.5 - 0.01 + (terrain.kind === "Lava" ? -1.5 : 0), 1024, config),
								terrain.loadDistance,
							),
						);
						break;
					case "Water":
						loaders.add(new ChunkLoader(WaterTerrainChunkRenderer(), terrain.loadDistance));
						break;
				}
			},
			true,
		);
	}
}

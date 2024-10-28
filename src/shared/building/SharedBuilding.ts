import { BlockManager } from "shared/building/BlockManager";
import { MaterialData } from "shared/data/MaterialData";
import { PartUtils } from "shared/utils/PartUtils";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";

/** Methods for editing the building */
export namespace SharedBuilding {
	export function getBlocksConnectedByLogicToMulti(
		blocks: readonly PlacedBlockData[],
		uuids: ReadonlySet<BlockUuid>,
	) {
		const result = new Map<
			BlockUuid,
			(readonly [PlacedBlockData, BlockConnectionName, BlockLogicTypes.WireValue])[]
		>();
		for (const otherblock of blocks) {
			if (!otherblock.config) continue;

			for (const [connectionName, cfg] of pairs(otherblock.config)) {
				if (cfg.type !== "wire") continue;
				const connection = cfg.config;

				if (!uuids.has(connection.blockUuid)) continue;

				let ret = result.get(connection.blockUuid);
				if (!ret) {
					result.set(connection.blockUuid, (ret = []));
				}

				ret.push([otherblock, connectionName as BlockConnectionName, connection] as const);
			}
		}

		return result;
	}

	export function calculateScale(block: BlockModel, originalMode: BlockModel): Vector3 {
		return block.PrimaryPart!.Size.div(originalMode.PrimaryPart!.Size);
	}

	export function scale(block: BlockModel, originalModel: BlockModel, scale: Vector3) {
		const origModelCenter = originalModel.GetPivot();
		const blockCenter = block.GetPivot();

		const update = (instance: Instance, origInstance: Instance) => {
			// assuming no duplicate instance names on a single layer

			for (const origChild of origInstance.GetChildren()) {
				const name = origChild.Name;
				const child = instance.WaitForChild(name);

				if (child.IsA("BasePart") && origChild.IsA("BasePart")) {
					child.Size = origChild.Size.mul(origChild.CFrame.Rotation.Inverse().mul(scale).Abs());

					const offset = origModelCenter.ToObjectSpace(origChild.CFrame);
					child.Position = blockCenter.ToWorldSpace(new CFrame(offset.Position.mul(scale))).Position;
				}

				update(child, origChild);
			}
		};

		update(block, originalModel);
	}

	/**
	 * Set the block material and color
	 * @param byBuild If true, will force update block transparency
	 */
	export function paint(
		blocks: readonly BlockModel[],
		color: Color3 | undefined,
		material: Enum.Material | undefined,
		byBuild: boolean = false,
	) {
		for (const block of blocks) {
			if (material) {
				BlockManager.manager.material.set(block, material);
				PartUtils.switchDescendantsMaterial(block, material);

				// Make glass material transparent
				if (material === Enum.Material.Glass) {
					PartUtils.switchDescendantsTransparency(block, 0.3);
				} else if (!byBuild) {
					PartUtils.switchDescendantsTransparency(block, 0);
				}

				// Custom physical properties
				const customPhysProp = MaterialData.Properties[material.Name] ?? MaterialData.Properties.Default;

				PartUtils.applyToAllDescendantsOfType("BasePart", block, (part) => {
					if (!byBuild || !part.CustomPhysicalProperties) {
						const currentPhysProp = !byBuild
							? new PhysicalProperties(material!)
							: part.CurrentPhysicalProperties;

						part.CustomPhysicalProperties = new PhysicalProperties(
							customPhysProp.Density ?? currentPhysProp.Density,
							customPhysProp.Friction ?? currentPhysProp.Friction,
							customPhysProp.Elasticity ?? currentPhysProp.Elasticity,
							customPhysProp.FrictionWeight ?? currentPhysProp.FrictionWeight,
							customPhysProp.ElasticityWeight ?? currentPhysProp.ElasticityWeight,
						);
					}
				});
			}

			if (color) {
				BlockManager.manager.color.set(block, color);
				PartUtils.switchDescendantsColor(block, color);
			}
		}
	}
}

import { Workspace } from "@rbxts/services";
import { Component } from "engine/shared/component/Component";
import { ComponentInstance } from "engine/shared/component/ComponentInstance";
import { Element } from "engine/shared/Element";
import { BlockManager } from "shared/building/BlockManager";
import { BlocksSerializer } from "shared/building/BlocksSerializer";
import { BuildingPlot } from "shared/building/BuildingPlot";
import { Colors } from "shared/Colors";
import { PartUtils } from "shared/utils/PartUtils";
import { VectorUtils } from "shared/utils/VectorUtils";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { ClientBuilding, ClientBuildingTypes } from "client/modes/build/ClientBuilding";
import type { BuildingDiffChange } from "client/tutorial2/BuildingDiffer";
import type { MiddlewareResponse } from "engine/shared/Operation";
import type { LatestSerializedBlocks } from "shared/building/BlocksSerializer";
import type { ReadonlyPlot } from "shared/building/ReadonlyPlot";
import type { SharedPlot } from "shared/building/SharedPlot";

@injectable
class TutorialPlot extends Component {
	private readonly instance: Folder;

	private readonly plot: BuildingPlot;
	private readonly actualPlot: ReadonlyPlot;

	constructor(
		plot: ReadonlyPlot,
		private readonly blockList: BlockList,
	) {
		super();

		this.actualPlot = plot;

		this.instance = new Instance("Folder");
		this.instance.Name = "TutorialPreview";
		this.instance.Parent = Workspace;
		ComponentInstance.init(this, this.instance);

		this.plot = new BuildingPlot(this.instance, plot.origin, plot.boundingBox, blockList);

		this.onDestroy(() => this.clearBlocks());
	}

	build(blocks: LatestSerializedBlocks) {
		BlocksSerializer.deserializeFromObject(blocks, this.plot, this.blockList);

		for (const block of this.plot.getBlocks()) {
			PartUtils.ghostModel(block, Colors.white);

			Element.create("SelectionBox", {
				Color3: Color3.fromRGB(0, 255, 255),
				LineThickness: 0.05,
				Adornee: block,
				Parent: block,
			});
		}
	}
	remove(uuid: BlockUuid) {
		this.plot.tryGetBlock(uuid)?.Destroy();
	}

	highlight(uuids: readonly BlockUuid[]): SignalConnection {
		const highlights: Instance[] = [];

		for (const uuid of uuids) {
			const block = this.actualPlot.getBlock(uuid);

			const selectionBox = new Instance("SelectionBox");
			selectionBox.Adornee = block;
			selectionBox.Color3 = Color3.fromRGB(255);
			selectionBox.SurfaceTransparency = 1;
			selectionBox.Transparency = 0;
			selectionBox.LineThickness = 0.05;
			selectionBox.Parent = block;

			highlights.push(selectionBox);
		}

		return {
			Disconnect() {
				for (const highlight of highlights) {
					highlight.Destroy();
				}
			},
		};
	}
	clearBlocks() {
		this.plot.deleteOperation.execute("all");
	}
}

type BuildSubscription = { blocks: LatestSerializedBlocks; readonly finish: () => void };
class Build extends Component {
	private readonly subscribed = new Set<BuildSubscription>();

	constructor(
		private readonly plot: TutorialPlot,
		private readonly building: ClientBuilding,
	) {
		super();

		this.event.subscribeRegistration(() =>
			this.building.placeOperation.addMiddleware(
				(arg): MiddlewareResponse<ClientBuildingTypes.PlaceBlocksArgs> => {
					if (this.subscribed.size() === 0) {
						return { success: true, arg };
					}

					const bs = arg.blocks.mapFiltered((block) => {
						for (const b of this.subscribed) {
							const btp = b.blocks.blocks.find(
								(value) =>
									value.id === block.id &&
									VectorUtils.roundVector3To(value.location.Position, 0.5) ===
										VectorUtils.roundVector3To(
											arg.plot.instance.BuildingArea.CFrame.ToObjectSpace(block!.location)
												.Position,
											0.5,
										),
							);

							if (btp) {
								return [btp, b] as const;
							}
						}
					});

					if (bs.size() !== arg.blocks.size()) {
						return { success: false, message: "Invalid placement" };
					}

					for (const [b, sub] of bs) {
						if (!b.uuid) continue;
						plot.remove(b.uuid);

						sub.blocks = { ...sub.blocks, blocks: sub.blocks.blocks.except([b]) };
						if (sub.blocks.blocks.size() === 0) {
							this.subscribed.delete(sub);
							sub.finish();
						}
					}

					return {
						success: true,
						arg: {
							...arg,
							blocks: bs.map(
								([block]): PlaceBlockRequest => ({
									...block,
									location: arg.plot.instance.BuildingArea.CFrame.ToWorldSpace(block.location),
									color: Colors.white,
									material: Enum.Material.Plastic,
									scale: Vector3.one,
								}),
							),
						},
					};
				},
			),
		);
	}

	waitForBuild(blocks: LatestSerializedBlocks, finish: () => void): Component {
		const ret = new Component();

		this.plot.build(blocks);

		const b = { blocks, finish };
		this.subscribed.add(b);

		ret.onDestroy(() => {
			for (const { uuid } of blocks.blocks) {
				this.plot.remove(uuid);
			}
		});
		ret.onDestroy(() => this.subscribed.delete(b));
		return ret;
	}
}

type RemoveSubscription = { blocks: ReadonlySet<BlockUuid>; readonly finish: () => void };
class Remove extends Component {
	private readonly subscribed = new Set<RemoveSubscription>();

	constructor(
		private readonly plot: TutorialPlot,
		private readonly building: ClientBuilding,
	) {
		super();

		this.event.subscribeRegistration(() =>
			this.building.deleteOperation.addMiddleware((arg) => {
				if (this.subscribed.size() === 0) {
					return { success: true };
				}

				const blocks = arg.blocks === "all" ? arg.plot.getBlocks() : arg.blocks;
				const bs = blocks.mapFiltered((block) => {
					const blockUuid = BlockManager.manager.uuid.get(block);

					for (const sub of this.subscribed) {
						const btp = sub.blocks.has(blockUuid);
						if (btp) {
							return [blockUuid, sub] as const;
						}
					}
				});

				if (bs.size() !== blocks.size()) {
					return { success: false, message: "Invalid deletion" };
				}

				for (const [b, sub] of bs) {
					if (!b) continue;
					plot.remove(b);

					sub.blocks = sub.blocks.except([b]);
					if (sub.blocks.size() === 0) {
						this.subscribed.delete(sub);
						sub.finish();
					}
				}

				return { success: true };
			}),
		);
	}

	waitForDelete(blocks: ReadonlySet<BlockUuid>, finish: () => void): Component {
		const ret = new Component();

		const highlightSub = this.plot.highlight([...blocks]);

		const b = { blocks, finish };
		this.subscribed.add(b);

		ret.onDestroy(() => highlightSub.Disconnect());
		ret.onDestroy(() => this.subscribed.delete(b));
		return ret;
	}
}

@injectable
export class TutorialPlotController extends Component {
	plot: TutorialPlot = undefined!;
	private build: Build = undefined!;
	private remove: Remove = undefined!;

	constructor() {
		super();

		this.$onInjectAuto((plot: ReadonlyPlot, splot: SharedPlot, blockList: BlockList, buildMode: BuildingMode) => {
			buildMode.building.deleteOperation.execute({ blocks: "all", plot: splot });
			this.plot = this.parent(new TutorialPlot(plot, blockList));

			this.build = this.parent(new Build(this.plot, buildMode.building));
			this.remove = this.parent(new Remove(this.plot, buildMode.building));
		});
	}

	processDiff(diff: BuildingDiffChange, finish: () => void): Component {
		let conds = 0;
		const addFinishCondition = () => {
			conds++;

			return () => {
				conds--;

				if (conds === 0) {
					finish();
				}
			};
		};

		const ret = new Component();
		if (diff.added) {
			ret.parent(this.build.waitForBuild({ version: diff.version, blocks: diff.added }, addFinishCondition()));
		}
		if (diff.removed) {
			ret.parent(this.remove.waitForDelete(new ReadonlySet(diff.removed), addFinishCondition()));
		}

		return ret;
	}
}

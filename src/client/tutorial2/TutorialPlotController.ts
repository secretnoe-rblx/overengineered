import { Workspace } from "@rbxts/services";
import { Component } from "engine/shared/component/Component";
import { ComponentInstance } from "engine/shared/component/ComponentInstance";
import { Element } from "engine/shared/Element";
import { BlocksSerializer } from "shared/building/BlocksSerializer";
import { BuildingPlot } from "shared/building/BuildingPlot";
import { Colors } from "shared/Colors";
import { PartUtils } from "shared/utils/PartUtils";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { ClientBuilding } from "client/modes/build/ClientBuilding";
import type { BuildTool } from "client/tools/BuildTool";
import type { LatestSerializedBlocks } from "shared/building/BlocksSerializer";
import type { ReadonlyPlot } from "shared/building/ReadonlyPlot";

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
		this.plot.getBlock(uuid).Destroy();
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

class Build extends Component {
	private readonly subscribed = new Set<LatestSerializedBlocks>();

	constructor(
		private readonly plot: TutorialPlot,
		private readonly building: ClientBuilding,
		private readonly buildTool: BuildTool,
	) {
		super();

		this.event.subscribeRegistration(() =>
			this.building.placeOperation.addMiddleware((arg) => {
				//

				return { success: true, arg };
			}),
		);
	}

	waitForBuild(blocks: LatestSerializedBlocks): Component {
		const ret = new Component();

		//

		return ret;
	}
}

@injectable
export class TutorialPlotController extends Component {
	plot: TutorialPlot = undefined!;
	build: Build = undefined!;

	constructor() {
		super();

		this.$onInjectAuto((plot: ReadonlyPlot, blockList: BlockList, buildMode: BuildingMode) => {
			this.plot = this.parent(new TutorialPlot(plot, blockList));

			this.build = this.parent(new Build(this.plot, buildMode.building, buildMode.tools.buildTool));
		});
	}
}

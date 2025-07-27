import { Component } from "engine/shared/component/Component";
import { Element } from "engine/shared/Element";
import { BuildingPlot } from "shared/building/BuildingPlot";
import { AutoPlotWelder } from "shared/building/PlotWelder";
import type { SharedPlot } from "shared/building/SharedPlot";

@injectable
export class ServerPlotController extends Component {
	readonly blocks;

	constructor(
		@inject readonly player: Player,
		@inject readonly plot: SharedPlot,
		@inject di: DIContainer,
	) {
		super();

		plot.ownerId.set(player.UserId);
		plot.whitelistedPlayers.set([5243461283]);
		plot.blacklistedPlayers.set(undefined);
		plot.isolationMode.set(undefined);
		player.RespawnLocation = plot.instance.WaitForChild("SpawnLocation") as SpawnLocation;

		const initializeBlocksFolder = (plot: SharedPlot): PlotBlocks => {
			plot.instance.FindFirstChild("Blocks")?.Destroy();

			const blocks = Element.create("Folder", { Name: "Blocks" }) as PlotBlocks;
			blocks.Parent = plot.instance;

			return blocks;
		};

		this.blocks = di.resolveForeignClass(BuildingPlot, [
			initializeBlocksFolder(plot),
			plot.getCenter(),
			plot.bounds,
		]);

		if (game.PrivateServerOwnerId === 0) {
			this.blocks.initializeDelay(3, 6, 3);
		}

		this.parent(di.resolveForeignClass(AutoPlotWelder, [this.blocks]));

		this.onDestroy(() => {
			plot.ownerId.set(undefined);
			plot.whitelistedPlayers.set([5243461283]);
			plot.blacklistedPlayers.set(undefined);
			plot.isolationMode.set(undefined);

			this.blocks.unparent();
			task.delay(1, () => this.blocks.destroy());
		});
	}
}

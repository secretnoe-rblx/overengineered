import { HostedService } from "engine/shared/di/HostedService";
import { PlotsFloatingImageController } from "server/plots/PlotsFloatingImageController";
import type { SharedPlot } from "shared/building/SharedPlot";
import type { SharedPlots } from "shared/building/SharedPlots";

@injectable
export class ServerPlots extends HostedService {
	constructor(@inject readonly plots: SharedPlots) {
		super();

		this.parent(new PlotsFloatingImageController(plots));

		const initializeSpawnLocation = (plot: SharedPlot) => {
			const spawnLocation = new Instance("SpawnLocation");
			spawnLocation.Name = "SpawnLocation";
			spawnLocation.Anchored = true;
			spawnLocation.Transparency = 1;
			spawnLocation.CanCollide = false;
			spawnLocation.CanQuery = false;
			spawnLocation.CanTouch = false;
			spawnLocation.PivotTo(plot.getSpawnCFrame());

			spawnLocation.Parent = plot.instance;
		};
		this.onEnable(() => {
			for (const plot of plots.plots) {
				initializeSpawnLocation(plot);
			}
		});

		// TODO:
		// this.event.subscribe(CustomRemotes.gui.settings.permissions.updateBlacklist.invoked, (player, newBlacklist) => {
		// 	const plot = this.tryGetControllerByPlayer(player);
		// 	if (!plot) throw "what";

		// 	plot.plot.blacklistedPlayers.set(newBlacklist);
		// });

		// this.event.subscribe(CustomRemotes.gui.settings.permissions.isolationMode.invoked, (player, state) => {
		// 	const plot = this.tryGetControllerByPlayer(player);
		// 	if (!plot) throw "what";

		// 	plot.plot.isolationMode.set(state);
		// });
	}
}

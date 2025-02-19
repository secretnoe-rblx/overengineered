import { Component } from "engine/shared/component/Component";
import { ServerBuildingRequestController } from "server/building/ServerBuildingRequestController";
import { ServerPlotController } from "server/plots/ServerPlotController";
import { ServerPlayerDataRemotesController } from "server/ServerPlayerDataRemotesController";
import { PlayerDataRemotes } from "shared/remotes/PlayerDataRemotes";
import type { SharedPlot } from "shared/building/SharedPlot";
import type { PlayerDataStorageRemotes } from "shared/remotes/PlayerDataRemotes";

@injectable
export class ServerPlayerController extends Component {
	readonly remotesFolder: Instance;
	readonly remotes: PlayerDataStorageRemotes;

	readonly plotController;

	constructor(
		@inject readonly player: Player,
		@inject readonly plot: SharedPlot,
		@inject di: DIContainer,
	) {
		super();

		$log(`Creating server player controller for ${player.UserId} ${player.Name}`);
		this.onDestroy(() => $log(`Destroying server player controller for ${player.UserId} ${player.Name}`));

		const dataController = this.parent(ServerPlayerDataRemotesController.create(di, player.UserId));
		this.remotesFolder = dataController.remotesFolder;
		const buildingRemotes = PlayerDataRemotes.createBuilding(this.remotesFolder);

		this.remotes = {
			slots: dataController.slotRemotes,
			player: dataController.playerRemotes,
			building: buildingRemotes,
		};

		di = di.beginScope((builder) => {
			builder.registerSingletonValue(dataController.slotRemotes);
			builder.registerSingletonValue(dataController.playerRemotes);
			builder.registerSingletonValue(buildingRemotes);
			builder.registerSingletonValue(this.remotes);

			builder.registerSingletonClass(ServerPlotController);
			builder.registerSingletonClass(ServerBuildingRequestController);
			builder.registerSingletonValue(plot);
			builder.registerSingletonFunc((ctx) => ctx.resolve<ServerPlotController>().blocks);
		});

		this.plotController = this.parent(di.resolve<ServerPlotController>());
		this.parent(di.resolve<ServerBuildingRequestController>());
	}
}

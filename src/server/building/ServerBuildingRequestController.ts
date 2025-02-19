import { HostedService } from "engine/shared/di/HostedService";
import { ServerBuildingRequestHandler } from "server/building/ServerBuildingRequestHandler";
import { BlocksSerializer } from "shared/building/BlocksSerializer";
import { SlotsMeta } from "shared/SlotsMeta";
import type { C2S2CRemoteFunction } from "engine/shared/event/PERemoteEvent";
import type { Operation } from "engine/shared/Operation";
import type { SlotDatabase } from "server/database/SlotDatabase";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { ServerPlotController } from "server/plots/ServerPlotController";
import type { ServerPlayerController } from "server/ServerPlayerController";

@injectable
export class ServerBuildingRequestController extends HostedService {
	constructor(
		@inject serverPlayerController: ServerPlayerController,
		@inject plotController: ServerPlotController,
		@inject playModeController: PlayModeController,
		@inject slots: SlotDatabase,
		@inject di: DIContainer,
	) {
		super();

		const player = serverPlayerController.player;
		const blocks = plotController.blocks;

		di = di.beginScope((builder) => {
			builder.registerSingletonClass(ServerBuildingRequestHandler);
		});

		const buildingRequestHandler = this.parent(di.resolve<ServerBuildingRequestHandler>());

		const savePlot = () => {
			const save = playModeController.getPlayerMode(player) === "build" && blocks.getBlocks().size() !== 0;

			if (save) {
				slots.setBlocks(player.UserId, SlotsMeta.quitSlotIndex, BlocksSerializer.serializeToObject(blocks));
			} else {
				slots.setBlocksFromAnotherSlot(player.UserId, SlotsMeta.quitSlotIndex, SlotsMeta.autosaveSlotIndex);
			}
		};
		this.onDestroy(savePlot);

		const subFunc = <TArg, TRet extends {}>(
			remote: C2S2CRemoteFunction<TArg, Response<TRet>>,
			getfunc: (handler: ServerBuildingRequestHandler["operations"]) => Operation<TArg, TRet>,
		) => {
			remote.subscribe((player, arg) => {
				const operation = getfunc(buildingRequestHandler.operations);

				$trace("Executing remote", operation, "with arg", arg);
				return operation.execute(arg);
			});
		};

		const b = serverPlayerController.remotes.building;
		subFunc(b.placeBlocks, (c) => c.placeBlocks);
		subFunc(b.deleteBlocks, (c) => c.deleteBlocks);
		subFunc(b.editBlocks, (c) => c.editBlocks);
		subFunc(b.logicConnect, (c) => c.logicConnect);
		subFunc(b.logicDisconnect, (c) => c.logicDisconnect);
		subFunc(b.paintBlocks, (c) => c.paintBlocks);
		subFunc(b.updateConfig, (c) => c.updateConfig);
		subFunc(b.resetConfig, (c) => c.resetConfig);

		const s = serverPlayerController.remotes.slots;
		subFunc(s.load, (c) => c.loadSlot);
		// subFunc(s.loadAsAdmin, (c) => c.loadSlotAsAdmin);
		subFunc(s.save, (c) => c.saveSlot);
		subFunc(s.delete, (c) => c.deleteSlot);
	}
}

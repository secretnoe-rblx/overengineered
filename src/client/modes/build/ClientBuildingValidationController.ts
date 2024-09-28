import { Players } from "@rbxts/services";
import { ClientBuilding } from "client/modes/build/ClientBuilding";
import { BuildingManager } from "shared/building/BuildingManager";
import { HostedService } from "shared/di/HostedService";
import { errorResponse, successResponse } from "shared/types/network/Responses";
import { PlayerUtils } from "shared/utils/PlayerUtils";
import type { GameHostBuilder } from "shared/GameHostBuilder";

@injectable
export class ClientBuildingValidationController extends HostedService {
	static initialize(host: GameHostBuilder) {
		host.services.registerService(this);
	}

	constructor(@inject blockList: BlockList) {
		super();

		this.event.eventHandler.register(
			ClientBuilding.placeOperation.addMiddleware(({ plot, blocks }) => {
				if (!PlayerUtils.isAlive(Players.LocalPlayer)) {
					return errorResponse("Player is dead");
				}

				if (blocks.size() === 0) {
					return errorResponse("No blocks to place");
				}

				if (!blocks.all((b) => b.id in blockList.blocks)) {
					return errorResponse("Unknown block id");
				}

				if (
					!blocks.all((block) =>
						BuildingManager.blockCanBePlacedAt(plot, blockList.blocks[block.id]!, block.location),
					)
				) {
					return errorResponse("Can't be placed here");
				}

				return successResponse;
			}),
		);
	}
}

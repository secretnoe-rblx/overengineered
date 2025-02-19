import { Players } from "@rbxts/services";
import { Component } from "engine/shared/component/Component";
import { errorResponse, successResponse } from "engine/shared/Responses";
import { PlayerUtils } from "engine/shared/utils/PlayerUtils";
import { BuildingManager } from "shared/building/BuildingManager";
import type { ClientBuilding } from "client/modes/build/ClientBuilding";

@injectable
export class ClientBuildingValidationController extends Component {
	constructor(@inject blockList: BlockList, @inject clientBuilding: ClientBuilding) {
		super();

		this.event.subscribeRegistration(() =>
			clientBuilding.placeOperation.addMiddleware(({ plot, blocks }) => {
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
						BuildingManager.blockCanBePlacedAt(
							plot,
							blockList.blocks[block.id]!,
							block.location,
							block.scale ?? Vector3.one,
						),
					)
				) {
					return errorResponse("Can't be placed here");
				}

				return successResponse;
			}),
		);
	}
}

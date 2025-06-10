import { HostedService } from "engine/shared/di/HostedService";
import { BackMountBlockServerLogic } from "server/blocks/logic/BackMountBlockServerLogic";
import { BeaconServerLogic } from "server/blocks/logic/BeaconBlockServerLogic";
import { BracedShaftServerLogic } from "server/blocks/logic/BracedShaftServerLogic";
import { ButtonServerLogic } from "server/blocks/logic/ButtonServerLogic";
import { CameraBlockServerLogic } from "server/blocks/logic/CameraBlockServerLogic";
import { DisconnectBlockServerLogic } from "server/blocks/logic/DisconnectBlockServerLogic";
import { LEDDisplayServerLogic } from "server/blocks/logic/LEDDisplayServerLogic";
import { PistonBlockServerLogic } from "server/blocks/logic/PistonBlockServerLogic";
import { ScreenServerLogic } from "server/blocks/logic/ScreenServerLogic";
import { SevenSegmentDisplayServerLogic } from "server/blocks/logic/SevenSegmentDisplayServerLogic";
import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { GenericBlockLogicCtor } from "shared/blockLogic/BlockLogic";

type ServerBlockLogicRegistry = {
	readonly [k in BlockId]?: new (...args: never) => ServerBlockLogic<GenericBlockLogicCtor>;
};

@injectable
export class ServerBlockLogicController extends HostedService {
	constructor(
		@inject blockList: BlockList,
		@inject playModeController: PlayModeController,
		@inject container: DIContainer,
	) {
		super();
		container = container.beginScope();

		for (const [, { logic }] of pairs(blockList.blocks)) {
			if (!logic?.events) continue;

			for (const [, event] of pairs(logic.events)) {
				event.addServerMiddleware((invoker, arg) => {
					if (!arg.block) return { success: false, message: "No block" };
					if (!arg.block?.PrimaryPart) return { success: false, message: "No primary part" };

					if (!ServerBlockLogic.staticIsValidBlock(arg.block.PrimaryPart, invoker, playModeController)) {
						return { success: false, message: "Invalid something" };
					}

					return { success: true, value: arg };
				});
			}
		}

		const serverBlockLogicRegistry: ServerBlockLogicRegistry = {
			camera: CameraBlockServerLogic,
			disconnectblock: DisconnectBlockServerLogic,
			leddisplay: LEDDisplayServerLogic,
			screen: ScreenServerLogic,
			button: ButtonServerLogic,
			piston: PistonBlockServerLogic,
			sevensegmentdisplay: SevenSegmentDisplayServerLogic,
			bracedshaft: BracedShaftServerLogic,
			beacon: BeaconServerLogic,
			backmount: BackMountBlockServerLogic,
		};

		//
		const logics: object[] = [];
		for (const [id, logic] of pairs(serverBlockLogicRegistry)) {
			$log(`Initializing server logic for ${id}`);

			const bl = blockList.blocks[id]?.logic?.ctor;
			if (!bl) continue;

			logics.push(container.resolveForeignClass(logic, [bl] as never));
		}
	}
}

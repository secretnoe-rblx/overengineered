import { BracedShaftServerLogic } from "server/blocks/logic/BracedShaftServerLogic";
import { DisconnectBlockServerLogic } from "server/blocks/logic/DisconnectBlockServerLogic";
import { LampServerLogic } from "server/blocks/logic/LampServerLogic";
import { LEDDisplayServerLogic } from "server/blocks/logic/LEDDisplayServerLogic";
import { PistonBlockServerLogic } from "server/blocks/logic/PistonBlockServerLogic";
import { ScreenServerLogic } from "server/blocks/logic/ScreenServerLogic";
import { SevenSegmentDisplayServerLogic } from "server/blocks/logic/SevenSegmentDisplayServerLogic";
import { BlockLogicRegistry } from "shared/block/BlockLogicRegistry";
import { HostedService } from "shared/GameHost";
import type { ServerBlockLogic } from "server/blocks/ServerBlockLogic";

type ServerBlockLogicRegistry = {
	readonly [k in BlockId]?: new (...args: never) => ServerBlockLogic<new (...args: any[]) => unknown>;
};

@injectable
export class ServerBlockLogicController extends HostedService {
	constructor(@inject blockList: BlockList, @inject container: DIContainer) {
		super();
		container = container.beginScope();

		const serverBlockLogicRegistry: ServerBlockLogicRegistry = {
			disconnectblock: DisconnectBlockServerLogic,
			lamp: LampServerLogic,
			smalllamp: LampServerLogic,
			leddisplay: LEDDisplayServerLogic,
			screen: ScreenServerLogic,
			piston: PistonBlockServerLogic,
			sevensegmentdisplay: SevenSegmentDisplayServerLogic,
			bracedshaft: BracedShaftServerLogic,
		};

		//
		const logics: object[] = [];
		for (const [id, logic] of pairs(serverBlockLogicRegistry)) {
			$log(`Initializing server logic for ${id}`);

			const bl = BlockLogicRegistry.registry[id] ?? blockList.blocks[id]!.logic!.ctor;
			logics.push(container.resolveForeignClass(logic, [bl] as never));
		}
	}
}

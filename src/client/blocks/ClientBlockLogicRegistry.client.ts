import type { ClientBlockLogic } from "client/blocks/ClientBlockLogic";
import type { GenericBlockLogicCtor } from "shared/blockLogic/BlockLogic";

type ClientBlockLogicRegistry = {
	readonly [k in BlockId]?: new (...args: any[]) => ClientBlockLogic<GenericBlockLogicCtor>;
};

const clientBlockLogicRegistry: ClientBlockLogicRegistry = {};

//
const logics: object[] = [];
for (const [id, logic] of pairs(clientBlockLogicRegistry)) {
	$log(`Initializing client logic for ${id}`);
	//logics.push(new logic(BlockLogicRegistry.registry[id] as never));
}

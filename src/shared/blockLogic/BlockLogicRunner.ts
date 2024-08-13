import { Component } from "shared/component/Component";
import type { BlockConfigBothDefinitions, BlockLogic } from "shared/blockLogic/BlockLogic";

type Logic = BlockLogic<BlockConfigBothDefinitions>;
type OutputConnection = string & { readonly ___nominal: "OutputConnection" };
type InputConnection = string & { readonly ___nominal: "InputConnection" };

type BlockLogicConnection = {
	readonly outputConnection: OutputConnection;

	readonly otherBlock: Logic;
	readonly inputConnection: InputConnection;

	readonly connection: SignalConnection;
};
class BlockLogicWithConnections {
	readonly outputConnections = new Map<OutputConnection, BlockLogicConnection>();
	readonly inputConnections = new Map<InputConnection, SignalConnection>();

	constructor(readonly blockLogic: Logic) {
		//
	}

	connect(blockConnection: OutputConnection, otherBlock: Logic, otherConnection: InputConnection): SignalConnection {
		const connection = this.blockLogic.output[blockConnection].changed.Connect(({ valueType, value }) => {
			otherBlock.input[blockConnection].set(valueType, value);
		});

		this.outputConnections.set(blockConnection, {
			outputConnection: blockConnection,
			otherBlock,
			inputConnection: otherConnection,
			connection,
		});

		return connection;
	}
	addInputConnection(blockConnection: InputConnection, connection: SignalConnection) {
		this.inputConnections.set(blockConnection, connection);
	}

	destroy() {
		for (const [, connection] of this.outputConnections) {
			connection.connection.Disconnect();
		}
	}
}

export class BlockLogicRunner extends Component {
	readonly blocks = new Map<Logic, BlockLogicWithConnections>();

	constructor() {
		super();
	}

	addBlock(block: Logic) {
		const blwc = new BlockLogicWithConnections(block);
		this.blocks.set(block, blwc);
	}
	removeBlock(block: Logic) {
		const blwc = this.blocks.get(block);
		if (!blwc) return;

		for (const [outputConnection, connection] of blwc.outputConnections) {
			const blwc = this.blocks.get(connection.otherBlock);
			if (!blwc) continue;

			// connection.otherBlock
		}

		blwc.destroy();
		this.blocks.delete(block);
	}

	/** Connect a {@link block} output connection {@link blockConnection} to {@link otherBlock} input connection {@link otherConnection} */
	connect(block: Logic, blockConnection: string, otherBlock: Logic, otherConnection: string) {
		const blockConnectionMap = this.blocks.getOrSet(block, () => new BlockLogicWithConnections(block));
		const connection = blockConnectionMap.connect(
			blockConnection as OutputConnection,
			otherBlock,
			otherConnection as InputConnection,
		);

		const otherBlockConnectionMap = this.blocks.getOrSet(
			otherBlock,
			() => new BlockLogicWithConnections(otherBlock),
		);
		otherBlockConnectionMap.addInputConnection(otherConnection as InputConnection, connection);
	}
}

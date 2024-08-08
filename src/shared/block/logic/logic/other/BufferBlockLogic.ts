import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";

export class BufferBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.buffer> {
	constructor(block: PlacedBlockData) {
		super(block, blockConfigRegistry.buffer);

		this.input.value.subscribe(() => this.update());
	}

	private update() {
		this.output.result.set(this.input.value.get());
	}
}

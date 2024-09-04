import { Assert } from "shared/Assert";
import { BlockTestRunner } from "shared/blocks/testing/BlockTestRunner";
import type { GenericBlockLogic, BlockLogicTickOnlyContext } from "shared/blockLogic/BlockLogic";
import type { BlockLogicValueResults } from "shared/blockLogic/BlockLogicValueStorage";

export namespace BlockAssert {
	export function resultSuccessAndEquals(
		block: GenericBlockLogic,
		ctx: BlockLogicTickOnlyContext | BlockTestRunner,
		outputName: string,
		properties: { readonly value?: unknown },
	) {
		if (ctx instanceof BlockTestRunner) {
			ctx = { tick: ctx.getTick() };
		}

		const result = block.getOutputValue(ctx, outputName);
		Assert.isNot(result, "string", `Value is ${result}, while expected success on tick ${ctx.tick}`);
		Assert.propertiesEqual(result, properties, `tick ${ctx.tick}`);
	}
	export function resultError(
		block: GenericBlockLogic,
		ctx: BlockLogicTickOnlyContext | BlockTestRunner,
		outputName: string,
		vresult: BlockLogicValueResults,
	) {
		if (ctx instanceof BlockTestRunner) {
			ctx = { tick: ctx.getTick() };
		}

		const result = block.getOutputValue(ctx, outputName);
		Assert.equals(result, vresult, `tick ${ctx.tick}`);
	}
}

import { Assert } from "engine/shared/Assert";
import { BlockTestRunner } from "shared/blocks/testing/BlockTestRunner";
import type { GenericBlockLogic, BlockLogicTickContext } from "shared/blockLogic/BlockLogic";
import type { BlockLogicValueResults } from "shared/blockLogic/BlockLogicValueStorage";

export namespace BlockAssert {
	export function resultSuccess(
		block: GenericBlockLogic,
		ctx: BlockLogicTickContext | BlockTestRunner,
		outputName: string,
		message?: string,
	) {
		if (ctx instanceof BlockTestRunner) {
			ctx = ctx.getContext();
		}

		const result = block.getOutputValue(ctx, outputName);
		Assert.isNot(result, "string", `${message}; Value is ${result}, while expected success on tick ${ctx.tick}`);

		return result;
	}
	export function resultSuccessAndEquals(
		block: GenericBlockLogic,
		ctx: BlockLogicTickContext | BlockTestRunner,
		outputName: string,
		properties: { readonly value?: unknown },
		message?: string,
	) {
		if (ctx instanceof BlockTestRunner) {
			ctx = ctx.getContext();
		}

		const result = resultSuccess(block, ctx, outputName, message);
		Assert.propertiesEqual(result, properties, `${message} (tick ${ctx.tick})`);
	}

	export function resultError(
		block: GenericBlockLogic,
		ctx: BlockLogicTickContext | BlockTestRunner,
		outputName: string,
		vresult: BlockLogicValueResults,
		message?: string,
	) {
		if (ctx instanceof BlockTestRunner) {
			ctx = ctx.getContext();
		}

		const result = block.getOutputValue(ctx, outputName);
		Assert.equals(result, vresult, `${message} (tick ${ctx.tick})`);
	}
}

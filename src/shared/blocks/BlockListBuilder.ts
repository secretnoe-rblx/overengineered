import { RunService } from "@rbxts/services";
import { C2S2CRemoteFunction } from "shared/event/PERemoteEvent";
import type { BlockBuilder } from "shared/blocks/BlockCreation";

export namespace BlockListBuilder {
	type RemoteBlock = Pick<Block, Exclude<keyof Block, keyof BlockBuilder>>;
	/** @server */
	let serverBuiltBlocks: { readonly [k in string]: RemoteBlock } | undefined;
	const fetchRemoteBlocks = new C2S2CRemoteFunction<
		undefined,
		Response<{ readonly blocks: { readonly [k in string]: RemoteBlock } }>
	>("b_fetchBlocks");
	if (RunService.IsServer()) {
		fetchRemoteBlocks.subscribe(() => {
			if (!serverBuiltBlocks) {
				return { success: false, message: "Not initialized yet" };
			}

			return { success: true, blocks: serverBuiltBlocks };
		});
	}

	export function buildBlockList(builders: readonly BlockBuilder[]): BlockList {
		if (RunService.IsServer()) {
			serverBuiltBlocks = asObject(
				builders.mapToMap((b) => {
					const model = b.modelSource.model(b);
					const category = b.modelSource.category(b, model);
					const markerPositions = b.markerPositionsSource(b, model);
					const weldRegions = b.weldRegionsSource(b, model);

					return $tuple(b.id, {
						model,
						category,
						markerPositions,
						weldRegions,
					});
				}),
			);
		}

		let remoteBlocks: typeof serverBuiltBlocks;
		if (RunService.IsClient()) {
			const result = fetchRemoteBlocks.send();
			if (!result.success) {
				// TODO: retry or something
				throw result.message;
			}

			remoteBlocks = result.blocks;
		} else {
			remoteBlocks = serverBuiltBlocks;
		}

		if (!remoteBlocks) {
			throw "No server built blocks present";
		}

		const blocks = asObject(
			builders.mapToMap((b) =>
				$tuple(b.id as BlockId, {
					...b,
					id: b.id as BlockId,
					...remoteBlocks[b.id],
				} satisfies Block),
			),
		);

		const sorted = asMap(blocks)
			.values()
			.sort((left, right) => left.id < right.id);

		return { blocks, sorted };
	}
}

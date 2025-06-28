import { BlocksSerializer } from "shared/building/BlocksSerializer";
import type { PlacedBlockConfig } from "shared/blockLogic/BlockConfig";
import type { LatestSerializedBlock, LatestSerializedBlocks } from "shared/building/BlocksSerializer";
import type { ReadonlyPlot } from "shared/building/ReadonlyPlot";

export type DiffBlock = LatestSerializedBlock;

type Added = {
	readonly id: BlockId;
	readonly uuid: BlockUuid;
	readonly location: CFrame;
};
type Removed = BlockUuid;
type ConfigChanged = {
	readonly uuid: BlockUuid;
	readonly key: string;
	readonly value: PartialThrough<PlacedBlockConfig[string]> | undefined;
};
type Moved = {
	readonly uuid: BlockUuid;
	readonly to: Vector3;
};
type Rotated = {
	readonly uuid: BlockUuid;
	readonly to: CFrame;
};

export type BuildingDiffChange = {
	readonly version: number;
	readonly added?: readonly Added[];
	readonly removed?: readonly Removed[];
	readonly configChanged?: readonly ConfigChanged[];
	readonly moved?: readonly Moved[];
	readonly rotated?: readonly Rotated[];
};
const arrKeys = [
	"added",
	"removed",
	"configChanged",
	"moved",
	"rotated",
] as const satisfies (keyof BuildingDiffChange)[];

export namespace BuildingDiffer {
	let before: LatestSerializedBlocks | undefined;

	function toTsCode(obj: unknown): string {
		const mapObjectProperties = (obj: object) =>
			`${asMap(obj)
				.map((k, v) => `${k}: ${toTsCode(v)}`)
				.join(",\n")}`;
		const radToDeg = (angle: number) => {
			// special case for -0
			if (angle === 0) return "0";

			return `math.rad(${math.round(math.deg(angle))})`;
		};

		// print uuid first
		if (typeIs(obj, "table") && "uuid" in obj) {
			return `{ uuid: ${toTsCode(obj.uuid)}, ${mapObjectProperties({ ...obj, uuid: undefined })} }`;
		}

		if (typeIs(obj, "string")) return `"${obj}"`;
		if (typeIs(obj, "number")) return tostring(obj);
		if (typeIs(obj, "boolean")) return tostring(obj);
		if (typeIs(obj, "table")) {
			if (1 in obj) {
				return `[ ${asMap(obj)
					.map((k, v) => toTsCode(v))
					.join(",\n")} ]`;
			}

			return `{ ${mapObjectProperties(obj)} }`;
		}
		if (typeIs(obj, "CFrame")) {
			const [xa, ya, za] = obj.ToOrientation();
			if (xa === 0 && ya === 0 && za === 0) {
				return `new CFrame(${obj.X}, ${obj.Y}, ${obj.Z})`;
			}

			const components = obj.GetComponents();
			return `new CFrame(${components.join()})`;
		}
		if (typeIs(obj, "Vector3")) {
			return `new Vector3(${obj.X}, ${obj.Y}, ${obj.Z})`;
		}
		if (typeIs(obj, "Vector2")) {
			return `new Vector2(${obj.X}, ${obj.Y})`;
		}

		return tostring(obj);
	}

	export function setBefore(plot: ReadonlyPlot): void {
		before = BlocksSerializer.serializeToObject(plot);
	}
	export function serializeDiffToTsCode(plot: ReadonlyPlot): string {
		const serialized = BlocksSerializer.serializeToObject(plot);
		const ret = diff(before?.blocks ?? [], serialized.blocks, serialized.version);

		return toTsCode(ret);
	}
	export function serializePlotToTsCode(plot: ReadonlyPlot): string {
		return toTsCode(BlocksSerializer.serializeToObject(plot));
	}

	function deepEquals(left: object, right: object): boolean {
		for (const [kl] of pairs(left)) {
			if (!(kl in right)) {
				return false;
			}

			if (!valueEquals(left[kl], right[kl])) {
				return false;
			}
		}
		for (const [kr] of pairs(right)) {
			if (!(kr in left)) {
				return false;
			}
		}

		return true;
	}
	function valueEquals(left: unknown, right: unknown): boolean {
		if (typeOf(left) !== typeOf(right)) {
			return false;
		}

		if (typeIs(left, "table")) {
			assert(typeIs(right, "table"));
			return deepEquals(left, right);
		}

		return left === right;
	}

	export function diff(
		before: readonly DiffBlock[],
		after: readonly DiffBlock[],
		version: number,
	): BuildingDiffChange {
		const beforeMap = before.mapToMap((block) => $tuple(block.uuid, block));
		const afterMap = after.mapToMap((block) => $tuple(block.uuid, block));

		type changes = {
			-readonly [k in keyof BuildingDiffChange]?: Writable<BuildingDiffChange[k]>;
		} & {
			readonly version: number;
		};

		const changes: changes = { version };
		for (const [uuid, before] of beforeMap) {
			const after = afterMap.get(uuid);
			if (!after) {
				(changes.removed ??= []).push(before.uuid);
				continue;
			}

			{
				const posbefore = before.location;
				const posafter = after.location;

				if (posbefore !== posafter) {
					if (posbefore.Position !== posafter.Position) {
						(changes.moved ??= []).push({ uuid, to: posafter.Position });
					}

					if (posbefore.Rotation !== posafter.Rotation) {
						(changes.rotated ??= []).push({ uuid, to: posafter.Rotation });
					}
				}
			}

			{
				const cfgbefore = before.config ?? {};
				const cfgafter = after.config ?? {};

				for (const [key, vbefore] of pairs(cfgbefore)) {
					if (!(key in cfgafter)) {
						(changes.configChanged ??= []).push({ uuid, key, value: undefined });
						continue;
					}

					const vafter = cfgafter[key];
					if (!valueEquals(vbefore, vafter)) {
						(changes.configChanged ??= []).push({ uuid, key, value: vafter });
						continue;
					}
				}
				for (const [key, vafter] of pairs(cfgafter)) {
					if (!(key in cfgbefore)) {
						(changes.configChanged ??= []).push({ uuid, key, value: vafter });
						continue;
					}
				}
			}
		}

		for (const [uuid, after] of afterMap) {
			const before = beforeMap.get(uuid);
			if (!before) {
				const block: Added = { id: after.id, location: after.location, uuid: after.uuid };
				(changes.added ??= []).push(block);

				const diff2 = diff([block], [after], version);
				for (const k of arrKeys) {
					if (!diff2[k]) continue;

					for (const item of diff2[k]) {
						(changes[k] ??= []).push(item as never);
					}
				}

				continue;
			}
		}

		return changes;
	}
}

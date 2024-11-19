import { RunService, Workspace } from "@rbxts/services";
import { EventHandler } from "engine/shared/event/EventHandler";
import { BuildingManager } from "shared/building/BuildingManager";
import type { UnitTests } from "engine/shared/TestFramework";

const parent = new Instance("Folder", Workspace);
parent.Name = "BlockMirroringTest";

const spawn = (di: DIContainer, blockid: BlockId, pos: CFrame) => {
	const block = di.resolve<BlockList>().blocks[blockid]!.model.Clone();
	block.Parent = parent;
	block.PivotTo(pos);

	return block;
};
const mirror = (di: DIContainer, blockid: BlockId, initialRotation?: CFrame) => {
	const main = spawn(di, blockid, (initialRotation ?? CFrame.identity).add(new Vector3(394, -16379, 357)));

	const mirrored = BuildingManager.getMirroredBlocks(
		new CFrame(396, -16377, 359),
		{ id: blockid, pos: main.GetPivot(), scale: Vector3.one },
		{ x: 0, y: 0, z: 0 },
		di.resolve<BlockList>(),
	);

	for (const { id, pos } of mirrored) {
		spawn(di, id, pos);
	}
};

const eventHandler = new EventHandler();
const id: BlockId = "halfcornerwedge2x1";

namespace BlockMirroringTest {
	export function cleanup() {
		eventHandler.unsubscribeAll();
		_cleanup();
	}

	export function wingRotated(di: DIContainer) {
		let time = 0;

		eventHandler.register(
			RunService.Heartbeat.Connect((dt) => {
				time += dt;
				_cleanup();

				const rotation = CFrame.fromEulerAnglesXYZ((math.pi / 3) * time, (math.pi / 2) * time, 0);
				mirror(di, id, rotation);
			}),
		);
	}
	export function object(di: DIContainer) {
		cleanup();
		mirror(di, id);
	}

	function _cleanup() {
		parent.ClearAllChildren();
	}
}
export const _Tests: UnitTests = { BlockMirroringTest };

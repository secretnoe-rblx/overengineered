import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { GyroscopeBlockLogic } from "shared/blocks/blocks/GyroscopeBlock";

@injectable
export class GyroscopeBlockServerLogic extends ServerBlockLogic<typeof GyroscopeBlockLogic> {
	constructor(logic: typeof GyroscopeBlockLogic, playerMode: PlayModeController) {
		super(logic, playerMode);

		logic.events.sync.invoked.Connect((player, data) => {
			const block = data.block;
			if (!this.isValidBlock(block, player, false, false)) return;
			block.Base.AlignOrientation.CFrame = data.constraint_cframe;
		});

		logic.events.update.invoked.Connect((player, data) => {
			const block = data.block;
			if (!this.isValidBlock(block, player, false, false)) return;
			const al = block.Base.AlignOrientation;
			al.Responsiveness = data.responsiveness;
			al.Enabled = data.gyroMode !== "localAngle" && data.enabled;
			al.MaxTorque = data.torque;
		});
	}
}

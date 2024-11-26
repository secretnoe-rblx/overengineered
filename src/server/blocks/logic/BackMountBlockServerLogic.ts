import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import { SharedRagdoll } from "shared/SharedRagdoll";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { BackMountBlockLogic } from "shared/blocks/blocks/BackMountBlock";

@injectable
export class BackMountBlockServerLogic extends ServerBlockLogic<typeof BackMountBlockLogic> {
	constructor(logic: typeof BackMountBlockLogic, @inject playModeController: PlayModeController) {
		super(logic, playModeController);

		logic.events.weldMountToPlayer.invoked.Connect((player, { block, connectToRootPart }) => {
			if (!this.isValidBlock(block, player, false)) return;

			const humanoid = player?.Character?.FindFirstChild("Humanoid") as Humanoid | undefined;
			if (!humanoid) return;

			let torso: BasePart | undefined;
			if (!connectToRootPart) {
				switch (humanoid.RigType) {
					case Enum.HumanoidRigType.R6:
						torso = humanoid.Parent?.FindFirstChild("Torso") as BasePart;
						break;
					case Enum.HumanoidRigType.R15:
						torso = humanoid.Parent?.FindFirstChild("UpperTorso") as BasePart;
						break;
					default:
						throw "what";
				}
			} else torso = humanoid.RootPart;

			if (!torso) return;

			SharedRagdoll.setPlayerRagdoll(humanoid, false);
			block.PlayerWeldConstraint.C1 = new CFrame(0, 0, torso.Size.Z / 2 + 0.3);
			block.PlayerWeldConstraint.Part1 = torso;
			humanoid.RootPart?.PivotTo(block.GetPivot());
		});

		logic.events.unweldMountFromPlayer.invoked.Connect((player, { block }) => {
			if (!this.isValidBlock(block, player)) return;

			if (block.PlayerWeldConstraint.Part1 && player?.Character?.IsAncestorOf(block.PlayerWeldConstraint.Part1)) {
				block.PlayerWeldConstraint.Part1 = undefined;
			}
		});
	}
}

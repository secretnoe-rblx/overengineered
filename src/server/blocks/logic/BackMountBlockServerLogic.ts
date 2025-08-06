import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import { ServerPartUtils } from "server/plots/ServerPartUtils";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { ServerPlayersController } from "server/ServerPlayersController";
import type { BackMountBlockLogic } from "shared/blocks/blocks/BackMountBlock";

@injectable
export class BackMountBlockServerLogic extends ServerBlockLogic<typeof BackMountBlockLogic> {
	constructor(
		logic: typeof BackMountBlockLogic,
		@inject playModeController: PlayModeController,
		@inject playersController: ServerPlayersController,
	) {
		super(logic, playModeController);

		const getPlayerTorso = (p: Player, connectToRootPart: boolean) => {
			const ch = p.Character;
			if (!ch) return;
			const h = ch.FindFirstChild("Humanoid") as Humanoid;
			if (!h) return;

			if (connectToRootPart) return h.RootPart;

			switch (h.RigType) {
				case Enum.HumanoidRigType.R6:
					return h.Parent?.FindFirstChild("Torso") as BasePart;
				case Enum.HumanoidRigType.R15:
					return h.Parent?.FindFirstChild("UpperTorso") as BasePart;
			}

			return;
		};

		const isAlreadyWelded = (w: Motor6D) => w.Part1 !== undefined;
		logic.events.weldMountUpdate.invoked.Connect((player, data) => {
			if (!player) return;
			const isWeldRequest = data.weldedState && !isAlreadyWelded(data.block.PlayerWeldConstraint);

			// print("Owner", data.owner);
			//weld if unwelded
			if (isWeldRequest) {
				const torso = getPlayerTorso(player, data.connectToRootPart!);
				if (!torso) return;
				ServerPartUtils.switchDescendantsNetworkOwner(data.block, player);
				data.block.PlayerWeldConstraint.C0 = new CFrame(new Vector3(0, 0, -torso.Size.Z));
				data.block.PlayerWeldConstraint.Part1 = torso;

				// update logic
				logic.events.updateLogic.send(data.owner, {
					block: data.block,
					weldedTo: player,
				});
				// print("Welded", player);
				return;
			}

			//unweld otherwise
			ServerPartUtils.switchDescendantsNetworkOwner(data.block, data.owner);
			data.block.PlayerWeldConstraint.Part1 = undefined;
			logic.events.updateLogic.send(data.owner, {
				block: data.block,
				weldedTo: undefined,
			});
			// print("Unwelded", player);
		});
	}
}

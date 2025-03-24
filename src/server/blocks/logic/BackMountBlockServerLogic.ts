import { Players } from "@rbxts/services";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import { SharedRagdoll } from "shared/SharedRagdoll";
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

		logic.events.initServer.invoked.Connect((player, data) => {
			const block = data.block;

			if (!this.isValidBlock(block, player, false, false)) return;
			if (!block.FindFirstChild("PlayerWeldConstraint")) return;

			const c = new InstanceComponent(block);
			c.event.subscribeMap(
				playersController.controllers,
				(playerid, controller) => {
					if (!controller) return;

					const player = Players.GetPlayerByUserId(playerid);
					if (!player) return;

					logic.events.initClient.send(data, player);
				},
				true,
			);
			c.enable();
		});

		logic.events.weldMountToPlayer.invoked.Connect((player, { block, connectToRootPart }) => {
			if (!this.isValidBlock(block, player, false, false)) return;
			if (!block.FindFirstChild("PlayerWeldConstraint")) return;

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
			humanoid.Sit = false;
			humanoid.RootPart?.PivotTo(block.GetPivot());
			block.PlayerWeldConstraint.C0 = new CFrame(0, 0, -torso.Size.Z + 0.15);
			block.PlayerWeldConstraint.Enabled = true;
			block.PlayerWeldConstraint.Part1 = torso;
		});

		logic.events.unweldMountFromPlayer.invoked.Connect((player, { block, owner }) => {
			if (!this.isValidBlock(block, player, false, false)) return;
			if (!block.FindFirstChild("PlayerWeldConstraint")) return;

			if (!block.PlayerWeldConstraint.Part1 || !player?.Character?.IsAncestorOf(block.PlayerWeldConstraint.Part1))
				return;

			block.PlayerWeldConstraint.Enabled = false;
			block.PlayerWeldConstraint.Part1 = block.WaitForChild("mainPart") as BasePart;
			block.PrimaryPart!.SetNetworkOwner(owner);
		});
	}
}

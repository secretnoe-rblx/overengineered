import { Strings } from "engine/shared/fixes/String.propmacro";
import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import { ServerPartUtils } from "server/plots/ServerPartUtils";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { BackMountBlockLogic } from "shared/blocks/blocks/BackMountBlock";

@injectable
export class BackMountBlockServerLogic extends ServerBlockLogic<typeof BackMountBlockLogic> {
	constructor(logic: typeof BackMountBlockLogic, @inject playModeController: PlayModeController) {
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
			print("[server] received weld mount update: ", Strings.pretty(data ?? {}));
			const isWeldRequest = data.weldedState && !isAlreadyWelded(data.block.PlayerWeldConstraint);

			//weld if unwelded
			if (isWeldRequest) {
				const torso = getPlayerTorso(player, data.connectToRootPart!);
				if (!torso) return;
				data.block.PlayerWeldConstraint.C0 = new CFrame(new Vector3(0, 0, -torso.Size.Z));
				data.block.PlayerWeldConstraint.Part1 = torso;
				ServerPartUtils.switchDescendantsNetworkOwner(data.block, player);

				// update logic
				logic.events.updateLogic.send("everyone", {
					block: data.block,
					weldedTo: player,
				});
				return;
			}

			//unweld otherwise
			data.block.PlayerWeldConstraint.Part1 = undefined;
			ServerPartUtils.switchDescendantsNetworkOwner(data.block, data.owner);

			logic.events.updateLogic.send("everyone", {
				block: data.block,
				weldedTo: undefined,
			});
		});
	}
}

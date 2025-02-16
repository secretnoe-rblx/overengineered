import { Players, ReplicatedStorage } from "@rbxts/services";
import { PlayerRank } from "engine/shared/PlayerRank";

Players.PlayerAdded.Connect((player) => {
	player.CharacterAdded.Connect((character) => {
		task.wait(0.1);

		const head = character.WaitForChild("Head") as BasePart;

		const gui = ReplicatedStorage.Assets.UsernameGui.Clone();

		gui.DisplaynameLabel.Text = player.DisplayName;
		gui.UsernameLabel.Text = `@${player.Name}`;
		gui.Adornee = head;
		gui.Parent = head;
		gui.PlayerToHideFrom = player;

		if (PlayerRank.isAdmin(player)) {
			gui.RankLabel.Text = "Developer";
			task.spawn(() => {
				while (gui && gui.FindFirstChild("RankLabel")) {
					const t = 5;
					const hue = (tick() % t) / t;
					const colorrr = Color3.fromHSV(hue, 1, 1);
					gui.RankLabel.TextColor3 = colorrr;
					task.wait();
				}
			});
		}
	});
});

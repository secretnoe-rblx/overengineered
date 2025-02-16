import { TextChatService, Players } from "@rbxts/services";
import { PlayerRank } from "engine/shared/PlayerRank";

export namespace ChatController {
	export function initializeAdminPrefix() {
		TextChatService.OnIncomingMessage = function (message: TextChatMessage) {
			const props = new Instance("TextChatMessageProperties");

			if (message.TextSource) {
				const player = Players.GetPlayerByUserId(message.TextSource.UserId);

				if (player && PlayerRank.isAdmin(player)) {
					props.PrefixText =
						`<font color='#ff5555'>[${player.UserId === game.CreatorId ? "Founder" : "Developer"}]</font> ` +
						message.PrefixText;

					props.Text = `<b>` + message.Text + `</b>`;
				}

				props.Text = props.Text.gsub("plane crazy", `<font transparency="0.6">plain lazy</font>`)[0];
			}

			return props;
		};
	}
}

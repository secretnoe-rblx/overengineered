import { MessagingService } from "@rbxts/services";
import { HostedService } from "engine/shared/di/HostedService";
import { isNotAdmin_AutoBanned } from "server/BanAdminExploiter";
import { CustomRemotes } from "shared/Remotes";

export class GlobalMessageController extends HostedService {
	constructor() {
		super();

		this.event.subscribeRegistration(() =>
			MessagingService.SubscribeAsync("global_message", ({ Data: message }) => {
				const msg = message as unknown as { text: string; color: Color3; duration: number };
				CustomRemotes.admin.sendMessage.s2c.send("everyone", {
					text: msg.text,
					color: msg.color,
					duration: msg.duration,
				});
			}),
		);

		CustomRemotes.admin.sendMessage.c2s.invoked.Connect((player, { text, color, duration }) => {
			if (isNotAdmin_AutoBanned(player, "globalMessage")) {
				return;
			}

			MessagingService.PublishAsync("global_message", {
				text: text,
				color: color,
				duration: duration,
			});
		});
	}
}

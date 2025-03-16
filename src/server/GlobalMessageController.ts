import { MessagingService, RunService } from "@rbxts/services";
import { HostedService } from "engine/shared/di/HostedService";
import { isNotAdmin_AutoBanned } from "server/BanAdminExploiter";
import { CustomRemotes } from "shared/Remotes";

export class GlobalMessageController extends HostedService {
	constructor() {
		super();

		this.onEnable(() => {
			if (!RunService.IsStudio()) {
				task.spawn(() => {
					this.event.eventHandler.register(
						MessagingService.SubscribeAsync("global_message", (message) => {
							const msg = message as unknown as { text: string; color: Color3; duration: number };
							CustomRemotes.admin.sendMessage.s2c.send("everyone", {
								text: msg.text,
								color: msg.color,
								duration: msg.duration,
							});
						}),
					);
				});
			}
		});

		CustomRemotes.admin.sendMessage.c2s.invoked.Connect((player, { text, color, duration }) => {
			if (isNotAdmin_AutoBanned(player, "globalMessage")) {
				return;
			}

			task.spawn(() => {
				MessagingService.PublishAsync("global_message", {
					text: text,
					color: color,
					duration: duration,
				});
			});

			CustomRemotes.admin.sendMessage.s2c.send("everyone", { text, color, duration });
		});
	}
}

import { HostedService } from "engine/shared/di/HostedService";

export class GlobalMessageController extends HostedService {
	constructor() {
		super();

		// task.spawn(() => {
		// 	this.event.subscribeRegistration(() =>
		// 		MessagingService.SubscribeAsync("global_message", ({ Data: message }) => {
		// 			const msg = message as unknown as { text: string; color: Color3; duration: number };
		// 			CustomRemotes.admin.sendMessage.s2c.send("everyone", {
		// 				text: msg.text,
		// 				color: msg.color,
		// 				duration: msg.duration,
		// 			});
		// 		}),
		// 	);
		// });

		// task.spawn(() => {
		// 	CustomRemotes.admin.sendMessage.c2s.invoked.Connect((player, { text, color, duration }) => {
		// 		if (isNotAdmin_AutoBanned(player, "globalMessage")) {
		// 			return;
		// 		}

		// 		MessagingService.PublishAsync("global_message", {
		// 			text: text,
		// 			color: color,
		// 			duration: duration,
		// 		});
		// 	});
		// });
	}
}

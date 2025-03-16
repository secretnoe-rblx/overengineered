import { HostedService } from "engine/shared/di/HostedService";
import { Signal } from "engine/shared/event/Signal";
import type { Theme } from "client/Theme";

@injectable
export class RainbowGuiController extends HostedService {
	constructor(@inject theme: Theme) {
		super();

		return;

		this.event.subscribeRegistration(() =>
			Signal.connectionFromTask(
				task.spawn(() => {
					const colors = [theme.get("buttonActive"), theme.get("accent")];
					let h = 0;

					while (true as boolean) {
						h += 1 / 360;
						h %= 1;

						for (const color of colors) {
							color.set(Color3.fromHSV(h, 1, 1));
						}

						task.wait();
					}
				}),
			),
		);

		this.event.subscribeRegistration(() =>
			Signal.connectionFromTask(
				task.spawn(() => {
					const colors = [theme.get("buttonNormal")];
					let h = 0;

					while (true as boolean) {
						h += 1 / 360;
						h %= 1;

						for (const color of colors) {
							color.set(Color3.fromHSV(h, 1, 0.1));
						}

						task.wait();
					}
				}),
			),
		);
	}
}

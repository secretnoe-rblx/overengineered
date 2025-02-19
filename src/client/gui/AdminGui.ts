import { Players, RunService, UserInputService } from "@rbxts/services";
import { AdminMessageController } from "client/AdminMessageController";
import { TabControl } from "client/gui/controls/TabControl";
import { Interface } from "client/gui/Interface";
import { ServerRestartController } from "client/ServerRestartController";
import { TestRunner } from "client/test/TestRunner";
import { LoadSlotTest } from "client/test/visual/LoadSlotTest";
import { TextButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { InputController } from "engine/client/InputController";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { HostedService } from "engine/shared/di/HostedService";
import { Element } from "engine/shared/Element";
import { PlayerRank } from "engine/shared/PlayerRank";
import type { GameHostBuilder } from "engine/shared/GameHostBuilder";
import type { Switches } from "engine/shared/Switches";

@injectable
export class AdminGui extends HostedService {
	static initializeIfAdminOrStudio(host: GameHostBuilder) {
		const enabled =
			RunService.IsStudio() ||
			PlayerRank.isAdmin(Players.LocalPlayer) ||
			PlayerRank.isRobloxEngineer(Players.LocalPlayer);
		if (!enabled) return;

		host.services.registerService(this);
	}

	constructor(@inject di: DIContainer) {
		super();

		let destroy: (() => void) | undefined;
		const create = () => {
			const parent = new InstanceComponent(
				Element.create("ScreenGui", {
					AutoLocalize: false,
					Name: "TestScreenGui",
					Parent: Interface.getPlayerGui(),
				}),
			);

			const tabs = TabControl.create();
			parent.parent(tabs);

			const wrapNonVisual = (
				name: string,
				tests: Readonly<Record<string, (di: DIContainer, button: TextButtonControl) => void>>,
			): readonly [name: string, test: Control] => {
				const frame = Element.create(
					"Frame",
					{
						Size: new UDim2(1, 0, 1, 0),
						BackgroundTransparency: 1,
					},
					{
						list: Element.create("UIListLayout", {
							FillDirection: Enum.FillDirection.Vertical,
						}),
					},
				);
				const control = new Control(frame);

				for (const [name, test] of pairs(tests)) {
					const button = TextButtonControl.create({
						Text: name,
						AutomaticSize: Enum.AutomaticSize.XY,
						TextSize: 16,
					});
					button.activated.Connect(() => test(di, button));

					control.add(button);
				}

				return [name, control];
			};

			const closebtn = tabs.addButton();
			closebtn.text.set("Close");
			closebtn.activated.Connect(() => destroy?.());

			const tests: readonly (readonly [name: string, test: Control])[] = [
				["Load", LoadSlotTest.create(false)],
				["Load REMOTE", LoadSlotTest.create(true)],
				["Global message", AdminMessageController.createControl()],
				wrapNonVisual("Restart", {
					startMeteors: () => ServerRestartController.sendToServer(false),
					restart: () => ServerRestartController.sendToServer(true),
				}),
				wrapNonVisual("TESTS", { open: TestRunner.create }),
				wrapNonVisual(
					"Switches",
					asObject(
						asMap(di.resolve<Switches>().registered).mapToMap((k, v) =>
							$tuple(k + " " + (v.get() ? "+" : "-"), (di: DIContainer, btn: TextButtonControl) => {
								v.set(!v.get());
								btn.text.set(k + " " + (v.get() ? "+" : "-"));
							}),
						),
					),
				),
			];
			for (const [name, content] of tests) {
				content.hide();
				tabs.addTab(name, content);
			}

			parent.enable();
			destroy = () => {
				destroy = undefined;
				parent.destroy();
			};
		};

		this.event.subscribe(UserInputService.InputBegan, (input) => {
			if (input.UserInputType !== Enum.UserInputType.Keyboard) return;
			if (input.KeyCode !== Enum.KeyCode.F7) return;
			if (!InputController.isShiftPressed()) return;

			if (destroy) destroy();
			else create();
		});
	}
}

import { ContentProvider, Players, ReplicatedStorage, RunService } from "@rbxts/services";
import { AdminMessageController } from "client/AdminMessageController";
import { LoadingController } from "client/controller/LoadingController";
import { Anim } from "client/gui/Anim";
import { BSOD } from "client/gui/BSOD";
import { Interface } from "client/gui/Interface";
import { LogControl } from "client/gui/static/LogControl";
import { SandboxGame } from "client/SandboxGame";
import { ServerRestartController } from "client/ServerRestartController";
import { InputController } from "engine/client/InputController";
import { Transforms } from "engine/shared/component/Transforms";
import { Objects } from "engine/shared/fixes/Objects";
import { GameHostBuilder } from "engine/shared/GameHostBuilder";
import { TestFramework } from "engine/shared/TestFramework";
import { Colors } from "shared/Colors";
import { gameInfo } from "shared/GameInfo";
import { RemoteEvents } from "shared/RemoteEvents";
import { CustomRemotes } from "shared/Remotes";
import { BulletProjectile } from "shared/weapons/BulletProjectileLogic";
import type { TransformProps } from "engine/shared/component/Transform";

LoadingController.show("Initializing");
Interface.getGameUI<{ VERSION: TextLabel }>().VERSION.Text = `v${RunService.IsStudio() ? "studio" : game.PlaceVersion}`;

const builder = new GameHostBuilder(gameInfo);
try {
	SandboxGame.initialize(builder);
} catch (err) {
	BSOD.showWithDefaultText(err, "The game has failed to load.");
	throw err;
}

const host = builder.build();

host.run();

LoadingController.show("Loading sounds");

const allSoundIDs = ReplicatedStorage.Assets.GetDescendants().filter((value) => value.IsA("Sound"));

Objects.awaitThrow(
	new Promise<undefined>((resolve) => {
		let i = 0;
		ContentProvider.PreloadAsync(allSoundIDs, (contentId, status) => {
			i++;

			if (i === allSoundIDs.size() - 1) {
				resolve(undefined);
			}
		});
	}),
);

LoadingController.show("Loading the rest");

LogControl.instance.show();

InputController.inputType.subscribe((newInputType) =>
	LogControl.instance.addLine("New input type set to " + newInputType, Colors.yellow),
);
RemoteEvents.initialize();
AdminMessageController.initialize();
ServerRestartController.initialize();
// Atmosphere.initialize();

LoadingController.hide();
CustomRemotes.player.loaded.send();
$log("Client loaded.");

//host.services.resolveForeignClass(CenterOfMassController).enable();

//testing
if (RunService.IsStudio() && Players.LocalPlayer.Name === "samlovebutter" && (false as boolean)) {
	while (true as boolean) {
		BulletProjectile.spawn.send({
			startPosition: new Vector3(359, -16360, 330),
			baseVelocity: new Vector3(
				0 + (math.random() - 0.5) * 10,
				20 + (math.random() - 0.5) * 10,
				-(500 + (math.random() - 0.5) * 10),
			),
			baseDamage: 0,
		});
		task.wait(0.1);
	}
}
if (RunService.IsStudio() && Players.LocalPlayer.Name === "i3ymm") {
	const testsName = "StringTests";
	const testName: string | undefined = undefined;
	("delayBlockZeroImmediateTickBased");

	const testss = TestFramework.findAllTestScripts().map(TestFramework.loadTestsFromScript);
	const tests = Objects.fromEntries(
		testss
			.filter((t) => testsName in t && (!testName || testName in t[testsName]))
			.flatmap((t) => Objects.entriesArray(testName ? { [testName]: t[testsName][testName] } : t[testsName])),
	);

	TestFramework.runMultiple("BlockLogic", tests!, host.services);
}

//

task.spawn(() => {
	const d = 0.2;
	const gui = Interface.getPlayerGui<{ test_delete_later: ScreenGui & { Build: GuiObject } }>().test_delete_later
		.Build;
	const child = gui.WaitForChild("Redo") as GuiObject;
	const props: TransformProps = { duration: 0.2 };

	while (true as boolean) {
		Transforms.parallel(
			Transforms.func(() => {
				const [asc, childcopy] = Anim.createScreenForAnimating(child);
				return Transforms.create()
					.moveRelative(childcopy, new UDim2(0, 0, 0, -50), props)
					.transform(childcopy, "Transparency", 1, props)
					.then()
					.destroy(asc);
			}),
			Anim.UIListLayout.animRemove(gui, child, props, "hide"),
		).run(child);

		task.wait(d);

		Transforms.parallel(
			Transforms.func(() => {
				const [asc, childcopy] = Anim.createScreenForAnimating(child);
				return Transforms.create()
					.moveRelative(childcopy, new UDim2(0, 0, 0, -50))
					.transform(childcopy, "Transparency", 1)
					.setVisible(childcopy, true)
					.then()
					.moveRelative(childcopy, new UDim2(0, 0, 0, 50), props)
					.transform(childcopy, "Transparency", 0, props)
					.then()
					.destroy(asc);
			}),
			Anim.UIListLayout.animAdd(gui, child, props) //
				.then()
				.setVisible(child, true),
		).run(child);

		task.wait(d);
	}
});

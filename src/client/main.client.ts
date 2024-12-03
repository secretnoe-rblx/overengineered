import { ContentProvider, Players, ReplicatedStorage, RunService } from "@rbxts/services";
import { AdminMessageController } from "client/AdminMessageController";
import { LoadingController } from "client/controller/LoadingController";
import { BSOD } from "client/gui/BSOD";
import { Gui } from "client/gui/Gui";
import { LogControl } from "client/gui/static/LogControl";
import { SandboxGame } from "client/SandboxGame";
import { ServerRestartController } from "client/ServerRestartController";
import { InputController } from "engine/client/InputController";
import { Objects } from "engine/shared/fixes/Objects";
import { GameHostBuilder } from "engine/shared/GameHostBuilder";
import { TestFramework } from "engine/shared/TestFramework";
import { Colors } from "shared/Colors";
import { gameInfo } from "shared/GameInfo";
import { RemoteEvents } from "shared/RemoteEvents";
import { CustomRemotes } from "shared/Remotes";
import { SlotsMeta } from "shared/SlotsMeta";
import { LaserProjectile } from "shared/weapons/LaserProjectileLogic";
import type { PlayerDataStorage } from "client/PlayerDataStorage";

LoadingController.show("Initializing");
Gui.getGameUI<{ VERSION: TextLabel }>().VERSION.Text = `v${RunService.IsStudio() ? "studio" : game.PlaceVersion}`;

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

{
	const playerData = host.services.resolve<PlayerDataStorage>();
	if (playerData.config.get().autoLoad) {
		Objects.awaitThrow(playerData.loadPlayerSlot(SlotsMeta.quitSlotIndex, false, "Loading the autosave"));
	}
}

//host.services.resolveForeignClass(CenterOfMassController).enable();

//testing
if (RunService.IsStudio() && Players.LocalPlayer.Name === "samlovebutter") {
	//&& (false as boolean)
	/*
	while (true as boolean) {
		PlasmaProjectile.spawn.send({
			startPosition: new Vector3(359, -16360, 330),
			baseVelocity: new Vector3(
				0 + (math.random() - 0.5) * 10,
				20 + (math.random() - 0.5) * 10,
				-(500 + (math.random() - 0.5) * 10),
			),
			baseDamage: 1,
		});
		task.wait(0.1);
	}
	*/
	LaserProjectile.spawn.send({
		startPosition: new Vector3(359, -16360, 330),
		baseVelocity: new Vector3(
			0 + (math.random() - 0.5) * 10,
			20 + (math.random() - 0.5) * 10,
			-(500 + (math.random() - 0.5) * 10),
		),
		baseDamage: 160.5,
	});
}
if (RunService.IsStudio() && Players.LocalPlayer.Name === "i3ymm") {
	const testsName = "BlockTests";
	const testName: string | undefined = "testCaching";

	const testss = TestFramework.findAllTestScripts().map(TestFramework.loadTestsFromScript);
	const tests = Objects.fromEntries(
		testss
			.filter((t) => testsName in t && (!testName || testName in t[testsName]))
			.flatmap((t) => Objects.entriesArray(testName ? { [testName]: t[testsName][testName] } : t[testsName])),
	);

	TestFramework.runMultiple("BlockLogic", tests!, host.services);
}

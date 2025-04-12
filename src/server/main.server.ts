/* eslint-disable import/order */
import { TestFramework } from "engine/shared/TestFramework";
if (!game.GetService("RunService").IsStudio()) {
	for (const testscript of TestFramework.findAllTestScripts()) {
		testscript.Destroy();
	}
}

import { Secrets } from "engine/server/Secrets";

// API Secrets
Secrets.addDevelopmentSecret(
	"discord_webhook",
	"https://webhook.lewisakura.moe/api/webhooks/1197990614671822999/kTKPwZN1p9sJQYLw7L4-jO3Au2LH6ffXxtJjNoLTZljuScGTpaVr9-hgVmGoq08IcfAV/queue",
);
Secrets.addDevelopmentSecret("api_token", "literal:REDACTED_TOKEN");
Secrets.addDevelopmentSecret("logging_token", "literal:REDACTED_TOKEN");

import { Players, RunService, Workspace } from "@rbxts/services";
import { RemoteEvents } from "shared/RemoteEvents";
import { SandboxGame } from "server/SandboxGame";
import { PlasmaProjectile } from "shared/weaponProjectiles/PlasmaProjectileLogic";
import { BulletProjectile } from "shared/weaponProjectiles/BulletProjectileLogic";
import { GameHostBuilder } from "engine/shared/GameHostBuilder";
import { gameInfo } from "shared/GameInfo";
import { LaunchDataController } from "engine/server/network/LaunchDataController";
import { LaserProjectile } from "shared/weaponProjectiles/LaserProjectileLogic";
import { CreateSpawnVehicle } from "server/SpawnVehicle";
import { BlocksSerializer } from "shared/building/BlocksSerializer";
import { BuildingPlot } from "shared/building/BuildingPlot";
import { Instances } from "engine/shared/fixes/Instances";
import { BB } from "engine/shared/fixes/BB";
import { SharedMachine } from "shared/blockLogic/SharedMachine";
import { ServerPartUtils } from "server/plots/ServerPartUtils";
import { AutoPlotWelder } from "shared/building/PlotWelder";
import { Component } from "engine/shared/component/Component";

const builder = new GameHostBuilder(gameInfo);
SandboxGame.initialize(builder);

const host = builder.build();
host.run();

const initSpawnVehicle = () => {
	const component = new Component();
	component.enable();

	const vehicleSlot = BlocksSerializer.jsonToObject(CreateSpawnVehicle());

	const plotInstance = Instances.waitForChild<BasePart & { readonly Blocks: Folder }>(
		Workspace,
		"Obstacles",
		"Spawn",
		"VehiclePlot",
	);

	const plot = new BuildingPlot(
		plotInstance.Blocks,
		plotInstance.GetPivot(),
		BB.fromPart(plotInstance),
		host.services.resolve<BlockList>(),
	);
	component.parent(host.services.resolveForeignClass(AutoPlotWelder, [plot]));

	class SM extends SharedMachine {
		protected override createImpactControllerIfNeeded(): undefined {
			return undefined;
		}
	}

	BlocksSerializer.deserializeFromObject(vehicleSlot, plot, host.services.resolve<BlockList>());
	ServerPartUtils.switchDescendantsAnchor(plotInstance.Blocks, false);

	const machine = component.parent(host.services.resolveForeignClass(SM));
	machine.init(plot.getBlockDatas());
};
initSpawnVehicle();

// Initializing event workers
RemoteEvents.initialize();

// Game boot flags
LaunchDataController.initialize();

$log("Server loaded.");
Workspace.AddTag("GameLoaded");

PlasmaProjectile; // initializing the remote events
BulletProjectile;
LaserProjectile;

Players.PlayerAdded.Connect((plr) => {
	if (!RunService.IsStudio() && plr.AccountAge < 10) {
		// plr.Kick("Your account is too young, due to security reasons you must wait 10 days before you can play.");
	}
});

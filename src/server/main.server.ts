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
Secrets.addDevelopmentSecret("backend_token", "d81b0f61-7f62-4016-b5fe-8c5904c9be7d");

import { Players, RunService, Workspace } from "@rbxts/services";
import { RemoteEvents } from "shared/RemoteEvents";
import { SandboxGame } from "server/SandboxGame";
import { PlasmaProjectile } from "shared/weaponProjectiles/PlasmaProjectileLogic";
import { BulletProjectile } from "shared/weaponProjectiles/BulletProjectileLogic";
import { GameHostBuilder } from "engine/shared/GameHostBuilder";
import { gameInfo } from "shared/GameInfo";
import { LaunchDataController } from "engine/server/network/LaunchDataController";
import { LaserProjectile } from "shared/weaponProjectiles/LaserProjectileLogic";
import { GameDefinitions } from "shared/data/GameDefinitions";

const builder = new GameHostBuilder(gameInfo);
SandboxGame.initialize(builder);

const host = builder.build();
host.run();

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
	if (!RunService.IsStudio() && plr.AccountAge < 10 && !GameDefinitions.isTestPlace()) {
		plr.Kick("Your account is too young, due to security reasons you must wait 10 days before you can play.");
	}
});

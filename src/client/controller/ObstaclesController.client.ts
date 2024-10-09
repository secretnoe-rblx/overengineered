import { CollectionService, Workspace } from "@rbxts/services";
import { initKillPlane, initLavaKillPlane } from "client/controller/KillPlane";

Workspace.WaitForChild("Obstacles");

for (const lava of CollectionService.GetTagged("Lava")) {
	if (!lava.IsA("BasePart")) continue;
	initLavaKillPlane(lava);
}

for (const destroyer of CollectionService.GetTagged("Destroyer")) {
	if (!destroyer.IsA("BasePart")) continue;
	initKillPlane(destroyer);
}

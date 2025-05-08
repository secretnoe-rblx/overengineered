import { Lighting, RunService, Workspace } from "@rbxts/services";
import { LocalPlayer } from "engine/client/LocalPlayer";

export namespace Atmosphere {
	const spaceBorder = -5000;
	const atmosphere = Workspace.FindFirstChild("Atmosphere")!;
	const clouds = Workspace.Terrain.FindFirstChildOfClass("Clouds")!;
	const darknessSkyboxID = "rbxassetid://34644652";

	const normalSkyboxData = {
		SkyboxBk: Lighting.Sky.SkyboxBk,
		SkyboxDn: Lighting.Sky.SkyboxDn,
		SkyboxFt: Lighting.Sky.SkyboxFt,
		SkyboxLf: Lighting.Sky.SkyboxLf,
		SkyboxRt: Lighting.Sky.SkyboxRt,
		SkyboxUp: Lighting.Sky.SkyboxUp,
	};

	const normalAtmosphereDensity = Lighting.Atmosphere.Density;
	const normalCloudsDensity = clouds.Density;

	export function initialize() {
		const planet = Workspace.Atmosphere.Surface;
		const decals = planet.GetChildren().filter((v) => v.Name === "Decal") as Decal[];

		const planetCrownDetailLevel = 15;
		const planetCrownThickness = 0.75;
		const d = (1 - planetCrownThickness) / 15;
		const crowns: BasePart[] = planet.Crowns.GetChildren() as BasePart[];

		const len = planetCrownDetailLevel - crowns.size();
		for (let i = 0; i < len; i++) {
			const n = crowns[0].Clone();
			n.Parent = crowns[0].Parent;
			crowns.push(n);
		}

		const setPlanetScale = (size: number) => {
			planet.Size = new Vector3(2048, size * planetCrownThickness, 2048);
			for (const c of crowns) {
				c.Size = new Vector3(2048, size - size * d, 2048);
			}
		};

		const setPlanetTransparancy = (perc: number) => {
			perc = math.clamp(perc, 0, 1);
			for (const d of decals) d.Transparency = perc;
			for (const c of crowns) c.Transparency = perc * 0.2 + 0.95;
			planet.Transparency = perc;
			print(perc);
			// planet.Crown.Transparency = perc;
		};

		setPlanetScale(1);
		// Rotation animation
		RunService.Heartbeat.Connect((dT) => {
			const playerPosition = LocalPlayer.character.get()?.GetPivot().Position;
			if (!playerPosition) return;

			const height = playerPosition.Y + spaceBorder;
			if (height < 0) return (planet.Parent = undefined);

			const newPos = playerPosition.Lerp(new Vector3(0, spaceBorder, 0), 0.01).apply((v, a) => {
				if (a === "Y") return v;
				return playerPosition[a];
			});
			planet.Position = newPos;
			crowns.forEach((v) => (v.Position = newPos));
			setPlanetTransparancy(500 / height);
			planet.Parent = atmosphere;
			// const transparancy = playerPosition.Y / 5000; //(newPos.Y + GameDefinitions.HEIGHT_OFFSET) / GameDefinitions.HEIGHT_OFFSET;
			// planet.Transparency = transparancy;

			// print(planet, transparancy);
			// Position and rotation animation
			// 	planet.Surface.CFrame = new CFrame(
			// 		playerPosition?.X ?? 0,
			// 		GameDefinitions.HEIGHT_OFFSET,
			// 		playerPosition?.Z ?? 0,
			// 	).mul(planet.Surface.CFrame.Rotation);
			// 	planet.Surface.CFrame = planet.Surface.CFrame.mul(CFrame.fromEulerAnglesXYZ(0, (dT * math.pi) / 75, 0));

			// 	const darknessReachPercent = math.clamp(
			// 		((playerPosition?.Y ?? 0) - GameDefinitions.HEIGHT_OFFSET) / GameEnvironment.ZeroGravityHeight,
			// 		0,
			// 		1,
			// 	);

			// 	const zeroAirReachPercent = math.clamp(
			// 		((playerPosition?.Y ?? 0) - GameDefinitions.HEIGHT_OFFSET) / (GameEnvironment.ZeroAirHeight * 0.6),
			// 		0,
			// 		1,
			// 	);

			// 	clouds.Density = (1 - zeroAirReachPercent) * normalCloudsDensity;
			// 	Lighting.Atmosphere.Density = (1 - zeroAirReachPercent) * normalAtmosphereDensity;

			// 	// Skybox replacements
			// 	if (darknessReachPercent >= 1 && Lighting.Sky.SkyboxBk !== darknessSkyboxID) {
			// 		Lighting.Sky.SkyboxBk = darknessSkyboxID;
			// 		Lighting.Sky.SkyboxDn = darknessSkyboxID;
			// 		Lighting.Sky.SkyboxFt = darknessSkyboxID;
			// 		Lighting.Sky.SkyboxLf = darknessSkyboxID;
			// 		Lighting.Sky.SkyboxRt = darknessSkyboxID;
			// 		Lighting.Sky.SkyboxUp = darknessSkyboxID;
			// 	} else if (darknessReachPercent < 1 && Lighting.Sky.SkyboxBk !== normalSkyboxData.SkyboxBk) {
			// 		Lighting.Sky.SkyboxBk = normalSkyboxData.SkyboxBk;
			// 		Lighting.Sky.SkyboxDn = normalSkyboxData.SkyboxDn;
			// 		Lighting.Sky.SkyboxFt = normalSkyboxData.SkyboxFt;
			// 		Lighting.Sky.SkyboxLf = normalSkyboxData.SkyboxLf;
			// 		Lighting.Sky.SkyboxRt = normalSkyboxData.SkyboxRt;
			// 		Lighting.Sky.SkyboxUp = normalSkyboxData.SkyboxUp;
			// 	}
		});
	}
}

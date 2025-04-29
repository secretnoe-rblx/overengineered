import { Players, Workspace } from "@rbxts/services";
import { Component } from "engine/shared/component/Component";
import { GameDefinitions } from "shared/data/GameDefinitions";

export class DistanceHideController extends Component {
	constructor() {
		super();

		const parts = [Workspace.WaitForChild("Obstacles")];

		const transparencies = new Map<Instance & { Transparency: number }, number>();
		for (const part of parts.map((p) => [p, ...p.GetDescendants()])) {
			for (const p of part) {
				if (p.IsA("BasePart") || p.IsA("Decal") || p.IsA("Texture")) {
					transparencies.set(p, p.Transparency);
				}
			}
		}

		const maxDistance = 1024;
		let visible = true;

		this.event.loop(1, () => {
			const newVisible =
				(new Vector3(0, GameDefinitions.HEIGHT_OFFSET, 0).sub(
					Players.LocalPlayer.Character?.GetPivot().Position ?? Vector3.zero,
				).Magnitude ?? 0) < maxDistance;
			if (visible === newVisible) return;

			visible = newVisible;

			for (const [part, transparency] of transparencies) {
				part.Transparency = visible ? (transparency ?? 0) : 1;
			}
		});
	}
}

import { Debris, ReplicatedStorage } from "@rbxts/services";
import { EffectBase } from "shared/effects/EffectBase";
import type { EffectCreator } from "shared/effects/EffectBase";

type Args = {
	readonly part: BasePart;
};
@injectable
export class SparksEffect extends EffectBase<Args> {
	constructor(@inject creator: EffectCreator) {
		super(creator, "sparks_effect");
	}

	override justRun({ part }: Args): void {
		if (!part) return;

		const sparks = ReplicatedStorage.Assets.Effects.Sparks.Clone();
		sparks.Parent = part;

		// Delete effect
		Debris.AddItem(sparks, 1.5);
	}
}

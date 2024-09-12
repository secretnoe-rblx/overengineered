import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { PistonBlockLogic } from "shared/blocks/blocks/PistonBlock";

@injectable
export class PistonBlockServerLogic extends ServerBlockLogic<typeof PistonBlockLogic> {
	constructor(logic: typeof PistonBlockLogic, @inject playModeController: PlayModeController) {
		super(logic, playModeController);

		logic.events.update.invoked.Connect((player, ctx) => {
			if (!this.isValidBlock(ctx.block, player)) return;

			const bottomPart = ctx.block.FindFirstChild("Bottom") as Part | undefined;
			if (!bottomPart) return;

			const prism = bottomPart.FindFirstChild("PrismaticConstraint") as PrismaticConstraint | undefined;
			if (!prism) return;

			prism.TargetPosition = ctx.position;
			prism.ServoMaxForce = ctx.force;
			prism.Speed = ctx.speed;
		});
	}
}

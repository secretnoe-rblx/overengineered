import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { LedDisplayBlockLogic } from "shared/blocks/blocks/LedDisplayBlock";

@injectable
export class LEDDisplayServerLogic extends ServerBlockLogic<typeof LedDisplayBlockLogic> {
	constructor(logic: typeof LedDisplayBlockLogic, @inject playModeController: PlayModeController) {
		super(logic, playModeController);

		logic.events.prepare.invoked.Connect((player, { block, baseColor }) => {
			if (!this.isValidBlock(block, player)) return;

			const gui = block.WaitForChild("Screen").WaitForChild("SurfaceGui") as SurfaceGui;
			for (let x = 0; x < 8; x++) {
				for (let y = 0; y < 8; y++) {
					const frame = new Instance("Frame");
					frame.BorderMode = Enum.BorderMode.Inset;
					frame.BorderSizePixel = 0;
					frame.BackgroundColor3 = baseColor;
					frame.Name = `x${x}y${y}`;
					frame.LayoutOrder = x + y * 8;
					frame.Parent = gui;
				}
			}

			gui.Enabled = true;
		});

		logic.events.update.invoked.Connect((player, { block, changes }) => {
			if (!this.isValidBlock(block, player)) return;
			const gui = block.WaitForChild("Screen").WaitForChild("SurfaceGui");
			for (const [_, change] of changes) {
				if (!change.frame.IsDescendantOf(gui)) {
					return player?.Kick("ban forev");
				}
				change.frame.BackgroundColor3 = change.color;
			}
		});

		logic.events.fill.invoked.Connect((player, { block, color, frames }) => {
			if (!this.isValidBlock(block, player)) return;
			const gui = block.WaitForChild("Screen").WaitForChild("SurfaceGui");
			for (let y = 0; y < frames.size(); y++)
				for (let x = 0; x < frames[y].size(); x++) {
					if (!frames[x][y].IsDescendantOf(gui)) {
						return player?.Kick("ban forev");
					}

					frames[x][y].BackgroundColor3 = color;
				}
		});
	}
}

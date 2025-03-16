import { Control } from "engine/client/gui/Control";
import type { ReadonlyObservableValue } from "engine/shared/event/ObservableValue";

export type ColorVisualizerWithAlphaDefinition = GuiObject & {
	readonly UIGradient: UIGradient;
};
export class ColorVisualizerWithAlpha extends Control<ColorVisualizerWithAlphaDefinition> {
	constructor(gui: ColorVisualizerWithAlphaDefinition, color: ReadonlyObservableValue<Color4>) {
		super(gui);

		const gradient = this.gui.UIGradient;
		const originalKeypoints = gradient.Transparency.Keypoints;

		this.event.subscribeObservable(
			color,
			({ color, alpha }) => {
				this.gui.BackgroundColor3 = color;

				gradient.Transparency = new NumberSequence(
					originalKeypoints.map(
						(k) => new NumberSequenceKeypoint(k.Time, k.Value === 0 ? 0 : 1 - alpha, k.Envelope),
					),
				);
			},
			true,
		);
	}
}

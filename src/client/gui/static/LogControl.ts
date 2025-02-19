import { Control } from "engine/client/gui/Control";
import { Interface } from "engine/client/gui/Interface";
import { Transforms } from "engine/shared/component/Transforms";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { Colors } from "shared/Colors";
import type { TransformProps } from "engine/shared/component/Transform";

type LogControlDefinition = GuiObject & {
	readonly Template: GuiObject & {
		readonly TextLabel: TextLabel;
		readonly UIGradient: UIGradient;
	};
};

export class LogControl extends Control<LogControlDefinition> {
	static readonly instance = new LogControl(
		Interface.getInterface<{ Help: { Notifications: LogControlDefinition } }>().Help.Notifications,
	);

	private readonly lineTemplate;

	constructor(gui: LogControlDefinition) {
		super(gui, { showOnEnable: true });
		this.lineTemplate = this.asTemplate(gui.Template);
	}

	addLine(text: string, color: Color3 = Colors.white) {
		if (text === undefined || text.size() === 0) {
			return;
		}

		const visibleDuration = 5;

		const line = this.lineTemplate();
		line.TextLabel.Text = text;
		line.TextLabel.TextColor3 = color;
		line.UIGradient.Color = new ColorSequence(color);
		line.Parent = this.instance;

		const props: TransformProps = {
			...Transforms.quadOut02,
			duration: 0.5,
		};

		const uigTransparency = new ObservableValue<number>(line.UIGradient.Transparency.Keypoints[1].Value);
		uigTransparency.subscribe((v) => (line.UIGradient.Transparency = new NumberSequence(1, v)));

		Transforms.create() //
			.transformObservable(uigTransparency, 1, props)
			.run(uigTransparency);

		Transforms.create()
			.wait(visibleDuration)
			.then()
			.transform(line.TextLabel, "TextTransparency", 1, props)
			.then()
			.destroy(line)
			.run(line);
	}
}

import { InstanceComponent } from "shared/component/InstanceComponent";
import { ObservableValue } from "shared/event/ObservableValue";
import type { ReadonlyObservableValue } from "shared/event/ObservableValue";

const globalScale = new ObservableValue<number>(1);
export class AutoUIScaledControl extends InstanceComponent<GuiObject | ScreenGui> {
	static initializeGlobalScale(scale: ReadonlyObservableValue<number>) {
		scale.subscribe((sc) => globalScale.set(sc), true);
		globalScale.subscribe((scale) => $trace("GUI scaling set to", scale));
	}

	private readonly uiscale: UIScale;

	constructor(instance: GuiObject | ScreenGui) {
		super(instance);

		let uiscale = instance.FindFirstChild("UIScale") as UIScale | undefined;
		if (!uiscale) {
			uiscale = new Instance("UIScale");
			uiscale.Parent = instance;
		}
		this.uiscale = uiscale;

		const findScreen = (instance: Instance): ScreenGui => {
			if (instance.IsA("ScreenGui")) return instance;

			const parent = instance.Parent;
			if (!parent) throw "Could not find screeen";

			return findScreen(parent);
		};
		const screen = findScreen(instance);

		const update = () => {
			const asize = screen.AbsoluteSize;
			const mult = globalScale.get();

			uiscale.Scale = math.min((asize.Y / 1080) * mult, 9999999);
		};

		this.event.subscribeObservable(this.event.readonlyObservableFromInstanceParam(screen, "AbsoluteSize"), update);
		this.event.subscribeObservable(globalScale, update, true);
	}

	getScale() {
		return this.uiscale.Scale;
	}
}

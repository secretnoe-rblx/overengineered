import { Control } from "engine/client/gui/Control";
import { Transforms } from "engine/shared/component/Transforms";
import { Element } from "engine/shared/Element";
import { Colors } from "shared/Colors";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";
import type { UnitTests } from "engine/shared/TestFramework";

namespace TransformTests {
	export function show() {
		const newbtn = (text: string, y: number): TextButton => {
			return Element.create("TextButton", {
				Size: new UDim2(0, 200, 0, 30),
				Position: new UDim2(0, 0, 0, 30 * y),
				Text: text,
			});
		};

		const list = new Control(Element.create("Frame", { Size: new UDim2(0, 200, 1, 0), Transparency: 1 }));

		const transform = <T extends Instance>(
			component: InstanceComponent<T>,
			setup: (tr: ITransformBuilder, instance: T) => void,
		) => {
			Transforms.create()
				.setup((t) => setup(t, component.instance))
				.run(component.instance);
		};

		{
			const tweenable = newbtn("instant transparency", 0);
			const component = list.add(new Control(tweenable));
			const btn = component.add(new Control(component.instance));
			component.enable();
			btn.addButtonAction(() =>
				transform(component, (t, i) =>
					t.func(() => (tweenable.Transparency = 0)).transform(i, "Transparency", 0.9),
				),
			);
		}

		{
			const tweenable = newbtn("transparency over 1sec", 1);
			const component = list.add(new Control(tweenable));
			const btn = component.add(new Control(component.instance));
			component.enable();
			btn.addButtonAction(() =>
				transform(component, (t, i) =>
					t //
						.func(() => {
							const tr = i.Transparency;

							return Transforms.create()
								.transform(i, "Transparency", 0.9, { duration: 1 })
								.then()
								.transform(i, "Transparency", tr);
						}),
				),
			);
		}

		{
			const tweenable = newbtn("transparency over 1sec after 1sec", 2);
			const component = list.add(new Control(tweenable));
			const btn = component.add(new Control(component.instance));
			component.enable();
			btn.addButtonAction(() =>
				transform(component, (t, i) =>
					t.func(() => {
						const tr = i.Transparency;

						return Transforms.create()
							.wait(1)
							.transform(i, "Transparency", 0.9, { duration: 1 })
							.then()
							.transform(i, "Transparency", tr);
					}),
				),
			);
		}

		{
			const tweenable = newbtn("multiple", 3);
			tweenable.Position = tweenable.Position.add(
				new UDim2(0, tweenable.Size.X.Offset / 2, 0, tweenable.Size.Y.Offset / 2),
			);
			tweenable.AnchorPoint = new Vector2(0.5, 0.5);

			const component = list.add(new Control(tweenable));
			const btn = component.add(new Control(component.instance));
			component.enable();

			btn.addButtonAction(() => {
				const anim = 1 as number;
				if (anim === 0) {
					transform(component, (transform, i) =>
						transform.func(() => {
							const tr = i.Transparency;
							return Transforms.create()
								.func(() => (i.Transparency = 0))
								.wait(1)
								.transform(i, "Transparency", 0.9, { duration: 1 })
								.transform(i, "Size", new UDim2(0, 80, 0, 10), { duration: 1 })
								.then()
								.transform(i, "Transparency", 0, { duration: 1 })
								.transform(i, "Size", new UDim2(0, 100, 0, 30), { duration: 1 })
								.then()
								.transform(i, "Transparency", tr);
						}),
					);
				} else if (anim === 1) {
					transform(component, (transform, i) =>
						transform.parallel(
							Transforms.create()
								.func(() => (i.Transparency = 0))
								.func(() => {
									const { Position, Size } = i;

									return Transforms.create()
										.resizeRelative(i, new UDim2(0, -4, 0, -4), { duration: 0.05 })
										.moveRelative(i, new UDim2(0, -5, 0, 0), { duration: 0.1 })
										.then()
										.moveRelative(i, new UDim2(0, 10, 0, 0), { duration: 0.1 })
										.then()
										.moveRelative(i, new UDim2(0, -10, 0, 0), { duration: 0.1 })
										.then()
										.moveRelative(i, new UDim2(0, 10, 0, 0), { duration: 0.1 })
										.then()
										.moveRelative(i, new UDim2(0, -5, 0, 0), { duration: 0.1 })
										.resizeRelative(i, new UDim2(0, 4, 0, 4), { duration: 0.05 })
										.then()
										.transformMulti(i, { Position, Size });
								}),
							Transforms.create() //
								.repeat(4, (transform) =>
									transform
										.func(() => (i.BackgroundColor3 = Colors.red))
										.transform(i, "BackgroundColor3", Colors.green, {
											duration: 0.33,
											style: "Linear",
										})
										.then()
										.transform(i, "BackgroundColor3", Colors.blue, {
											duration: 0.33,
											style: "Linear",
										})
										.then()
										.transform(i, "BackgroundColor3", Colors.red, {
											duration: 0.34,
											style: "Linear",
										})
										.then(),
								),
						),
					);
				}
			});
		}

		{
			const tweenable = newbtn("flash color", 4);
			const component = list.add(new Control(tweenable));
			const btn = component.add(new Control(component.instance));
			component.enable();
			btn.addButtonAction(() => transform(component, (t, i) => t.flashColor(i, Colors.red)));
		}

		{
			const tweenable = newbtn("flash position", 5);
			const component = list.add(new Control(tweenable));
			const btn = component.add(new Control(component.instance));
			component.enable();
			btn.addButtonAction(() =>
				transform(component, (t, i) => t.flash(i, new UDim2(0, 200, 0, 200), "Position")),
			);
		}

		{
			const bvisible = newbtn("Visible", 6 + 1);
			const bnotvisible = newbtn("Not visible", 7 + 1);
			const binteractable = newbtn("Interactable", 8 + 1);
			const bnotinteractable = newbtn("Not interactable", 9 + 1);
			// const visual = list.add(new Control2(newbtn("Button", 10 + 1)));
			const visual = list.add(new Control(newbtn("Button", 10 + 1)));

			list.add(new Control(bvisible).withButtonAction(() => visual.setVisibleAndEnabled(true)));
			list.add(new Control(bnotvisible).withButtonAction(() => visual.setVisibleAndEnabled(false)));
			list.add(new Control(binteractable).withButtonAction(() => visual.setButtonInteractable(true)));
			list.add(new Control(bnotinteractable).withButtonAction(() => visual.setButtonInteractable(false)));
		}

		return list;
	}
}
export const _Tests: UnitTests = { TransformTests };

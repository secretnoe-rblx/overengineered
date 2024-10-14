import { Interface } from "client/gui/Interface";
import { Transforms } from "engine/shared/component/Transforms";
import { TransformService } from "engine/shared/component/TransformService";
import { Element } from "engine/shared/Element";
import type { RunningTransform, TransformProps } from "engine/shared/component/Transform";
import type { TransformSetup } from "engine/shared/component/TransformService";

export namespace Anim {
	export namespace UIListLayout {
		const transforms = new Map<GuiObject, RunningTransform>();

		/** Creates an animation of removing the child from an UIListLayout */
		export function animateRemove(
			parent: GuiObject,
			child: GuiObject,
			props: TransformProps,
			childAction: "none" | "hide" | "destroy" | "unparent" = "none",
			setup?: TransformSetup<GuiObject>,
		): RunningTransform {
			if (child.Parent !== parent) {
				throw `${child} is not a child of ${parent}`;
			}

			const listLayout = parent.FindFirstChildWhichIsA("UIListLayout");
			if (!listLayout) {
				throw `${parent} does not have a UIListLayout`;
			}
			if (listLayout.SortOrder !== Enum.SortOrder.LayoutOrder) {
				throw `${listLayout}.SortOrder is not ListLayout`;
			}

			const container = Element.create("Frame", {
				BackgroundTransparency: 1,
				LayoutOrder: child.LayoutOrder,
				Size: child.Size,
				Parent: parent,
			});
			if (childAction === "hide") {
				child.Visible = false;
			} else if (childAction === "destroy") {
				child.Destroy();
			} else if (childAction === "unparent") {
				child.Parent = undefined;
			}

			const target =
				listLayout.FillDirection === Enum.FillDirection.Horizontal
					? new UDim2(new UDim().sub(listLayout.Padding), child.Size.Y)
					: new UDim2(child.Size.X, new UDim().sub(listLayout.Padding));

			transforms.get(child)?.finish();
			transforms.delete(child);
			const transform = TransformService.run(container, (tr, instance) => {
				tr.resize(target, props)
					.then()
					.func(() => {
						container.Destroy();
						transforms.delete(child);
					});
				setup?.(tr, instance);
			});

			transforms.set(child, transform);
			return transform;
		}

		/** Creates an animation of adding the child to an UIListLayout */
		export function animateAdd(
			parent: GuiObject,
			child: GuiObject,
			props: TransformProps,
			layoutIndex?: number,
			setup?: TransformSetup<GuiObject>,
		): RunningTransform {
			const listLayout = parent.FindFirstChildWhichIsA("UIListLayout");
			if (!listLayout) {
				throw `${parent} does not have a UIListLayout`;
			}
			if (listLayout.SortOrder !== Enum.SortOrder.LayoutOrder) {
				throw `${listLayout}.SortOrder is not ListLayout`;
			}

			const source =
				listLayout.FillDirection === Enum.FillDirection.Horizontal
					? new UDim2(new UDim().sub(listLayout.Padding), child.Size.Y)
					: new UDim2(child.Size.X, new UDim().sub(listLayout.Padding));

			const container = Element.create("Frame", {
				BackgroundTransparency: 1,
				LayoutOrder: layoutIndex ?? child.LayoutOrder,
				Size: source,
				Parent: parent,
			});

			transforms.get(child)?.finish();
			transforms.delete(child);
			const transform = TransformService.run(container, (tr, instance) => {
				tr.resize(child.Size, props)
					.then()
					.func(() => {
						container.Destroy();
						transforms.delete(child);
					});
				setup?.(tr, instance);
			});

			transforms.set(child, transform);
			return transform;
		}

		/** Creates an animation of removing the child from an UIListLayout */
		export function animRemove(
			parent: GuiObject,
			child: GuiObject,
			props: TransformProps,
			childAction: "none" | "hide" | "destroy" | "unparent" = "none",
		): ITransformBuilder {
			if (child.Parent !== parent) {
				throw `${child} is not a child of ${parent}`;
			}

			const listLayout = parent.FindFirstChildWhichIsA("UIListLayout");
			if (!listLayout) {
				throw `${parent} does not have a UIListLayout`;
			}
			if (listLayout.SortOrder !== Enum.SortOrder.LayoutOrder) {
				throw `${listLayout}.SortOrder is not ListLayout`;
			}

			return Transforms.create() //
				.func(() => {
					const container = Element.create("Frame", {
						BackgroundTransparency: 1,
						LayoutOrder: child.LayoutOrder,
						Size: child.Size,
						Parent: parent,
					});

					if (childAction === "hide") {
						child.Visible = false;
					} else if (childAction === "destroy") {
						child.Destroy();
					} else if (childAction === "unparent") {
						child.Parent = undefined;
					}

					const target =
						listLayout.FillDirection === Enum.FillDirection.Horizontal
							? new UDim2(new UDim().sub(listLayout.Padding), child.Size.Y)
							: new UDim2(child.Size.X, new UDim().sub(listLayout.Padding));

					return Transforms.create() //
						.transform(container, "Size", target, props)
						.then()
						.destroy(container);
				});
		}

		/** Creates an animation of adding the child to an UIListLayout */
		export function animAdd(
			parent: GuiObject,
			child: GuiObject,
			props: TransformProps,
			layoutIndex?: number,
		): ITransformBuilder {
			const listLayout = parent.FindFirstChildWhichIsA("UIListLayout");
			if (!listLayout) {
				throw `${parent} does not have a UIListLayout`;
			}
			if (listLayout.SortOrder !== Enum.SortOrder.LayoutOrder) {
				throw `${listLayout}.SortOrder is not ListLayout`;
			}

			return Transforms.create().func(() => {
				const source =
					listLayout.FillDirection === Enum.FillDirection.Horizontal
						? new UDim2(new UDim().sub(listLayout.Padding), child.Size.Y)
						: new UDim2(child.Size.X, new UDim().sub(listLayout.Padding));

				const container = Element.create("Frame", {
					BackgroundTransparency: 1,
					LayoutOrder: layoutIndex ?? child.LayoutOrder,
					Size: source,
					Parent: parent,
				});

				return Transforms.create() //
					.resize(container, child.Size, props)
					.then()
					.destroy(container);
			});
		}
	}

	function cloneWithAbsolutePosition<T extends GuiObject>(instance: T): T {
		const clone = instance.Clone();
		clone.Position = new UDim2(0, instance.AbsolutePosition.X, 0, instance.AbsolutePosition.Y);
		clone.Size = new UDim2(0, instance.AbsoluteSize.X, 0, instance.AbsoluteSize.Y);
		clone.AnchorPoint = Vector2.zero;

		return clone;
	}

	/** Creates a GuiScreen with all the provided instances being **copied** into it, with adjusted position/size/etc */
	export function createScreenForAnimating<TChildren extends readonly GuiObject[]>(
		...children: TChildren
	): LuaTuple<[ScreenGui, ...TChildren]> {
		const clones = children.map(cloneWithAbsolutePosition) as unknown as TChildren;
		const screen = Element.create(
			"ScreenGui",
			{ Parent: Interface.getPlayerGui() },
			asObject(clones.mapToMap((child) => $tuple(child.Name, child))),
		);

		return $tuple(screen, ...clones);
	}
}

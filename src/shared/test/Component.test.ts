import { Assert } from "engine/shared/Assert";
import { Component } from "engine/shared/component/Component";
import { ComponentChildren } from "engine/shared/component/ComponentChildren";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { Element } from "engine/shared/Element";

export namespace Tests.ComponentTests {
	export function componentDestroyByInstance() {
		const part = Element.create("Part");
		const component = new InstanceComponent(part);
		component.enable();
		part.Destroy();

		Assert.isTrue(component.isDestroyed());
	}
	export function componentDestroyByParentInstance() {
		const parent = Element.create("Part", {}, { child: Element.create("Part") });
		const component = new InstanceComponent(parent.child);
		component.enable();
		parent.Destroy();

		Assert.isTrue(component.isDestroyed());
	}
	export function componentDestroyInstanceBySelf() {
		const part = Element.create("Part");
		const component = new InstanceComponent(part);
		component.enable();
		component.destroy();

		Assert.isTrue(!part.Parent);
	}

	export function children() {
		const component = new ComponentChildren();
		component.add(new Component());
		Assert.isTrue(component.getAll().size() === 1, "Should not be empty after adding");
		Assert.isTrue(!component.getAll().find((f) => f.isEnabled()), "Should not be enabled yet");

		component.enable();
		Assert.isTrue(!component.getAll().find((f) => !f.isEnabled()), "Should all be enabled (1)");

		component.add(new Component());
		Assert.isTrue(
			!component.getAll().find((f) => !f.isEnabled()),
			"Adding a component when already enabled should enable it",
		);

		component.disable();
		Assert.isTrue(!component.getAll().find((f) => f.isEnabled()), "Should all be disabled");

		component.enable();
		Assert.isTrue(!component.getAll().find((f) => !f.isEnabled()), "Should all be enabled (2)");

		component.destroy();
		Assert.isTrue(component.getAll().size() === 0, "Should be no children left after destroying");
	}
}

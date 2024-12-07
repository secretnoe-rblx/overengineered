import { LoadingController } from "client/controller/LoadingController";
import { LocalPlayer } from "engine/client/LocalPlayer";
import { Component } from "engine/shared/component/Component";
import { ComponentChild } from "engine/shared/component/ComponentChild";
import { ComponentDisabler } from "engine/shared/component/ComponentDisabler";
import { ObservableCollectionArr } from "engine/shared/event/ObservableCollection";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import type { ToolBase } from "client/tools/ToolBase";
import type { DebuggableComponent } from "engine/shared/component/Component";

class ToolInputController extends Component {
	constructor(toolController: ToolController) {
		super();

		this.event.onPrepareDesktop((eh, ih) => {
			const keycodes: readonly KeyCode[] = [
				"One",
				"Two",
				"Three",
				"Four",
				"Five",
				"Six",
				"Seven",
				"Eight",
				"Nine",
			];

			toolController.tools.get().forEach((tool, i) => {
				ih.onKeyDown(keycodes[i], () =>
					toolController.selectedTool.set(tool === toolController.selectedTool.get() ? undefined : tool),
				);
			});
		});

		const gamepadSelectTool = (isRight: boolean) => {
			if (!toolController.selectedTool.get()) {
				toolController.selectedTool.set(toolController.tools.get()[0]);
				return;
			}

			const currentIndex = toolController.tools.get().indexOf(toolController.selectedTool.get()!);
			const toolsLength = toolController.tools.get().size();
			let newIndex = isRight ? currentIndex + 1 : currentIndex - 1;

			if (newIndex >= toolsLength) {
				newIndex = 0;
			} else if (newIndex < 0) {
				newIndex = toolsLength - 1;
			}

			toolController.selectedTool.set(toolController.tools.get()[newIndex]);
		};
		this.event.onPrepareGamepad((eh, ih) => {
			ih.onKeyDown("ButtonB", () => toolController.selectedTool.set(undefined));
			ih.onKeyDown("ButtonR1", () => gamepadSelectTool(true));
			ih.onKeyDown("ButtonL1", () => gamepadSelectTool(false));
		});
	}
}

@injectable
export class ToolController extends Component {
	readonly selectedTool = new ObservableValue<ToolBase | undefined>(undefined, (value) => {
		if (!value) return value;

		if (this.enabledTools.isDisabled(value)) {
			return undefined;
		}

		return value;
	});
	readonly enabledTools: ComponentDisabler<ToolBase>;
	readonly tools = new ObservableCollectionArr<ToolBase>();

	constructor() {
		super();

		LocalPlayer.diedEvent.Connect(() => {
			this.selectedTool.set(undefined);
		});

		this.selectedTool.subscribe((tool, prev) => {
			prev?.disable();
			tool?.enable();
		});
		this.enabledTools = new ComponentDisabler<ToolBase>();
		this.enabledTools.updated.Connect(() => this.selectedTool.set(undefined));
		this.tools.subscribe(() => this.selectedTool.set(undefined));

		let prevTool: ToolBase | undefined = undefined;
		let wasSetByLoading = false;
		this.onEnable(() => (wasSetByLoading = false));

		const inputParent = this.parent(new ComponentChild<ToolInputController>());
		this.tools.subscribe(() => inputParent.set(new ToolInputController(this)), true);

		this.event.subscribeObservable(
			LoadingController.isLoading,
			(loading) => {
				if (loading) {
					wasSetByLoading = true;
					prevTool = this.selectedTool.get();
					this.selectedTool.set(undefined);
				} else if (wasSetByLoading) {
					if (prevTool && this.tools.has(prevTool)) {
						this.selectedTool.set(prevTool);
					}

					prevTool = undefined;
				}

				inputParent.get()?.setEnabled(!loading);
			},
			true,
		);
	}

	getDebugChildren(): readonly DebuggableComponent[] {
		return [...super.getDebugChildren(), ...this.tools.get()];
	}
}

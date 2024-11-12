import { LoadingController } from "client/controller/LoadingController";
import { ClientComponent } from "engine/client/component/ClientComponent";
import { LocalPlayer } from "engine/client/LocalPlayer";
import { ComponentChild } from "engine/shared/component/ComponentChild";
import { ComponentDisabler } from "engine/shared/component/ComponentDisabler";
import { ObservableCollectionArr } from "engine/shared/event/ObservableCollection";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import type { ToolBase } from "client/tools/ToolBase";

class ToolInputController extends ClientComponent {
	constructor(toolController: ToolController) {
		super();

		this.event.onPrepareDesktop(() => {
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
				this.inputHandler.onKeyDown(keycodes[i], () =>
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
		this.event.onPrepareGamepad(() => {
			this.inputHandler.onKeyDown("ButtonB", () => toolController.selectedTool.set(undefined));
			this.inputHandler.onKeyDown("ButtonR1", () => gamepadSelectTool(true));
			this.inputHandler.onKeyDown("ButtonL1", () => gamepadSelectTool(false));
		});
	}
}

@injectable
export class ToolController extends ClientComponent {
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
					this.selectedTool.set(prevTool);
					prevTool = undefined;
				}

				inputParent.get()?.setEnabled(!loading);
			},
			true,
		);
	}

	getDebugChildren(): readonly IDebuggableComponent[] {
		return [...super.getDebugChildren(), ...this.tools.get()];
	}
}

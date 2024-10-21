import { LoadingController } from "client/controller/LoadingController";
import { LogControl } from "client/gui/static/LogControl";
import { ClientComponent } from "engine/client/component/ClientComponent";
import { InputController } from "engine/client/InputController";
import { ObjectOverlayStorage } from "engine/shared/component/ObjectOverlayStorage";
import { ObservableCollectionArr } from "engine/shared/event/ObservableCollection";
import { Signal } from "engine/shared/event/Signal";

type Operation = {
	readonly description: string;
	readonly undo: () => void | Response;
	readonly redo: () => void | Response;
};

export class ActionController extends ClientComponent {
	static readonly instance = new ActionController();

	readonly state = new ObjectOverlayStorage({ canUndo: false, canRedo: false });

	readonly onUndo = new Signal<(operation: Operation) => void>();
	readonly onRedo = new Signal<(operation: Operation) => void>();
	private readonly history = new ObservableCollectionArr<Operation>();
	private readonly redoHistory = new ObservableCollectionArr<Operation>();

	constructor() {
		super();

		this.event.subscribeImmediately(this.history.changed, () => {
			this.state.get(99999).canUndo = this.history.size() !== 0 ? true : undefined;
		});
		this.event.subscribeImmediately(this.redoHistory.changed, () => {
			this.state.get(99999).canRedo = this.redoHistory.size() !== 0 ? true : undefined;
		});
		this.onEnabledStateChange((enabled) => {
			this.state.get(-999999999).canUndo = enabled ? undefined : false;
			this.state.get(-999999999).canRedo = enabled ? undefined : false;
		});

		this.event.onKeyDown("Z", () => {
			if (!this.state.getValues().canUndo) return;

			if (!InputController.isCtrlPressed()) return;
			if (LoadingController.isLoading.get()) return;
			this.undo();
		});
		this.event.onKeyDown("Y", () => {
			if (!this.state.getValues().canRedo) return;

			if (!InputController.isCtrlPressed()) return;
			if (LoadingController.isLoading.get()) return;
			this.redo();
		});
	}

	execute<TResult extends Response>(description: string, undo: () => Response, func: () => TResult): TResult {
		const result = func();
		if (result.success) {
			this.appendOperation({ description, undo, redo: func });
		}

		return result;
	}

	appendRedo(operation: Operation): void {
		this.redoHistory.push(operation);
	}
	appendOperation(operation: Operation): void {
		this.history.push(operation);
		this.redoHistory.clear();
	}

	redo(): boolean {
		if (!this.state.getValues().canRedo) return false;

		const operation = this.redoHistory.pop();
		if (!operation) return false;

		this.history.push(operation);
		const response = operation.redo();
		if (response && !response.success) {
			LogControl.instance.addLine(`Error redoing "${operation.description}": ${response.message}`);
			return true;
		}

		this.onRedo.Fire(operation);
		LogControl.instance.addLine(`Redone "${operation.description}"`);
		return true;
	}

	undo(): boolean {
		if (!this.state.getValues().canUndo) return false;

		const operation = this.history.pop();
		if (!operation) return false;

		this.redoHistory.push(operation);
		const response = operation.undo();
		if (response && !response.success) {
			LogControl.instance.addLine(`Error undoing "${operation.description}": ${response.message}`);
			return true;
		}

		this.onUndo.Fire(operation);
		LogControl.instance.addLine(`Undone "${operation.description}"`);
		return true;
	}
}

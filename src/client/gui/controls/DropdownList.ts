import { ButtonTextComponent2 } from "engine/client/gui/Button";
import { Control, Control2 } from "engine/client/gui/Control";
import { ComponentChildren } from "engine/shared/component/ComponentChildren";
import { Transforms } from "engine/shared/component/Transforms";
import { TransformService } from "engine/shared/component/TransformService";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { ArgsSignal } from "engine/shared/event/Signal";
import type { DropdownDefinition } from "client/gui/controls/Dropdown";
import type { TextButtonDefinition } from "engine/client/gui/Button";

export type DropdownListDefinition = DropdownDefinition & {
	readonly Button: TextButtonDefinition;
	readonly Content: {
		readonly Template: TextButtonDefinition;
	};
};
export class DropdownList<TValue extends string = string> extends Control<DropdownListDefinition> {
	private readonly _submitted = new ArgsSignal<[item: TValue]>();
	readonly submitted = this._submitted.asReadonly();

	readonly selectedItem = new ObservableValue<TValue | undefined>(undefined);

	private readonly itemTemplate;
	private readonly button;
	private readonly contents;
	private readonly names = new Map<TValue, string>();

	constructor(gui: DropdownListDefinition) {
		super(gui);

		this.itemTemplate = this.asTemplate(this.gui.Content.Template);

		this.button = this.add(new Control2(this.gui.Button)).withButtonAction(() => this.toggle());
		this.contents = this.parent(new ComponentChildren<Control2>().withParentInstance(this.gui.Content));

		this.event.subscribeObservable(
			this.selectedItem,
			(v) => this.button.setButtonText(v === undefined ? "" : (this.names.get(v) ?? v)),
			true,
		);
	}

	private contentsVisible = false;
	private toggle() {
		this.contentsVisible = !this.contentsVisible;

		let height = this.button.instance.Size.Y.Offset;
		for (const button of this.contents.getAll()) {
			TransformService.run(button.instance, (tr) =>
				tr
					.func(() => {
						if (!this.contentsVisible) {
							button.instance.Interactable = false;
						}
					})
					.moveY(
						button.instance,
						new UDim(0, this.contentsVisible ? height : 0),
						Transforms.commonProps.quadOut02,
					)
					.then()
					.func(() => {
						if (this.contentsVisible) {
							button.instance.Interactable = true;
						}
					}),
			);

			height += button.instance.Size.Y.Offset;
		}
	}

	addItem(name: TValue, text?: string): Control2 {
		const btn = new Control2(this.itemTemplate());

		btn.addButtonAction(() => {
			this._submitted.Fire(name);
			this.selectedItem.set(name);
			this.toggle();
		});

		if (text !== undefined) {
			this.names.set(name, text);
		}

		btn.getComponent(ButtonTextComponent2).text.set(text ?? name);
		btn.instance.Interactable = false;
		this.contents.add(btn);

		return btn;
	}
}

import { KeyOrStringChooserControl } from "client/gui/controls/KeyChooserControl";
import { NumberTextBoxControl } from "client/gui/controls/NumberTextBoxControl";
import { ButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { PartialControl } from "engine/client/gui/PartialControl";
import { ComponentChildren } from "engine/shared/component/ComponentChildren";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { ArgsSignal } from "engine/shared/event/Signal";
import { SubmittableValue } from "engine/shared/event/SubmittableValue";
import type { KeyChooserControlDefinition } from "client/gui/controls/KeyChooserControl";
import type { NumberTextBoxControlDefinition } from "client/gui/controls/NumberTextBoxControl";

// eslint-disable-next-line prettier/prettier
const keysToChoose: readonly KeyCode[] = [ "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z" ];
const generateKey = (existing: readonly Pick<MultiKeyPart, "key">[]): string | KeyCode | undefined => {
	for (const key of keysToChoose) {
		if (existing.any((existing) => existing.key === key)) {
			continue;
		}

		return key;
	}

	return undefined;
};

export type MultiKeyPart = {
	readonly key: string | KeyCode;
	readonly value: number;
};

type MultiKeyPartControlDefinition = GuiObject & {
	readonly Number: NumberTextBoxControlDefinition;
	readonly Button: KeyChooserControlDefinition;
	readonly DeleteButton: GuiButton;
};
class MultiKeyPartControl extends Control<MultiKeyPartControlDefinition> {
	private readonly _deleted = new ArgsSignal();
	readonly deleted = this._deleted.asReadonly();

	readonly value;

	constructor(
		gui: MultiKeyPartControlDefinition,
		key: string | KeyCode,
		num: number,
		min: number | undefined,
		max: number | undefined,
	) {
		super(gui);

		const value = new SubmittableValue(new ObservableValue<MultiKeyPart>({ key, value: num }));
		this.value = value.asHalfReadonly();

		const keyChooser = this.parent(new KeyOrStringChooserControl(gui.Button));
		keyChooser.submitted.Connect((key) => value.submit({ ...value.get(), key }));

		const numbertb = this.parent(new NumberTextBoxControl(gui.Number, min, max));
		numbertb.submitted.Connect((num) => value.submit({ ...value.get(), value: num }));

		this.event.subscribeObservable(
			value.value,
			({ key, value }) => {
				keyChooser.value.set(key);
				numbertb.value.set(value);
			},
			true,
		);

		const delButton = this.parent(new Control(gui.DeleteButton));
		this.parent(new ButtonControl(delButton.instance, () => this._deleted.Fire()));
		delButton.setTooltipText("Remove the key from the list");
	}
}

export type MultiKeyNumberControlParts = {
	readonly Template: MultiKeyPartControlDefinition;
	readonly AddButton: GuiButton;
	readonly NoKeysLabel: GuiButton;
};
export class MultiKeyNumberControl2 extends PartialControl<MultiKeyNumberControlParts> {
	private readonly _v = new SubmittableValue(new ObservableValue<readonly MultiKeyPart[]>([]));
	readonly v = this._v.asHalfReadonly();

	constructor(
		gui: GuiObject,
		defaultValue: number,
		numberMin: number | undefined,
		numberMax: number | undefined,
		parts?: Partial<MultiKeyNumberControlParts>,
	) {
		super(gui, parts);

		const template = this.asTemplate(this.parts.Template, true);
		const children = this.parent(new ComponentChildren<MultiKeyPartControl>().withParentInstance(gui));

		const updateNoKeysLabel = () => {
			this.parts.NoKeysLabel.Visible = children.getAll().size() === 0;
		};

		const submit = () => {
			updateNoKeysLabel();
			this._v.submit(children.getAll().map((c) => c.value.get()));
		};

		const add = (key?: string | KeyCode, value?: number) => {
			key ??= generateKey(this.v.get());
			if (!key) return;

			value ??= defaultValue;

			const control = new MultiKeyPartControl(template(), key, value, numberMin, numberMax);
			children.add(control);

			control.value.submitted.Connect(({ key }, { key: prevKey }) => {
				const same = children.getAll().filter((c) => c !== control && c.value.get().key === key);
				if (same.size() === 1) {
					const otherControl = same[0];
					otherControl.value.set({ ...otherControl.value.get(), key: prevKey });
				} else if (same.size() > 1) {
					// impossible situation, just stop from changing
					control.value.set({ ...control.value.get(), key: prevKey });
					return;
				}

				submit();
			});
			control.deleted.Connect(() => remove(control));
		};
		const remove = (control: MultiKeyPartControl) => {
			children.remove(control);
			submit();
		};

		this.parent(
			new ButtonControl(this.parts.AddButton, () => {
				add();
				submit();
			}),
		);

		this._v.value.subscribe((parts) => {
			children.clear();

			for (const { key, value } of parts) {
				add(key, value);
			}

			updateNoKeysLabel();
		});
	}
}

import { Control } from "client/gui/Control";
import { ButtonControl } from "client/gui/controls/Button";
import { KeyOrStringChooserControl } from "client/gui/controls/KeyOrStringChooserControl";
import { NumberTextBoxControl } from "client/gui/controls/NumberTextBoxControl";
import { Tooltip } from "client/gui/controls/Tooltip";
import { ComponentChildren } from "shared/component/ComponentChildren";
import { ObservableValue } from "shared/event/ObservableValue";
import { ArgsSignal } from "shared/event/Signal";
import { SubmittableValue } from "shared/event/SubmittableValue";
import type { KeyOrStringChooserControlDefinition } from "client/gui/controls/KeyOrStringChooserControl";
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
	readonly Button: Frame & { Button: KeyOrStringChooserControlDefinition };
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

		const keyChooser = this.add(new KeyOrStringChooserControl(gui.Button.Button));
		keyChooser.submitted.Connect((key) => value.submit({ ...value.get(), key }));

		const numbertb = this.add(new NumberTextBoxControl(gui.Number, min, max));
		numbertb.submitted.Connect((num) => value.submit({ ...value.get(), value: num }));

		this.event.subscribeObservable(
			value.value,
			({ key, value }) => {
				keyChooser.value.set(key);
				numbertb.value.set(value);
			},
			true,
		);

		const delButton = this.add(new ButtonControl(gui.DeleteButton, () => this._deleted.Fire()));
		Tooltip.init(delButton, "Remove the key from the list");
	}
}

export type MultiKeyNumberControlDefinition = GuiObject & {
	readonly Template: GuiObject & {
		readonly Number: NumberTextBoxControlDefinition;
		readonly Button: Frame & { Button: KeyOrStringChooserControlDefinition };
		readonly DeleteButton: GuiButton;
	};
	readonly Add: GuiObject & {
		readonly Button: GuiButton;
	};
};
export class MultiKeyNumberControl extends Control<MultiKeyNumberControlDefinition> {
	private readonly _submitted = new ArgsSignal<[value: readonly MultiKeyPart[]]>();
	readonly submitted = this._submitted.asReadonly();

	constructor(
		gui: MultiKeyNumberControlDefinition,
		config: readonly MultiKeyPart[],
		defaultValue: number,
		numberMin: number | undefined,
		numberMax: number | undefined,
	) {
		super(gui);

		const template = this.asTemplate(gui.Template, true);

		const children = new ComponentChildren<MultiKeyPartControl>(this);
		children.onAdded.Connect((control) => (control.instance.Parent = this.instance));

		const submit = () => {
			const values = children.getAll().map((c) => c.value.get());

			config = values;
			this._submitted.Fire(values);
		};

		const add = (key?: string | KeyCode, value?: number) => {
			key ??= generateKey(config);
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

		for (const { key, value } of config) {
			add(key, value);
		}

		this.add(
			new ButtonControl(gui.Add.Button, () => {
				add();
				submit();
			}),
		);
	}
}

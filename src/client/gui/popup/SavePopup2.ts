import { ButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { Interface } from "engine/client/gui/Interface";
import { TextBoxControl } from "engine/client/gui/TextBoxControl";
import { ComponentKeyedChildren } from "engine/shared/component/ComponentKeyedChildren";
import { Observables } from "engine/shared/event/Observables";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { Serializer } from "shared/Serializer";
import { SlotsMeta } from "shared/SlotsMeta";
import type { PlayerDataStorage } from "client/PlayerDataStorage";
import type { Theme } from "client/Theme";
import type { ReadonlyObservableValue } from "engine/shared/event/ObservableValue";

type SlotRecordDefinition = GuiButton & {
	readonly ImageLabel: ImageLabel;
	readonly Data: GuiObject & {
		readonly Title: TextLabel;
		readonly Date: GuiObject & {
			readonly TextLabel: TextLabel;
		};
	};
};
class SaveItem extends Control<SlotRecordDefinition> {
	constructor(
		gui: SlotRecordDefinition,
		current: ObservableValue<ObservableValue<SlotMeta> | undefined>,
		readonly meta: ObservableValue<SlotMeta>,
	) {
		super(gui);

		const index = meta.get().index;
		this.addButtonAction(() => current.set(meta));

		this.onInject((di) => {
			const theme = di.resolve<Theme>();

			this.event.subscribeObservable(
				current,
				(current) => {
					this.valuesComponent()
						.get("BackgroundColor3")
						.overlay("bg", theme.get(current === meta ? "buttonActive" : "backgroundSecondary"));
				},
				true,
			);
		});

		this.event.subscribeObservable(
			meta,
			(meta) => {
				gui.Data.Title.Text = meta.name;
				gui.ImageLabel.ImageColor3 = Serializer.Color3Serializer.deserialize(meta.color);
			},
			true,
		);

		const secondsToText = (seconds: number): string => {
			const intervals = [
				{ label: "year", seconds: 31536000 },
				{ label: "month", seconds: 2592000 },
				{ label: "day", seconds: 86400 },
				{ label: "hour", seconds: 3600 },
				{ label: "minute", seconds: 60 },
				{ label: "second", seconds: 1 },
			];

			for (const interval of intervals) {
				const count = math.floor(seconds / interval.seconds);
				if (count >= 1) {
					return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`;
				}
			}

			return "just now";
		};
		const updateTime = () => {
			const m = meta.get();
			if (!m.saveTime) {
				gui.Data.Date.TextLabel.Text = "never";
				return;
			}

			const sec = (DateTime.now().UnixTimestampMillis - m.saveTime) / 1000;
			gui.Data.Date.TextLabel.Text = secondsToText(sec);
		};
		this.event.loop(1, updateTime);
		this.onEnable(updateTime);
	}
}

export type SaveBottomDefinition = GuiObject & {
	readonly Head: GuiObject & {
		readonly Frame: GuiObject & {
			readonly BlockCount: GuiObject & {
				readonly TextLabel: TextLabel;
			};
			readonly SlotName: GuiObject & {
				readonly SlotNameTextBox: TextBox;
			};
		};
		readonly ImageLabel: ImageLabel;
		readonly Delete: GuiButton;
	};
	readonly Colors: GuiObject;
};
export class SaveBottom extends Control<SaveBottomDefinition> {
	constructor(gui: SaveBottomDefinition, current: ReadonlyObservableValue<ObservableValue<SlotMeta> | undefined>) {
		super(gui);

		const setCurrent = (func: (meta: SlotMeta) => SlotMeta) => {
			const meta = current.get();
			if (!meta) return;

			meta.set(func(meta.get()));
		};

		this.parent(new Control(gui.Head.Delete)) //
			.addButtonAction(() => {
				const slot = current.get();
				if (!slot) return;

				// TODO:
			});

		const name = this.parent(new TextBoxControl(gui.Head.Frame.SlotName.SlotNameTextBox));
		this.event.subscribe(name.submitted, (name) => {
			setCurrent((meta) => ({ ...meta, name }));
			// TODO:
		});

		for (const instance of gui.Colors.GetChildren()) {
			if (!instance.IsA("GuiButton")) continue;

			const btn = this.parent(new Control(instance));
			const color = btn.instance.BackgroundColor3;

			btn.addButtonAction(() => {
				setCurrent((meta) => ({ ...meta, color: Serializer.Color3Serializer.serialize(color) }));
				// TODO:
			});
		}

		let sub: SignalConnection | undefined;
		this.onDestroy(() => sub?.Disconnect());

		this.event.subscribeObservable(
			current,
			(current) => {
				if (!current) {
					gui.Visible = false;
					return;
				}

				gui.Visible = true;
				sub?.Disconnect();

				sub = current.subscribe((meta) => {
					name.text.set(meta.name);
					gui.Head.Frame.BlockCount.TextLabel.Text = `${meta.blocks} blocks`;
					gui.Head.ImageLabel.ImageColor3 = Serializer.Color3Serializer.deserialize(meta.color);
				}, true);
			},
			true,
		);
	}
}

type SaveSlotsDefinition = ScrollingFrame & {
	readonly NewSlotButton: GuiButton;
	readonly SlotTemplate: SlotRecordDefinition;
};
class SaveSlots extends Control<SaveSlotsDefinition> {
	readonly current;

	constructor(gui: SaveSlotsDefinition, playerData: PlayerDataStorage) {
		super(gui);

		const current = new ObservableValue<ObservableValue<SlotMeta> | undefined>(undefined);
		this.current = current;

		const template = this.asTemplate(gui.SlotTemplate, true);

		const children = this.parent(new ComponentKeyedChildren<number, SaveItem>(true)) //
			.withParentInstance(gui);

		const slots = new ObservableValue<{ readonly [k in number]: SlotMeta }>({});
		this.event.subscribeObservable(playerData.slots, (s) => slots.set(SlotsMeta.toTable(s)), true);

		this.event.subscribeObservable(
			slots,
			(slotList) => {
				const sorted = asMap(slotList)
					.toArray()
					.sort((l, r) => l[0] < r[0]);

				for (const [index, slot] of sorted) {
					if (slot.blocks === 0) continue;
					if (children.get(index)) continue;

					const ov = Observables.createObservableFromObjectProperty<SlotMeta | undefined>(slots, [index]);
					const ov2 = new ObservableValue<SlotMeta>(ov.get()!);

					const item = children.add(index, new SaveItem(template(), current, ov2));
					item.event.addObservable(ov);

					ov.subscribe((c) => {
						if (!c) {
							children.remove(index);
							return;
						}

						ov2.set(c);
					});
				}

				for (const [index] of [...children.getAll()]) {
					if (index in slotList) continue;
					children.remove(index);
				}
			},
			true,
		);
	}
}

export type SlotsPopupDefinition = GuiObject & {
	readonly Heading: Frame & {
		readonly CloseButton: TextButton;
	};
	readonly Content: GuiObject & {
		readonly Bottom: SaveBottomDefinition;
		readonly List: GuiObject & {
			readonly ScrollingFrame: SaveSlotsDefinition;
		};
		readonly SearchTextBox: TextBox;
	};
};

const template = Interface.getInterface<{ Popups: { Crossplatform: { Slots2: SlotsPopupDefinition } } }>().Popups
	.Crossplatform.Slots2;
template.Visible = false;

@injectable
export class SavePopup2 extends Control<SlotsPopupDefinition> {
	constructor(@inject playerData: PlayerDataStorage) {
		const gui = template.Clone();
		super(gui);

		const slots = this.parent(new SaveSlots(gui.Content.List.ScrollingFrame, playerData));
		this.parent(new SaveBottom(gui.Content.Bottom, slots.current));

		this.parent(new ButtonControl(gui.Heading.CloseButton, () => this.hide()));

		const search = this.parent(new TextBoxControl(gui.Content.SearchTextBox));
		// this.event.subscribeObservable(search.text, (text) => slots.search.set(text), true);
	}
}

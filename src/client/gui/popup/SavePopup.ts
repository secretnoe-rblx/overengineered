import { ConfirmPopup } from "client/gui/popup/ConfirmPopup";
import { Action } from "engine/client/Action";
import { ButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { Interface } from "engine/client/gui/Interface";
import { PartialControl } from "engine/client/gui/PartialControl";
import { TextBoxControl } from "engine/client/gui/TextBoxControl";
import { ComponentKeyedChildren } from "engine/shared/component/ComponentKeyedChildren";
import { Transforms } from "engine/shared/component/Transforms";
import { Observables } from "engine/shared/event/Observables";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { Colors } from "shared/Colors";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { Serializer } from "shared/Serializer";
import { SlotsMeta } from "shared/SlotsMeta";
import type { PopupController } from "client/gui/PopupController";
import type { PlayerDataStorage } from "client/PlayerDataStorage";
import type { Theme } from "client/Theme";
import type { ReadonlyObservableValue } from "engine/shared/event/ObservableValue";

interface SlotMetaLike {
	readonly index: number;
	readonly name: string;
	readonly color: SerializedColor;
	readonly blocks: number;
}

interface CurrentItem {
	readonly meta: ReadonlyObservableValue<SlotMetaLike>;

	readonly save: Action;
	readonly load: Action;
	readonly delete: Action;

	readonly setColor: Action<[color: Color3]>;
	readonly setName: Action<[name: string]>;
}

const findFreeSlot = (slots: { readonly [x: number]: SlotMeta }) => {
	for (let i = 0; i < GameDefinitions.FREE_SLOTS; i++) {
		if (!(i in slots)) {
			return i;
		}
	}
};

const isWritable = (meta: SlotMetaLike) => {
	if (SlotsMeta.isTestSlot(meta.index)) return false;
	if (SlotsMeta.isReadonly(meta.index)) return false;

	return true;
};

type SaveItemParts = {
	readonly IconImage: ImageLabel;
	readonly Title: TextLabel;
	readonly DateText: TextLabel;
	readonly IdText: TextLabel;
};
type SaveItemDefinition = GuiButton;
class SaveItem extends PartialControl<SaveItemParts, SaveItemDefinition> implements CurrentItem {
	readonly save: Action;
	readonly load: Action;
	readonly delete: Action;
	readonly setColor: Action<[color: Color3]>;
	readonly setName: Action<[name: string]>;
	readonly meta: ObservableValue<SlotMeta>;

	constructor(
		gui: SaveItemDefinition,
		current: ObservableValue<CurrentItem | undefined>,
		meta: ObservableValue<SlotMeta>,
	) {
		super(gui);
		this.meta = meta;

		this.save = this.parent(new Action()) //
			.subCanExecuteFrom({ can: this.event.addObservable(meta.fReadonlyCreateBased(isWritable)) });
		this.load = this.parent(new Action());
		this.delete = this.parent(new Action()) //
			.subCanExecuteFrom({
				can: this.event.addObservable(
					meta.fReadonlyCreateBased((c) => isWritable(c) || SlotsMeta.isTestSlot(c.index)),
				),
			});
		this.setColor = this.parent(new Action<[Color3]>()) //
			.subCanExecuteFrom({ can: this.event.addObservable(meta.fReadonlyCreateBased(isWritable)) });
		this.setName = this.parent(new Action<[string]>()) //
			.subCanExecuteFrom({ can: this.event.addObservable(meta.fReadonlyCreateBased(isWritable)) });

		this.$onInjectAuto((popup: SavePopup, popupController: PopupController, playerData: PlayerDataStorage) => {
			this.load.subscribe(() => {
				popup.destroy();

				const slot = meta.get();
				playerData.loadPlayerSlot(slot.index);
			});

			this.save.subscribe(() => {
				const slot = meta.get();

				popupController.showPopup(
					new ConfirmPopup("Save this slot?", "YOU WILL REGRET THIS", () => {
						playerData.sendPlayerSlot({
							index: slot.index,
							save: true,
							color: slot.color,
							name: slot.name,
						});
					}),
				);
			});

			this.setColor.subscribe((color) => {
				const slot = meta.get();
				playerData.sendPlayerSlot({
					index: slot.index,
					save: true,
					color: Serializer.Color3Serializer.serialize(color),
				});
			});
			this.setName.subscribe((name) => {
				const slot = meta.get();
				playerData.sendPlayerSlot({
					index: slot.index,
					save: true,
					name,
				});
			});

			this.delete.subscribe(() => {
				const slot = meta.get();

				popupController.showPopup(
					new ConfirmPopup("<b>DELETE</b> this slot?", "THERE WILL BE CONSEQUENCES", () => {
						playerData.deletePlayerSlot({ index: slot.index });
					}),
				);
			});
		});

		//

		this.addButtonAction(() => current.set(this));

		this.$onInjectAuto((theme: Theme) => {
			this.event.subscribeObservable(
				current,
				(current) => {
					this.valuesComponent()
						.get("BackgroundColor3")
						.overlay("bg", theme.get(current === this ? "buttonActive" : "backgroundSecondary"));
				},
				true,
			);
		});

		this.event.subscribeObservable(
			meta,
			(meta) => {
				this.parts.IdText.Text = tostring(meta.index);
				this.parts.Title.Text = meta.name;
				this.parts.Title.Text = meta.name;
				this.parts.IconImage.ImageColor3 = Serializer.Color3Serializer.deserialize(meta.color);
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
				this.parts.DateText.Text = "long ago";
				return;
			}

			const sec = (DateTime.now().UnixTimestampMillis - m.saveTime) / 1000;
			this.parts.DateText.Text = secondsToText(sec);
		};
		this.event.loop(1, updateTime);
		this.onEnable(updateTime);
	}
}

class NewSaveItem extends Control<GuiButton> implements CurrentItem {
	readonly meta: ReadonlyObservableValue<SlotMetaLike>;
	readonly save: Action;
	readonly load: Action;
	readonly delete: Action;
	readonly setColor: Action<[color: Color3]>;
	readonly setName: Action<[name: string]>;

	constructor(gui: GuiButton, current: ObservableValue<CurrentItem | undefined>, playerData: PlayerDataStorage) {
		super(gui);

		this.save = this.parent(new Action());
		this.load = this.parent(new Action()) //
			.subCanExecuteFrom({ can: new ObservableValue(false) });
		this.delete = this.parent(new Action()) //
			.subCanExecuteFrom({ can: new ObservableValue(false) });
		this.setColor = this.parent(new Action<[Color3]>());
		this.setName = this.parent(new Action<[string]>());

		this.save.subscribe(() => {
			const slot = this.meta.get();
			playerData.sendPlayerSlot({
				index: slot.index,
				save: true,
				color: slot.color,
				name: slot.name,
			});
		});
		this.setColor.subscribe((color) => {
			meta.set({ ...meta.get(), color: Serializer.Color3Serializer.serialize(color) });
		});
		this.setName.subscribe((name) => {
			meta.set({ ...meta.get(), name });
		});

		this.$onInjectAuto((theme: Theme) => {
			this.event.subscribeObservable(
				current,
				(current) => {
					this.valuesComponent()
						.get("BackgroundColor3")
						.overlay("bg", theme.get(current === this ? "buttonActive" : "backgroundSecondaryLight"));
				},
				true,
			);
		});

		const newMeta = (index: number): SlotMetaLike => ({
			index,
			name: `New Slot ${index}`,
			blocks: 0,
			color: Serializer.Color3Serializer.serialize(new Color3(math.random(), math.random(), math.random())),
		});

		const meta = new ObservableValue<SlotMetaLike>(newMeta(0));
		this.meta = meta;

		this.addButtonAction(() => {
			const index = findFreeSlot(playerData.slots.get());
			if (!index) {
				Transforms.create() //
					.flashColor(this.instance, Colors.red)
					.run(this);

				return;
			}

			meta.set(newMeta(index));
			current.set(this);
		});
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
	constructor(gui: SaveBottomDefinition, current: ReadonlyObservableValue<CurrentItem | undefined>) {
		super(gui);

		const deleteAction = this.parent(new Action()) //
			.subscribeActionObservable(this.event.addObservable(current.fReadonlyCreateBased((c) => c?.delete)));
		this.parent(new Control(gui.Head.Delete)) //
			.subscribeToAction(deleteAction);

		const name = this.parent(new TextBoxControl(gui.Head.Frame.SlotName.SlotNameTextBox));
		this.event.subscribe(name.submitted, (name) => current.get()?.setName.execute(name));

		this.event.subscribeObservable(
			current,
			(c) => {
				if (!c) return;

				gui.Head.Frame.SlotName.SlotNameTextBox.TextEditable = c.setName.canExecute.get();

				const canChangeColor = c.setColor.canExecute.get();
				gui.Colors.Interactable = canChangeColor;

				for (const instance of gui.Colors.GetChildren()) {
					if (!instance.IsA("GuiButton")) continue;
					instance.BackgroundTransparency = canChangeColor ? 0 : 0.5;
				}
			},
			true,
		);

		for (const instance of gui.Colors.GetChildren()) {
			if (!instance.IsA("GuiButton")) continue;

			this.parent(new Control(instance)) //
				.addButtonAction(() => current.get()?.setColor.execute(instance.BackgroundColor3));
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

				sub = current.meta.subscribe((meta) => {
					name.text.set(meta.name);
					gui.Head.Frame.BlockCount.TextLabel.Text = meta.blocks === 1 ? "1 block" : `${meta.blocks} blocks`;
					gui.Head.ImageLabel.ImageColor3 = Serializer.Color3Serializer.deserialize(meta.color);
				}, true);
			},
			true,
		);
	}
}

type SaveSlotsDefinition = ScrollingFrame & {
	readonly NewSlotButton: GuiButton;
	readonly SlotTemplate: SaveItemDefinition;
};
class SaveSlots extends Control<SaveSlotsDefinition> {
	readonly search = new ObservableValue<string>("");
	readonly current;

	constructor(gui: SaveSlotsDefinition, playerData: PlayerDataStorage) {
		super(gui);

		const current = new ObservableValue<CurrentItem | undefined>(undefined);
		this.current = current;

		this.parent(new NewSaveItem(gui.NewSlotButton, current, playerData));

		const template = this.asTemplate(gui.SlotTemplate, true);

		const children = this.parent(new ComponentKeyedChildren<number, SaveItem>(true)) //
			.withParentInstance(gui);

		const setItemVisibililtyBySearch = (item: SaveItem) => {
			const has = item.meta.get().name.find(this.search.get())[0] !== undefined;
			item.setVisibleAndEnabled(has);
		};
		this.event.subscribeObservable(
			this.search,
			() => {
				for (const [, child] of children.getAll()) {
					setItemVisibililtyBySearch(child);
				}
			},
			true,
		);

		this.event.subscribeObservable(
			playerData.slots,
			(slotList) => {
				for (const [index] of pairs(slotList)) {
					if (children.get(index)) continue;

					const ov = Observables.createObservableFromObjectPropertyTyped(playerData.slots, [index]);
					const ov2 = new ObservableValue<SlotMeta>(ov.get()!);

					const item = children.add(index, new SaveItem(template(), current, ov2));
					item.instance.LayoutOrder = index;
					setItemVisibililtyBySearch(item);
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

const template = Interface.getInterface<{
	Popups: { Crossplatform: { Slots: GuiObject } };
}>().Popups.Crossplatform.Slots;
template.Visible = false;

type SlotsPopupParts = {
	readonly CloseButton: TextButton;
	readonly SearchTextBox: TextBox;

	readonly Bottom: SaveBottomDefinition;
	readonly SlotList: SaveSlotsDefinition;

	readonly SaveButton: GuiButton;
	readonly LoadButton: GuiButton;
};

export class SavePopup extends PartialControl<SlotsPopupParts> {
	constructor() {
		super(template.Clone());

		this.$onInjectAuto((playerData: PlayerDataStorage) => {
			this.parent(new ButtonControl(this.parts.CloseButton, () => this.hide()));

			const slots = this.parent(new SaveSlots(this.parts.SlotList, playerData));
			this.parent(new SaveBottom(this.parts.Bottom, slots.current));

			const search = this.parent(new TextBoxControl(this.parts.SearchTextBox));
			this.event.subscribeObservable(search.text, (text) => slots.search.set(text), true);

			const saveAction = this.parent(new Action()) //
				.subscribeActionObservable(
					this.event.addObservable(slots.current.fReadonlyCreateBased((c) => c?.save)),
				);
			const loadAction = this.parent(new Action()) //
				.subscribeActionObservable(
					this.event.addObservable(slots.current.fReadonlyCreateBased((c) => c?.load)),
				);

			this.parent(new Control(this.parts.SaveButton)) //
				.subscribeToAction(saveAction);
			this.parent(new Control(this.parts.LoadButton)) //
				.subscribeToAction(loadAction);
		});
	}
}

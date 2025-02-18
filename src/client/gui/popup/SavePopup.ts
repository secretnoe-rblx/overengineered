import { ConfirmPopup2 } from "client/gui/popup/ConfirmPopup";
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
import type { PopupController } from "client/gui/PopupController";
import type { PlayerDataStorage } from "client/PlayerDataStorage";
import type { Theme } from "client/Theme";
import type { ReadonlyObservableValue } from "engine/shared/event/ObservableValue";

type SlotRecordParts = {
	readonly IconImage: ImageLabel;
	readonly Title: TextLabel;
	readonly DateText: TextLabel;
	readonly IdText: TextLabel;
};
type SlotRecordDefinition = GuiButton;
class SaveItem extends PartialControl<SlotRecordParts, SlotRecordDefinition> {
	constructor(
		gui: SlotRecordDefinition,
		current: ObservableValue<ObservableValue<SlotMeta> | undefined>,
		readonly meta: ObservableValue<SlotMeta>,
	) {
		super(gui);

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
@injectable
export class SaveBottom extends Control<SaveBottomDefinition> {
	constructor(
		gui: SaveBottomDefinition,
		current: ReadonlyObservableValue<ObservableValue<SlotMeta> | undefined>,
		@inject playerData: PlayerDataStorage,
		@inject popupController: PopupController,
	) {
		super(gui);

		this.parent(new Control(gui.Head.Delete)) //
			.addButtonAction(() => {
				const slot = current.get();
				if (!slot) return;

				popupController.createAndShow(ConfirmPopup2, "DELETE this slot?", "THERE WILL BE CONSEQUENCES", () => {
					playerData.deletePlayerSlot({ index: slot.get().index });
				});
			});

		const name = this.parent(new TextBoxControl(gui.Head.Frame.SlotName.SlotNameTextBox));
		this.event.subscribe(name.submitted, (name) => {
			const slot = current.get();
			if (!slot) return;

			const meta = slot.get();
			playerData.sendPlayerSlot({
				index: meta.index,
				save: false,
				name,
			});
		});

		for (const instance of gui.Colors.GetChildren()) {
			if (!instance.IsA("GuiButton")) continue;

			const btn = this.parent(new Control(instance));
			const color = btn.instance.BackgroundColor3;

			btn.addButtonAction(() => {
				const slot = current.get();
				if (!slot) return;

				const meta = slot.get();
				playerData.sendPlayerSlot({
					index: meta.index,
					save: false,
					color: Serializer.Color3Serializer.serialize(color),
				});
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
	readonly SlotTemplate: SlotRecordDefinition;
};
class SaveSlots extends Control<SaveSlotsDefinition> {
	readonly search = new ObservableValue<string>("");
	readonly current;

	constructor(gui: SaveSlotsDefinition, playerData: PlayerDataStorage) {
		super(gui);

		const current = new ObservableValue<ObservableValue<SlotMeta> | undefined>(undefined);
		this.current = current;

		this.parent(new Control(gui.NewSlotButton)) //
			.addButtonActionSelf((selv) => {
				const slots = playerData.slotsf.get();

				let index: number | undefined = undefined;
				for (let i = 0; i < GameDefinitions.FREE_SLOTS; i++) {
					if (i in slots) continue;

					index = i;
					break;
				}

				if (!index) {
					Transforms.create() //
						.flashColor(selv.instance, Colors.red)
						.run(selv);

					return;
				}

				$log(`Creating slot `, index);
				playerData.sendPlayerSlot({
					index,
					save: false,
					name: `Slot ${index + 1}`,
					color: Serializer.Color3Serializer.serialize(
						new Color3(math.random(), math.random(), math.random()),
					),
				});
			});

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
			playerData.slotsf,
			(slotList) => {
				for (const [index] of pairs(slotList)) {
					if (children.get(index)) continue;

					const ov = Observables.createObservableFromObjectPropertyTyped(playerData.slotsf, [index]);
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

type SlotsPopupParts = {
	readonly CloseButton: TextButton;
	readonly SearchTextBox: TextBox;

	readonly Bottom: SaveBottomDefinition;
	readonly SlotList: SaveSlotsDefinition;

	readonly SaveButton: GuiButton;
	readonly LoadButton: GuiButton;
};

const template = Interface.getInterface<{
	Popups: { Crossplatform: { Slots: GuiObject } };
}>().Popups.Crossplatform.Slots;
template.Visible = false;

@injectable
export class SavePopup extends PartialControl<SlotsPopupParts> {
	constructor(@inject playerData: PlayerDataStorage, @inject popupController: PopupController) {
		super(template.Clone());

		this.parent(new ButtonControl(this.parts.CloseButton, () => this.hide()));

		const slots = this.parent(new SaveSlots(this.parts.SlotList, playerData));
		this.parent(new SaveBottom(this.parts.Bottom, slots.current, playerData, popupController));

		const search = this.parent(new TextBoxControl(this.parts.SearchTextBox));
		this.event.subscribeObservable(search.text, (text) => slots.search.set(text), true);

		const slotSelected = this.event.addObservable(slots.current.fReadonlyCreateBased((c) => c !== undefined));

		const saveSlot = () => {
			const slot = slots.current.get()?.get();
			if (!slot) return;

			popupController.createAndShow(ConfirmPopup2, "Save this slot?", "THERE WILL BE CONSEQUENCES", () => {
				playerData.sendPlayerSlot({ index: slot.index, save: true });
			});
		};
		const loadSlot = () => {
			const slot = slots.current.get()?.get();
			if (!slot) return;

			playerData.loadPlayerSlot(slot.index);
		};

		const saveAction = this.parent(new Action(saveSlot)) //
			.subCanExecuteFrom({ slotSelected });
		const loadAction = this.parent(new Action(loadSlot)) //
			.subCanExecuteFrom({ slotSelected });

		this.parent(new Control(this.parts.SaveButton)) //
			.subscribeToAction(saveAction);

		this.parent(new Control(this.parts.LoadButton)) //
			.subscribeToAction(loadAction);
	}
}

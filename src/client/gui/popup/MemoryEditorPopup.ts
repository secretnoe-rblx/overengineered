import { ByteTextBoxControl } from "client/gui/controls/ByteTextBoxControl";
import { ConfirmPopup } from "client/gui/popup/ConfirmPopup";
import { TextPopup } from "client/gui/popup/TextPopup";
import { LogControl } from "client/gui/static/LogControl";
import { AutoUIScaledComponent } from "engine/client/gui/AutoUIScaledControl";
import { ButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { Interface } from "engine/client/gui/Interface";
import { TextBoxControl } from "engine/client/gui/TextBoxControl";
import { ComponentChildren } from "engine/shared/component/ComponentChildren";
import { Colors } from "shared/Colors";
import { VectorUtils } from "shared/utils/VectorUtils";
import type { Popup, PopupController } from "client/gui/PopupController";

type MemoryEditorPopupDefinition = GuiObject & {
	readonly Heading: Frame & {
		readonly CloseButton: TextButton;
		readonly TitleLabel: TextLabel;
	};
	readonly AddressTextBox: TextBox;
	readonly ImportButton: TextButton;
	readonly ClearButton: TextButton;
	readonly Content: MemoryEditorRecordsDefinition;
};

type MemoryEditorRecordDefinition = Frame & {
	readonly b0: TextBox;
	readonly b1: TextBox;
	readonly b2: TextBox;
	readonly b3: TextBox;
	readonly b4: TextBox;
	readonly b5: TextBox;
	readonly b6: TextBox;
	readonly b7: TextBox;
	readonly b8: TextBox;
	readonly b9: TextBox;
	readonly b10: TextBox;
	readonly b11: TextBox;
	readonly b12: TextBox;
	readonly b13: TextBox;
	readonly b14: TextBox;
	readonly b15: TextBox;
	readonly AddressLabel: TextLabel;
	readonly AsciiLabel: TextLabel;
};

type MemoryEditorRecordsDefinition = ScrollingFrame & {
	Template: MemoryEditorRecordDefinition;
};

class MemoryEditorRow extends Control<MemoryEditorRecordDefinition> {
	private readonly columns;

	constructor(
		gui: MemoryEditorRecordDefinition,
		private readonly popup: MemoryEditorPopup,
		private readonly row: number,
		recolorPreviousUntil: (index: number) => void,
	) {
		super(gui);

		this.columns = this.parent(new ComponentChildren<ByteTextBoxControl>().withParentInstance(gui));

		this.onEnable(() => {
			// Address
			this.gui.AddressLabel.Text = popup.numberToHex(row * 16);

			this.updateAsciiLabel();

			for (let i = 0; i < 16; i++) {
				// Get [i] byte TextBox
				const tb = this.gui.WaitForChild(`b${i}`) as TextBox;

				// Color gray if no data
				tb.TextColor3 = popup.data[row * 16 + i] !== undefined ? Colors.white : Color3.fromRGB(180, 180, 180);

				const idx = i;
				const control = this.columns.add(new ByteTextBoxControl(tb));
				control.value.set(popup.data[row * 16 + i] ?? 0);
				control.submitted.Connect((value) => {
					tb.TextColor3 = Colors.white;

					for (let j = 0; j < row * 16 + i; j++) {
						popup.data[j] ??= 0;
					}

					popup.data[row * 16 + i] = value;
					recolorPreviousUntil(row * 16 + idx);
					this.updateAsciiLabel();
				});
			}
		});
	}

	private updateAsciiLabel() {
		let str = "";
		for (let i = 0; i < 16; i++) {
			const c = this.popup.data[this.row * 16 + i] ?? 0;
			str += c >= 32 && c <= 126 ? string.char(c) : ".";
		}

		this.gui.AsciiLabel.Text = str;
	}

	updateColor(index: number) {
		this.columns.getAll()[index].instance.TextColor3 =
			this.popup.data[this.row * 16 + index] !== undefined ? Colors.white : Color3.fromRGB(180, 180, 180);
	}
}

class MemoryEditorRows extends Control<MemoryEditorRecordsDefinition> {
	private readonly template;
	private readonly rows;

	rowCursor = 0;
	readonly contentSize = 128;

	getContentSection() {
		return this.contentSize / 4;
	}

	constructor(
		gui: MemoryEditorRecordsDefinition,
		readonly popup: MemoryEditorPopup,
	) {
		super(gui);

		this.template = this.asTemplate(this.gui.Template, false);
		this.gui.Template.Visible = false;

		this.rows = this.parent(new ComponentChildren<MemoryEditorRow>().withParentInstance(this.gui));

		// Dynamic scroll
		this.gui.GetPropertyChangedSignal("CanvasPosition").Connect(() => {
			const onStart = VectorUtils.roundVector2(this.gui.CanvasPosition).Y === 0;
			const onEnd =
				VectorUtils.roundVector2(this.gui.AbsoluteCanvasSize.sub(this.gui.CanvasPosition)).Y ===
				VectorUtils.roundVector2(this.gui.AbsoluteSize).Y;

			if (onStart) {
				loadBehind();
			} else if (onEnd) {
				loadBelow();
			}
		});

		const loadBehind = () => {
			if (this.rowCursor <= 0) return;
			this.rowCursor -= this.getContentSection();
			if (this.rowCursor < 0) this.rowCursor = 0;

			this.spawnRows();

			// Scroll
			this.gui.CanvasPosition = this.gui.CanvasPosition.add(
				new Vector2(0, this.gui.Template.Size.Y.Offset * this.getContentSection() * popup.getScale()),
			);
		};

		const loadBelow = () => {
			if (this.rowCursor >= this.popup.bytesLimit / 16) return;
			if (this.rows.getAll().size() < this.contentSize) return;
			this.rowCursor += this.getContentSection();

			this.spawnRows();

			// Scroll
			this.gui.CanvasPosition = this.gui.CanvasPosition.sub(
				new Vector2(0, this.gui.Template.Size.Y.Offset * this.getContentSection() * popup.getScale()),
			);
		};

		this.spawnRows();
	}

	spawnRows() {
		this.rows.clear();

		for (let i = 0; i < this.contentSize; i++) {
			const row = i + this.rowCursor;
			if (row >= this.popup.bytesLimit / 16) break;

			const children = this.rows.getAll();
			this.rows.add(
				new MemoryEditorRow(this.template(), this.popup, row, (index) => {
					for (let i = 0; i < math.ceil(index / 16) + 2; i++) {
						for (let j = 0; j < 16; j++) {
							children[i].updateColor(j);
						}
					}
				}),
			);
		}
	}
}

@injectable
export class MemoryEditorPopup extends Control<MemoryEditorPopupDefinition> {
	@inject private readonly parentScreen: Popup = undefined!;
	@inject private readonly popupController: PopupController = undefined!;

	constructor(
		readonly bytesLimit: number,
		readonly data: number[],
		callback: (data: number[]) => void,
	) {
		const gui = Interface.getInterface<{
			Popups: { MemoryEditor: MemoryEditorPopupDefinition };
		}>().Popups.MemoryEditor.Clone();
		super(gui);

		if (bytesLimit % 128 !== 0) {
			$err(`Bytes limit must be a multiple of ${bytesLimit}`);
			this.hide();
			callback(data);
			return;
		}

		const rows = this.parent(new MemoryEditorRows(gui.Content, this));

		// Clear data button
		this.parent(
			new ButtonControl(gui.ClearButton, () => {
				this.popupController.showPopup(
					new ConfirmPopup(
						"Clear memory store?",
						"It will be impossible to undo this action",
						() => {
							data.clear();
							rows.spawnRows();
						},
						() => {},
					),
				);
			}),
		);

		// Update AddressTextBox on scroll
		gui.Content.GetPropertyChangedSignal("CanvasPosition").Connect(() => {
			const currentRow =
				rows.rowCursor +
				math.round(gui.Content.CanvasPosition.Y / (gui.Content.Template.Size.Y.Offset * this.getScale()));

			gui.AddressTextBox.Text = this.numberToHex(currentRow * 16);
		});

		// Close button
		this.parent(
			new ButtonControl(gui.Heading.CloseButton, () => {
				this.hide();
				callback(data);
			}),
		);

		// Import hex button
		this.parent(
			new ButtonControl(gui.ImportButton, () => {
				this.popupController.showPopup(
					new TextPopup(
						"IMPORT",
						"00 01 02 03 04 ...",
						(text) => {
							const spacelessText = string.gsub(string.gsub(text, "%s+", "")[0], "\n", "")[0];

							if (
								spacelessText.size() % 2 !== 0 ||
								string.match(text, "^[0-9a-fA-F%s]+$")[0] === undefined
							) {
								LogControl.instance.addLine("Invalid data format!", Colors.red);
								return;
							}

							if (spacelessText.size() / 2 > this.bytesLimit) {
								LogControl.instance.addLine("Too long!", Colors.red);
								return;
							}

							data.clear();
							for (const [value] of spacelessText.gmatch("%S%S")) {
								data.push(tonumber(value, 16)!);
							}

							rows.spawnRows();

							LogControl.instance.addLine("Import successful!");
						},
						() => {},
					),
				);
			}),
		);

		const addressTextBox = new TextBoxControl(gui.AddressTextBox);
		addressTextBox.text.set(this.numberToHex(0));
		addressTextBox.submitted.Connect((value) => {
			if (value === "") {
				rows.rowCursor = 0;
				rows.spawnRows();
				addressTextBox.text.set(this.numberToHex(0));
				return;
			}

			const rawRowHEX = string.match(value, "^0x(%x+)$")[0] ?? string.match(value, "^(%x+)$")[0];

			if (rawRowHEX !== undefined) {
				const byte = (tonumber(rawRowHEX, 16) ?? 0) + 1;
				const row = byte / 16;
				const cursorRow =
					math.floor((row + rows.getContentSection() / 2) / rows.getContentSection()) *
					rows.getContentSection();

				rows.rowCursor = cursorRow;
				rows.spawnRows();

				// Scroll
				const scale = this.getScale();
				gui.Content.CanvasPosition = new Vector2(
					0,
					gui.Content.Template.Size.Y.Offset * math.abs(cursorRow - row) * scale,
				);

				return;
			}

			LogControl.instance.addLine("Invalid address format!", Colors.red);
		});
		this.parent(addressTextBox);
	}

	getScale() {
		return this.parentScreen.getComponent(AutoUIScaledComponent).getScale();
	}

	numberToHex(value: number) {
		return string.format(`0x%0${string.format("%X", this.bytesLimit).size()}X`, value);
	}
}

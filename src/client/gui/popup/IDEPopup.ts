import { Interface } from "client/gui/Interface";
import { TextButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";

type IDEPopupDefinition = GuiObject & {
	readonly Heading: Frame & {
		readonly CloseButton: TextButton;
		readonly TitleLabel: TextLabel;
	};
	readonly Content: Frame & {
		LimitReached: TextLabel;
		Buttons: {
			SaveButton: TextButton;
			CancelButton: TextButton;
		};
		Content: Frame & {
			Code: ScrollingFrame & {
				TextBox: TextBox & {
					SyntaxInside: TextBox;
				};
			};
			Rows: ScrollingFrame & {
				TextLabel: TextLabel;
			};
		};
	};
};

export default class IDEPopup extends Control<IDEPopupDefinition> {
	private saveButton: TextButtonControl = undefined!;

	constructor(
		private readonly lengthLimit: number,
		code: string,
		callback: (data: string) => void,
	) {
		const gui = Interface.getInterface<{
			Popups: { Crossplatform: { IDE: IDEPopupDefinition } };
		}>().Popups.Crossplatform.IDE.Clone();
		super(gui);

		gui.Content.Content.Code.TextBox.Text = code;
		this.saveButton = new TextButtonControl(gui.Content.Buttons.SaveButton);

		this.event.subscribe(gui.Content.Content.Code.TextBox.GetPropertyChangedSignal("Text"), () => {
			this.updateHighlight();
		});

		this.parent(new Control(gui.Heading.CloseButton).addButtonAction(() => this.hideThenDestroy()));
		this.parent(new Control(gui.Content.Buttons.CancelButton).addButtonAction(() => this.hideThenDestroy()));
		this.parent(
			this.saveButton.addButtonAction(() => {
				callback(gui.Content.Content.Code.TextBox.Text);

				this.hideThenDestroy();
			}),
		);

		this.updateHighlight();
	}

	updateHighlight() {
		if (this.gui.Content.Content.Code.TextBox.Text.size() > this.lengthLimit) {
			this.gui.Content.LimitReached.Visible = true;
			this.gui.Content.LimitReached.Text = `⚠️ Limit of ${this.lengthLimit} characters reached. (${this.gui.Content.Content.Code.TextBox.Text.size()})`;
			this.saveButton.buttonInteractabilityComponent().setInteractable(false);
		} else {
			this.gui.Content.LimitReached.Visible = false;
			this.saveButton.buttonInteractabilityComponent().setInteractable(true);
		}

		this.gui.Content.Content.Code.TextBox.SyntaxInside.Text = Highlighter.run(
			this.gui.Content.Content.Code.TextBox.Text,
		);

		// Update rows
		let str = "";
		for (let index = 1; index < this.gui.Content.Content.Code.TextBox.Text.split("\n").size() + 1; index++) {
			str += `${index}\n`;
		}
		this.gui.Content.Content.Rows.TextLabel.Text = str;
		this.gui.Content.Content.Rows.CanvasPosition = this.gui.Content.Content.Code.CanvasPosition;
	}
}

export namespace Highlighter {
	const keywords = {
		lua: [
			"and",
			"break",
			"or",
			"else",
			"elseif",
			"if",
			"then",
			"until",
			"repeat",
			"while",
			"do",
			"for",
			"in",
			"end",
			"local",
			"return",
			"function",
			// "export",
		],
		rbx: [
			// "game",
			// "workspace",
			// "script",
			"math",
			"string",
			"table",
			// "task",
			// "wait",
			// "select",
			// "next",
			// "Enum",
			"error",
			"warn",
			// "tick",
			// "assert",
			// "shared",
			// "loadstring",
			"tonumber",
			"tostring",
			// "type",
			// "typeof",
			// "unpack",
			"print",
			// "Instance",
			"CFrame",
			"Vector3",
			"Vector2",
			"Color3",
			// "UDim",
			// "UDim2",
			// "Ray",
			// "BrickColor",
			// "OverlapParams",
			// "RaycastParams",
			// "Axes",
			// "Random",
			// "Region3",
			// "Rect",
			// "TweenInfo",
			// "collectgarbage",
			"not",
			"utf8",
			"bit32",
			"pcall",
			"xpcall",
			// "_G",
			// "setmetatable",
			// "getmetatable",
			// "os",
			"pairs",
			"ipairs",
		],
		operators: [
			"#",
			"+",
			"-",
			"*",
			"%",
			"/",
			"^",
			"=",
			"~",
			"=",
			"<",
			">",
			",",
			".",
			"(",
			")",
			"{",
			"}",
			"[",
			"]",
			";",
			":",
		],
	};

	const colors = {
		numbers: Color3.fromHex("#58a6ff"),
		boolean: Color3.fromHex("#f85149"),
		operator: Color3.fromHex("#c9d1d9"),
		lua: Color3.fromHex("#f85149"),
		rbx: Color3.fromHex("#58a6ff"),
		str: Color3.fromHex("#a5d6ff"),
		comment: Color3.fromHex("#8b949e"),
		null: Color3.fromHex("#c9d1d9"),
		call: Color3.fromHex("#58a6ff"),
		self_call: Color3.fromHex("#58a6ff"),
		local_color: Color3.fromHex("#f85149"),
		function_color: Color3.fromHex("#f85149"),
		self_color: Color3.fromHex("#c9d1d9"),
		local_property: Color3.fromHex("#7ee787"),
	};

	function createKeywordSet(list: string[]): Set<string> {
		return new Set(list);
	}

	const luaSet = createKeywordSet(keywords.lua);
	const rbxSet = createKeywordSet(keywords.rbx);
	const operatorsSet = createKeywordSet(keywords.operators);

	function getHighlight(tokens: string[], index: number): Color3 | undefined {
		const token = tokens[index];
		const tokenLower = token.lower();

		if ((colors as Record<string, Color3>)[`${token}_color`]) {
			return (colors as Record<string, Color3>)[`${token}_color`];
		}

		if (tonumber(token)) return colors.numbers;
		if (tokenLower === "nil") return colors.null;
		if (token.sub(0, 2) === "--") return colors.comment;
		if (operatorsSet.has(token)) return colors.operator;
		if (luaSet.has(tokenLower)) return colors.lua;
		if (rbxSet.has(tokenLower)) return colors.rbx;
		if (token.sub(0, 1) === '"' || token.sub(0, 1) === "'") return colors.str;
		if (tokenLower === "true" || tokenLower === "false") return colors.boolean;

		if (tokens[index + 1] === "(") {
			if (tokens[index - 1] === ":") return colors.self_call;
			return colors.call;
		}

		if (tokens[index - 1] === ".") {
			if (tokens[index - 2] === "Enum") return colors.rbx;
			return colors.local_property;
		}
	}

	export function run(source: string): string {
		const tokens: string[] = [];
		let currentToken = "";

		let inString: false | string = false;
		let inComment = false;
		let commentPersist = false;

		for (let i = 0; i < source.size(); i++) {
			const char = source.sub(i + 1, i + 1);

			if (inComment) {
				if (char === "\n" && !commentPersist) {
					if (currentToken !== "") tokens.push(currentToken);
					tokens.push(char);
					currentToken = "";
					inComment = false;
				} else if (source.sub(i, i + 2) === "]]" && commentPersist) {
					currentToken += "]";
					tokens.push(currentToken);
					currentToken = "";
					inComment = false;
					commentPersist = false;
				} else {
					currentToken += char;
				}
			} else if (inString) {
				if ((char === inString && source.sub(i, i) !== "\\") || char === "\n") {
					currentToken += char;
					inString = false;
				} else {
					currentToken += char;
				}
			} else {
				if (source.sub(i + 1, i + 2) === "--") {
					if (currentToken !== "") tokens.push(currentToken);
					currentToken = "-";
					inComment = true;
					commentPersist = source.sub(i + 3, i + 4) === "[[";
				} else if (char === '"' || char === "'") {
					if (currentToken !== "") tokens.push(currentToken);
					currentToken = char;
					inString = char;
				} else if (operatorsSet.has(char)) {
					if (currentToken !== "") tokens.push(currentToken);
					tokens.push(char);
					currentToken = "";
				} else if (char.match("[%w_]")[0]) {
					currentToken += char;
				} else {
					if (currentToken !== "") tokens.push(currentToken);
					tokens.push(char);
					currentToken = "";
				}
			}
		}

		if (currentToken !== "") {
			tokens.push(currentToken);
		}

		const highlighted: string[] = [];

		for (let i = 0; i < tokens.size(); i++) {
			const token = tokens[i];
			const highlight = getHighlight(tokens, i);

			if (highlight) {
				const color = highlight.ToHex();
				const escaped = token.gsub("<", "&lt;")[0].gsub(">", "&gt;")[0];
				highlighted.push(`<font color = "#${color}">${escaped}</font>`);
			} else {
				highlighted.push(token);
			}
		}

		return highlighted.join("");
	}
}

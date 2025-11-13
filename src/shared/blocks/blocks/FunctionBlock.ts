import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

class ArithmeticExpressionEvaluator {
	private str = "";
	private pos = 0;
	private ch = "0";

	evaluate(expression: string, resultIsInteger: boolean = false): number | undefined {
		this.str = expression;
		this.pos = 0;
		this.ch = "0";
		const outcome = this.parse();
		if (outcome === undefined) {
			return undefined;
		}
		if (resultIsInteger) {
			return math.round(outcome);
		}
		return outcome;
	}

	private nextChar() {
		this.ch = ++this.pos <= this.str.size() ? this.str.sub(this.pos, this.pos) : "";
	}

	private eat(charToEat: string): boolean {
		while (this.ch === " ") this.nextChar();
		if (this.ch === charToEat) {
			this.nextChar();
			return true;
		}
		return false;
	}

	private parse(): number | undefined {
		this.nextChar();
		const x = this.parseExpression();
		// skip trailing spaces
		while (this.ch === " ") this.nextChar();
		if (this.pos <= this.str.size()) {
			// if there are unread characters left, an error occurs
			return undefined;
		}
		return x;
	}

	private parseExpression(): number | undefined {
		let x = this.parseTerm();
		if (x === undefined) return undefined;

		for (;;) {
			if (this.eat("+")) {
				const term = this.parseTerm();
				if (term === undefined) return undefined;
				x += term;
			} else if (this.eat("-")) {
				const term = this.parseTerm();
				if (term === undefined) return undefined;
				x -= term;
			} else {
				return x;
			}
		}
	}

	private parseTerm(): number | undefined {
		let x = this.parseFactor();
		if (x === undefined) return undefined;

		for (;;) {
			if (this.eat("*")) {
				const factor = this.parseFactor();
				if (factor === undefined) return undefined;
				x *= factor;
			} else if (this.eat("%")) {
				// remainder from division
				const rhs = this.parseFactor();
				if (rhs === undefined) return undefined;
				x = x % rhs;
			} else if (this.matchKeyword("//")) {
				// integer division (rounding towards -inf, as floor)
				const rhs = this.parseFactor();
				if (rhs === undefined) return undefined;
				x = math.floor(x / rhs);
			} else if (this.eat("/")) {
				const factor = this.parseFactor();
				if (factor === undefined) return undefined;
				x /= factor;
			} else {
				return x;
			}
		}
	}

	// Check for a multi-character keyword/operator
	private matchKeyword(word: string): boolean {
		while (this.ch === " ") this.nextChar();
		const start = this.pos;
		const endPos = start + word.size() - 1;
		if (endPos <= this.str.size() && this.str.sub(start, endPos) === word) {
			// shift pos by the length of the word
			for (let i = 0; i < word.size(); i++) this.nextChar();
			return true;
		}
		return false;
	}

	private parseFactor(): number | undefined {
		// unary %/+/-
		if (this.eat("%")) return this.parseFactor();
		if (this.eat("+")) return this.parseFactor();
		if (this.eat("-")) {
			const f = this.parseFactor();
			if (f === undefined) return undefined;
			return -f;
		}

		let x: number | undefined = undefined;
		const startPos = this.pos;

		if (this.eat("(")) {
			x = this.parseExpression();
			if (!this.eat(")")) return undefined;
		} else if (this.isAlpha(this.ch)) {
			// identifier: function or variable
			const nameStart = this.pos;
			while (this.isAlpha(this.ch)) this.nextChar();
			const ident = this.str.sub(nameStart, this.pos - 1).lower();

			// sin/cos/abs functions, syntax: func(expr)
			if (ident === "sin" || ident === "cos" || ident === "abs") {
				if (!this.eat("(")) return undefined;
				const arg = this.parseExpression();
				if (arg === undefined) return undefined;
				if (!this.eat(")")) return undefined;

				if (ident === "sin") x = math.sin(arg);
				else if (ident === "cos") x = math.cos(arg);
				else x = math.abs(arg);
			} else {
				// if it's just a variable (a..z) — in the current implementation, the values are already substituted by a string,
				// so they shouldn't end up here. But if they do, it's an error.
				return undefined;
			}
		} else if ((this.ch >= "0" && this.ch <= "9") || this.ch === ".") {
			while ((this.ch >= "0" && this.ch <= "9") || this.ch === ".") this.nextChar();
			x = tonumber(this.str.sub(startPos, this.pos - 1));
		} else {
			return undefined;
		}

		if (x === undefined) return undefined;

		// raising to a power (right-associative)
		if (this.eat("^")) {
			const factor = this.parseFactor();
			if (factor === undefined) return undefined;
			x = math.pow(x, factor);
		}

		return x;
	}

	private isAlpha(c: string): boolean {
		return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
	}
}

const inputVars = ["a", "b", "c", "d", "e", "f", "g", "h"];
const definition = {
	inputOrder: ["expression", "input1", "input2", "input3", "input4", "input5", "input6", "input7", "input8"],
	input: {
		expression: {
			displayName: "Expression",
			tooltip: "The expression in string format",
			types: {
				string: {
					config: "a + (b - c)",
				},
			},
		},

		input1: {
			displayName: inputVars[0],
			types: {
				number: { config: 0 },
			},
		},
		input2: {
			displayName: inputVars[1],
			types: {
				number: { config: 1 },
			},
		},
		input3: {
			displayName: inputVars[2],
			types: {
				number: { config: 2 },
			},
		},
		input4: {
			displayName: inputVars[3],
			types: {
				number: { config: 3 },
			},
		},
		input5: {
			displayName: inputVars[4],
			types: {
				number: { config: 4 },
			},
		},
		input6: {
			displayName: inputVars[5],
			types: {
				number: { config: 5 },
			},
		},
		input7: {
			displayName: inputVars[6],
			types: {
				number: { config: 6 },
			},
		},
		input8: {
			displayName: inputVars[7],
			types: {
				number: { config: 7 },
			},
		},
	},
	output: {
		result: {
			displayName: "Result",
			types: ["number"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

class Logic extends BlockLogic<typeof definition> {
	constructor(block: BlockLogicArgs) {
		super(definition, block);

		const evaluator = new ArithmeticExpressionEvaluator();
		this.onRecalcInputs(({ expression, input1, input2, input3, input4, input5, input6, input7, input8 }) => {
			// numbers like 3.4359394771105e+18 break the parsing, this makes them always be a normal number
			const tostr = (num: number) => "%.15f".format(num);

			const expr = expression
				.gsub(inputVars[0], tostr(input1))[0]
				.gsub(inputVars[1], tostr(input2))[0]
				.gsub(inputVars[2], tostr(input3))[0]
				.gsub(inputVars[3], tostr(input4))[0]
				.gsub(inputVars[4], tostr(input5))[0]
				.gsub(inputVars[5], tostr(input6))[0]
				.gsub(inputVars[6], tostr(input7))[0]
				.gsub(inputVars[7], tostr(input8))[0];

			const result = evaluator.evaluate(expr);
			if (!result) this.disableAndBurn();
			else this.output.result.set("number", result);
		});
	}
}

export const FunctionBlock = {
	...BlockCreation.defaults,
	id: "functionblock",
	displayName: "Function Block",
	description: "Solves the given expression using the provided variables.",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;

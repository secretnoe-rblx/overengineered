import { ReplicatedStorage } from "@rbxts/services";
import { Objects } from "engine/shared/fixes/Objects";
import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";
import type { ExplosionEffect } from "shared/effects/ExplosionEffect";

const loadstring = require(ReplicatedStorage.vLua) as (
	code: string,
	env: unknown,
) => ((...args: unknown[]) => void) | undefined;

const definitionPart = {
	types: {
		number: { config: 0 },
		bool: { config: false },
		string: { config: "" },
		vector3: { config: Vector3.zero },
	},
	configHidden: true,
};

const definition = {
	input: {
		code: {
			displayName: "Code",
			types: {
				string: { config: `print("Hello, OverEngineered!")` },
			},
			tooltip: "Lua code to run.",
			connectorHidden: true,
		},
		input1: {
			displayName: "Input 1",
			...definitionPart,
		},
		input2: {
			displayName: "Input 2",
			...definitionPart,
		},
		input3: {
			displayName: "Input 3",
			...definitionPart,
		},
		input4: {
			displayName: "Input 4",
			...definitionPart,
		},
		input5: {
			displayName: "Input 5",
			...definitionPart,
		},
		input6: {
			displayName: "Input 6",
			...definitionPart,
		},
		input7: {
			displayName: "Input 7",
			...definitionPart,
		},
		input8: {
			displayName: "Input 8",
			...definitionPart,
		},
	},
	output: {
		output1: {
			displayName: "Output 1",
			types: Objects.keys(definitionPart.types),
		},
		output2: {
			displayName: "Output 2",
			types: Objects.keys(definitionPart.types),
		},
		output3: {
			displayName: "Output 3",
			types: Objects.keys(definitionPart.types),
		},
		output4: {
			displayName: "Output 4",
			types: Objects.keys(definitionPart.types),
		},
		output5: {
			displayName: "Output 5",
			types: Objects.keys(definitionPart.types),
		},
		output6: {
			displayName: "Output 6",
			types: Objects.keys(definitionPart.types),
		},
		output7: {
			displayName: "Output 7",
			types: Objects.keys(definitionPart.types),
		},
		output8: {
			displayName: "Output 8",
			types: Objects.keys(definitionPart.types),
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as LuaCircuitBlockLogic };
@injectable
class Logic extends BlockLogic<typeof definition> {
	private bytecode: ((...args: unknown[]) => void) | undefined;

	constructor(block: BlockLogicArgs, @inject explode: ExplosionEffect) {
		super(definition, block);

		const inputCaches = {
			[1]: this.initializeInputCache("input1"),
			[2]: this.initializeInputCache("input2"),
			[3]: this.initializeInputCache("input3"),
			[4]: this.initializeInputCache("input4"),
			[5]: this.initializeInputCache("input5"),
			[6]: this.initializeInputCache("input6"),
			[7]: this.initializeInputCache("input7"),
			[8]: this.initializeInputCache("input8"),
		};

		const baseEnv = {
			print,
			table,
			pcall,
			math,
			tostring,
			tonumber,
			pairs,
			ipairs,
			string,
			bit32,
			Vector2,
			Vector3,
			CFrame,
			time,
			buffer,
			utf8,

			onTick: (func: (dt: number) => void): void => {
				this.onTicc((ctx) => {
					try {
						func(ctx.dt);
					} catch (err) {
						this.disableAndBurn();
						error(err, 2);
					}
				});
			},

			getInput: (input: number): string | number | boolean | Vector3 | undefined => {
				if (input < 1 || input > 8) {
					error("Output index must be between 1 and 8", 2);
				}

				return inputCaches[input as 1].tryGet();
			},
			setOutput: (output: number, value: unknown): void => {
				if (output < 1 || output > 8) {
					error("Output index must be between 1 and 8", 2);
				}

				const retType = typeIs(value, "number")
					? "number"
					: typeIs(value, "Vector3")
						? "Vector3"
						: typeIs(value, "string")
							? "string"
							: typeIs(value, "boolean")
								? "bool"
								: "unknown";

				if (retType === "unknown") {
					error(`Invalid object type ${typeOf(value)}`, 2);
				}

				this.output[`output${output}` as "output1"].set(retType as never, value as never);
			},
		};

		const safeEnv = setmetatable(
			{},
			{
				__index: baseEnv as never,
				__newindex: (_, key, value) => {
					if (baseEnv[key as never] !== undefined) {
						error("Attempt to overwrite protected key: " + tostring(key), 2);
					}
					rawset(baseEnv, key, value);
				},
			},
		);

		this.onkFirstInputs(["code"], ({ code }) => {
			try {
				this.bytecode = loadstring(code, safeEnv);
				if (!this.bytecode) {
					if (block.instance?.PrimaryPart) {
						explode.send(block.instance.PrimaryPart, { part: block.instance.PrimaryPart });
					}

					this.disableAndBurn();
					return;
				}

				this.bytecode();
			} catch (err) {
				this.disableAndBurn();
				error(err, 2);
			}
		});
	}
}

export const LuaCircuitBlock = {
	...BlockCreation.defaults,
	id: "luacircuit",
	displayName: "Lua Circuit",
	description: "indev",
	limit: 4,
	devOnly: true,

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;

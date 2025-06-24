import { ReplicatedStorage } from "@rbxts/services";
import { Colors } from "engine/shared/Colors";
import { Objects } from "engine/shared/fixes/Objects";
import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { LogControl } from "client/gui/static/LogControl";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const vLuau = require(ReplicatedStorage.vLuau) as {
	luau_execute: (
		code: string,
		env: unknown,
	) => LuaTuple<[((...args: unknown[]) => void) | undefined, error: unknown | undefined]>;
};

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
				code: {
					config: `-- Read your inputs using "getInput(number)"
-- Write values to outputs using "setOutput(number, data)"
-- You are limited to 8 kilobytes. If you need more, use the minifer tools.

onTick(function(deltaTime)
    -- The code here is executed once per tick.
    -- The deltaTime shows how much time has elapsed since the previous tick.    
    -- Remember that it makes no sense to change the same output several times here.

    -- Key Sensor & Screen Example
    local keyPressed = getInput(1) -- Key sensor
    if keyPressed then
        setOutput(1, "Key pressed") -- Screen
    else
        setOutput(1, "Key is not pressed") -- Screen
    end
end)

print("Hello, OverEngineered!")`,
					lengthLimit: 8192,
				},
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
	private greenLED: BasePart = undefined!;
	private redLED: BasePart = undefined!;

	constructor(block: BlockLogicArgs, @tryInject logControl?: LogControl) {
		super(definition, block);

		this.greenLED = block.instance?.FindFirstChild("GreenLED") as BasePart;
		this.redLED = block.instance?.FindFirstChild("RedLED") as BasePart;

		this.greenLED.Material = Enum.Material.Neon;
		this.greenLED.Color = Colors.green;

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

		const log = function (text: string, level: "info" | "warn" | "error"): void {
			if (level === "warn") {
				warn("[Lua Circuit]", text);
				logControl?.addLine(text, Colors.yellow);
			} else if (level === "error") {
				warn("[Lua Circuit]", text);
				logControl?.addLine(text, Colors.red);
			} else {
				print("[Lua Circuit]", text);
				logControl?.addLine(text);
			}
		};

		const baseEnv = {
			print: (...args: unknown[]) => {
				for (let i = 0; i < args.size(); i++) {
					args[i] ??= "nil";
				}

				log((args as defined[]).join(" "), "info");
			},
			warn: (...args: unknown[]) => {
				for (let i = 0; i < args.size(); i++) {
					args[i] ??= "nil";
				}

				log((args as defined[]).join(" "), "warn");
			},
			error: (...args: unknown[]) => {
				for (let i = 0; i < args.size(); i++) {
					args[i] ??= "nil";
				}

				log((args as defined[]).join(" "), "error");
			},
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

			onTick: (func: (dt: number, tick: number) => void): void => {
				this.onTicc((ctx) => {
					try {
						func(ctx.dt, ctx.tick);
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
				const [bytecode, err] = vLuau.luau_execute(code, safeEnv);
				if (!bytecode) {
					log(`Compilation error: ${tostring(err)}`, "error");

					// this.disableAndBurn();
					return;
				}

				bytecode();
			} catch (err) {
				log(`Error: ${tostring(err)}`, "error");

				this.event.loop(0.1, () => {
					this.redLED.Color = this.redLED.Color === Colors.red ? new Color3(91, 93, 105) : Colors.red;
					this.redLED.Material =
						this.redLED.Material === Enum.Material.Neon ? Enum.Material.SmoothPlastic : Enum.Material.Neon;
				});

				// this.disableAndBurn();
			}
		});
	}
}

export const LuaCircuitBlock = {
	...BlockCreation.defaults,
	id: "luacircuit",
	displayName: "Lua Circuit",
	description: "Allows you to run Lua code to program your buildings. If the code is too large, use a minifier.",
	limit: 1,
	devOnly: true,

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;

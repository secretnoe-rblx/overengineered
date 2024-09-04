import { Players, ReplicatedStorage, RunService, ServerScriptService } from "@rbxts/services";

export type UnitTest = (di: DIContainer) => unknown;
export type UnitTestList = {
	readonly [k in string]: UnitTest;
};
export type UnitTests = {
	readonly [k in string]: UnitTestList;
};

export namespace TestFramework {
	export function findAllTestScripts(): readonly ModuleScript[] {
		const ret: ModuleScript[] = [];
		const visit = (instance: Instance) => {
			if (instance.IsA("ModuleScript") && instance.Name.find(".test")[0]) {
				ret.push(instance);
			}

			for (const child of instance.GetChildren()) {
				visit(child);
			}
		};

		if (RunService.IsServer()) {
			visit(ReplicatedStorage);
			visit(ServerScriptService);
		} else if (RunService.IsClient()) {
			visit(ReplicatedStorage);
			visit(Players.LocalPlayer.WaitForChild("PlayerScripts"));
		}

		return ret;
	}

	export function loadTestsFromScript(mscript: ModuleScript): UnitTests {
		const ts = require(
			ReplicatedStorage.WaitForChild("rbxts_include").WaitForChild("RuntimeLib") as ModuleScript,
		) as {
			import: (context: LuaSourceContainer, module: Instance, ...path: string[]) => unknown;
		};

		return (ts.import(script, mscript) as { _Tests: UnitTests })._Tests;
	}

	export function runMultiple(name: string, test: UnitTestList, di: DIContainer, offset?: number): void {
		offset ??= 0;

		const offsetstr = string.rep(" ", offset);
		$log(`${offsetstr}[${name}] Running`);

		for (const [name, tests] of pairs(test)) {
			run(name, tests, di, offset + 1);
		}

		$log(`${offsetstr}[${name}] SUCCESS`);
	}
	export function run<T extends UnitTest>(
		name: string,
		test: T,
		di: DIContainer,
		offset?: number,
	): ReturnType<T> | undefined {
		offset ??= 0;

		const offsetstr = string.rep(" ", offset);
		$log(`${offsetstr}[${name}] Running`);

		try {
			const result = test(di) as ReturnType<T>;
			$log(`${offsetstr}[${name}] SUCCESS`);

			return result;
		} catch (err) {
			$err(tostring(err ?? "Unknown error"));
			return undefined;
		}
	}
}

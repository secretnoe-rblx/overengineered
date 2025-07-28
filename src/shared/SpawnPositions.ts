type sps = readonly [name: string, { readonly name: string; readonly pos: CFrame | undefined }];

const sps = [
	["plot", { name: "Plot", pos: undefined }],
	["water1", { name: "Water 1", pos: new CFrame(769, -16345.559, 1269.5) }],
	["water2", { name: "Water 2", pos: new CFrame(-101, -16411.887, 3045) }],
	["space", { name: "Space", pos: new CFrame(50, 26411, 894) }],
	["helipad", { name: "Helipad", pos: new CFrame(901, -14871.997, -798) }],
	["helipad1", { name: "Helipad 1", pos: new CFrame(296.5, -16382.999, -1138) }],
	["helipad2", { name: "Helipad 2", pos: new CFrame(296.5, -16382.999, -1283) }],
	["helipad3", { name: "Helipad 3", pos: new CFrame(296.5, -16382.999, -1428) }],
	["idk", { name: "idk", pos: new CFrame(-14101, -16411.887, 35045) }],
] as const satisfies readonly sps[];

export const spawnPositions: readonly sps[] = sps;
export const spawnPositionsKeyed = asObject(spawnPositions.mapToMap((c) => $tuple(c[0], c[1].pos)).asReadonly());

export type SpawnPosition = (typeof spawnPositions)[number][0];

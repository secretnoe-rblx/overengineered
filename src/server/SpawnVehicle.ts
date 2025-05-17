import type { BlocksSerializer } from "shared/building/BlocksSerializer";

export const CreateSpawnVehicle = () =>
	({
		blocks: [
			{
				id: "block",
				col: "1e233c",
				loc: [-1, 1.5, -4, [0, 0, 0]],
				mat: 1056,
				scl: '{"y":1,"__type":"vector3","x":1,"z":1}',
				uuid: "ffe1eb5c-29ac-4fda-bb8b-f870d964dc4f",
			},
			{
				id: "heliumblock",
				loc: [0, 5.5009765625, -4, [0, 0, 0]],
				scl: '{"y":1,"__type":"vector3","x":1,"z":1}',
				uuid: "ac09da9e-65dc-4392-a1cc-62ffe3e363c1",
				config: {
					density: {
						type: "number",
						config: 0.71,
					},
				},
			},
			{
				id: "heliumblock",
				loc: [-2, 5.5, -4, [0, 0, 0]],
				scl: '{"y":1,"__type":"vector3","x":1,"z":1}',
				uuid: "f37757f2-ad4d-42fe-a2ab-c0d07148e5a4",
				config: {
					density: {
						type: "number",
						config: 0.71,
					},
				},
			},
			{
				id: "heliumblock",
				loc: [-4, 5.5, -4, [0, 0, 0]],
				scl: '{"y":1,"__type":"vector3","x":1,"z":1}',
				uuid: "9c577622-ba10-461a-bad0-ad53086f32b0",
				config: {
					density: {
						type: "number",
						config: 0.2,
					},
				},
			},
			{
				id: "wedgewing1x2",
				loc: [-3, 5.5, -7, [-3.141592502593994, 1.5707963705062866, 0]],
				scl: '{"y":1,"__type":"vector3","x":1,"z":1}',
				uuid: "f063d629-7966-4b1d-aaeb-3a91b63a295d",
			},
			{
				id: "wedgewing1x2",
				loc: [-3, 5.5, -1, [0, 1.5707963705062866, 0]],
				scl: '{"y":1,"__type":"vector3","x":1,"z":1}',
				uuid: "646a288b-e9d1-4045-be0d-fc2663cfa709",
			},
			{
				id: "wedge1x1",
				loc: [-6, 5.5, -4, [-1.5707963705062866, 0, 1.5707963705062866]],
				scl: '{"y":1,"__type":"vector3","x":1,"z":1}',
				uuid: "d646ea5d-9bea-4c6b-9fd9-284bf7d60c8a",
			},
			{
				id: "wedge1x1",
				loc: [2, 5.5, -4, [3.141592502593994, -1.5707963705062866, 0]],
				scl: '{"y":1,"__type":"vector3","x":1,"z":1}',
				uuid: "f91d7c8c-9f3c-4704-8df3-5572fe8adf2b",
			},
			{
				id: "wedgewing1x2",
				loc: [2, 8.5, -4, [-1.5707963705062866, 1.5707963705062866, 0]],
				scl: '{"y":1,"__type":"vector3","x":1,"z":1}',
				uuid: "7c6df3ff-512e-46ee-8da7-57c5bfddab16",
			},
			{
				id: "passengerseat",
				loc: [-1, 8.5, -4, [0, 1.5707963705062866, 0]],
				scl: '{"y":1,"__type":"vector3","x":1,"z":1}',
				uuid: "f8a98f4b-609a-4277-b94c-586f0ebeaf2e",
			},
			{
				id: "rope",
				loc: [-1, 3.5009765625, -4, [0, 0, 0]],
				scl: '{"y":1,"__type":"vector3","x":1,"z":1}',
				uuid: "679985bd-8b89-4efb-97cb-7da8d7b0fa82",
				config: {
					length: {
						type: "number",
						config: 4,
					},
				},
			},
			{
				id: "smallrocketengine",
				loc: [3, 5.5, -4, [0, 0, 0]],
				scl: '{"y":1,"__type":"vector3","x":1,"z":1}',
				uuid: "55de06e0-a9f6-4a87-a3c7-dd5f263c4123",
				config: {
					thrust: {
						type: "number",
						config: 1,
						controlConfig: {
							keys: [
								{
									key: "W",
									value: 100,
								},
								{
									key: "S",
									value: 0,
								},
							],
							mode: {
								type: "smooth",
								smooth: {
									mode: "stopOnRelease",
									speed: 20,
								},
								instant: {
									mode: "onRelease",
								},
							},
							enabled: false,
							startValue: 0,
						},
					},
					strength: {
						type: "number",
						config: 100,
					},
				},
			},
		],
		version: 31,
	}) as unknown as BlocksSerializer.JsonSerializedBlocks;

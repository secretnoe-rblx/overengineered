import type { TutorialDiffList } from "client/tutorial/TutorialController";

export const NewBasicPlaneTutorialDiffs = {
	saveVersion: 25,
	diffs: {
		base: [
			{
				block: {
					uuid: "f2dadc75-74ff-480c-b97e-8fa30a062c16",
					id: "beam4x1",
					location: new CFrame(-4, 1.5, 0, 0, -1, 0, 1, 0, 0, 0, 0, 1),
				},
				type: "added",
			},
			{
				block: {
					uuid: "36cda2b0-66e2-4d0a-b939-deb93f7c0eef",
					id: "beam4x1",
					location: new CFrame(4, 1.5, 0, 0, -1, 0, 1, 0, 0, 0, 0, 1),
				},
				type: "added",
			},
		],
		engineAndSeat: [
			{
				block: {
					uuid: "b36b920d-6d56-43c5-b63e-12af744b400d",
					id: "smallrocketengine",
					location: new CFrame(10, 1.5, 0),
				},
				type: "added",
			},
			{
				block: {
					uuid: "dcd89f4b-3200-447c-b7e6-5191c4fc9d32",
					id: "vehicleseat",
					location: new CFrame(-9, 2.5, 0, 0, 0, 1, 0, 1, 0, -1, 0, 0),
				},
				type: "added",
			},
		],
		basicWings: [
			{
				block: {
					uuid: "54f82b66-b6a4-4490-a26d-0b9614a6bd8e",
					id: "wedgewing1x4",
					location: new CFrame(-6, 1.5, 5, 0, 0, 1, 0, 1, 0, -1, 0, 0),
				},
				type: "added",
			},
			{
				block: {
					uuid: "b9a00089-bd0f-4d35-95eb-c6da82362d20",
					id: "wedgewing1x4",
					location: new CFrame(-6, 1.5, -5, 0, 0, 1, 0, -1, 0, 1, 0, 0),
				},
				type: "added",
			},
			{
				block: {
					uuid: "cbf2a70c-d246-45c4-bb90-cef7ce4c5745",
					id: "wing1x4",
					location: new CFrame(-4, 1.5, -5, 0, 0, 1, 0, -1, 0, 1, 0, 0),
				},
				type: "added",
			},
			{
				block: {
					uuid: "e037d14f-239b-47cb-b35d-9bc6bb04b0b2",
					id: "wing1x4",
					location: new CFrame(-4, 1.5, 5, 0, 0, 1, 0, 1, 0, -1, 0, 0),
				},
				type: "added",
			},
		],
		moveAll: [
			{ uuid: "54f82b66-b6a4-4490-a26d-0b9614a6bd8e", type: "moved", to: new Vector3(-6, 9.5, 5) },
			{ uuid: "f2dadc75-74ff-480c-b97e-8fa30a062c16", type: "moved", to: new Vector3(-4, 9.5, 0) },
			{ uuid: "b36b920d-6d56-43c5-b63e-12af744b400d", type: "moved", to: new Vector3(10, 9.5, 0) },
			{ uuid: "36cda2b0-66e2-4d0a-b939-deb93f7c0eef", type: "moved", to: new Vector3(4, 9.5, 0) },
			{ uuid: "b9a00089-bd0f-4d35-95eb-c6da82362d20", type: "moved", to: new Vector3(-6, 9.5, -5) },
			{ uuid: "cbf2a70c-d246-45c4-bb90-cef7ce4c5745", type: "moved", to: new Vector3(-4, 9.5, -5) },
			{ uuid: "e037d14f-239b-47cb-b35d-9bc6bb04b0b2", type: "moved", to: new Vector3(-4, 9.5, 5) },
			{ uuid: "dcd89f4b-3200-447c-b7e6-5191c4fc9d32", type: "moved", to: new Vector3(-9, 10.5, 0) },
		],
		servo: [
			{
				block: {
					uuid: "b11c87ba-291b-44f0-8ce7-8cf0678c0ffc",
					id: "servomotorblock",
					location: new CFrame(7, 11.5, 0),
				},
				type: "added",
			},
			{
				block: {
					uuid: "8b587f06-688c-4d36-9e53-42f463260a13",
					id: "servomotorblock",
					location: new CFrame(-9, 7.5, 1, 0, 0, 1, 0, 1, 0, -1, 0, 0),
				},
				type: "added",
			},
			{
				block: {
					uuid: "5271ad05-e960-4c45-bf62-52b2a0d5873d",
					id: "servomotorblock",
					location: new CFrame(-2, 9.5, 2, -1, 0, 0, 0, 0, 1, 0, 1, 0),
				},
				type: "added",
			},
			{
				block: {
					uuid: "9a9c54c8-601c-41ec-b755-c5d14db1db37",
					id: "servomotorblock",
					location: new CFrame(-2, 9.5, -2, 1, 0, 0, 0, 0, 1, 0, -1, 0),
				},
				type: "added",
			},
			{
				block: {
					uuid: "826fc8a9-4fb6-4401-8c76-21610e67c637",
					id: "servomotorblock",
					location: new CFrame(7, 9.5, 2, -1, 0, 0, 0, 0, 1, 0, 1, 0),
				},
				type: "added",
			},
			{
				block: {
					uuid: "f957d4b6-6a1c-407d-a6d1-9dfff2abda1e",
					id: "servomotorblock",
					location: new CFrame(7, 9.5, -2, 1, 0, 0, 0, 0, 1, 0, -1, 0),
				},
				type: "added",
			},
			{
				block: {
					uuid: "18db45c8-7f7a-4610-97f3-c1af6c8625d6",
					id: "servomotorblock",
					location: new CFrame(-9, 7.5, -1, 0, 0, 1, 0, 1, 0, -1, 0, 0),
				},
				type: "added",
			},
		],
		removeExtraServo: [{ uuid: "8b587f06-688c-4d36-9e53-42f463260a13", type: "removed" }],
		controlWings: [
			{
				block: {
					uuid: "3277b070-5d5e-44e1-b41d-8b63b11cbfdc",
					id: "wing1x2",
					location: new CFrame(7, 9.5, 5, 0, 0, 1, 0, -1, 0, 1, 0, 0),
				},
				type: "added",
			},
			{
				block: {
					uuid: "a87e50ea-ab5c-4237-bffa-6db1ec646934",
					id: "wing1x2",
					location: new CFrame(9, 14.5, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0),
				},
				type: "added",
			},
			{
				block: {
					uuid: "48c7b42d-3bbc-49ec-9546-8e9278842868",
					id: "wing1x2",
					location: new CFrame(7, 14.5, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0),
				},
				type: "added",
			},
			{
				block: {
					uuid: "e70da516-eb85-45ef-837e-1455208d44fc",
					id: "wing1x2",
					location: new CFrame(9, 9.5, -5, 0, 0, 1, 0, 1, 0, -1, 0, 0),
				},
				type: "added",
			},
			{
				block: {
					uuid: "982133c1-045d-495f-a360-a6ea73626fd0",
					id: "wing1x2",
					location: new CFrame(7, 9.5, -5, 0, 0, 1, 0, 1, 0, -1, 0, 0),
				},
				type: "added",
			},
			{
				block: {
					uuid: "713d4f01-c77d-4f2c-aa91-bb3afcbbc908",
					id: "wing1x2",
					location: new CFrame(9, 9.5, 5, 0, 0, 1, 0, -1, 0, 1, 0, 0),
				},
				type: "added",
			},
			{
				block: {
					uuid: "06eaa521-feca-40d7-a28e-d9d7b06abf8a",
					id: "wing1x3",
					location: new CFrame(-1, 9.5, -6, 0, 0, -1, 0, -1, -0, -1, 0, -0),
				},
				type: "added",
			},
			{
				block: {
					uuid: "5e48fac3-6dae-4769-b5a2-7191aa08b831",
					id: "wing1x3",
					location: new CFrame(-1, 9.5, 6, 0, 0, -1, 0, 1, 0, 1, 0, 0),
				},
				type: "added",
			},
		],
		prepareForWheels: [
			{
				block: {
					uuid: "24622645-9525-44a2-b7b8-8220eeecd74c",
					id: "bearingshaft",
					location: new CFrame(5, 7.5, 2, -1, 0, 0, 0, 1, 0, 0, 0, -1),
				},
				type: "added",
			},
			{
				block: {
					uuid: "ff1beb04-e46b-445c-b407-8dcd06aa1258",
					id: "wedge1x1",
					location: new CFrame(5, 9.5, -2),
				},
				type: "added",
			},
			{
				block: {
					uuid: "4cac21a9-0faf-45c3-bd81-943fb2f6758c",
					id: "smallhingeblock",
					location: new CFrame(-9, 6.5, 0.5, 0, 0, 1, 1, 0, 0, 0, 1, 0),
				},
				type: "added",
			},
			{
				block: {
					uuid: "dbbd3aea-4382-4acf-adc9-e190d56f8c9a",
					id: "wedge1x1",
					location: new CFrame(5, 9.5, 2, -1, 0, 0, 0, 1, 0, 0, 0, -1),
				},
				type: "added",
			},
			{
				block: {
					uuid: "d70db767-ddd3-4135-be92-78a76789fa86",
					id: "bearingshaft",
					location: new CFrame(5, 7.5, -2),
				},
				type: "added",
			},
		],
		placeWheels: [
			{
				block: {
					uuid: "b4c141ad-9881-45db-ab60-08112d380be6",
					id: "oldwheel",
					location: new CFrame(5, 7.5, -3.498046875, 0, 0, 1, 1, 0, 0, 0, 1, 0),
				},
				type: "added",
			},
			{
				block: {
					uuid: "5a070b85-9fc9-4104-9aae-2eccf051d310",
					id: "oldwheel",
					location: new CFrame(5, 7.5, 3.501953125, 0, 0, 1, 1, 0, 0, 0, 1, 0),
				},
				type: "added",
			},
			{
				block: {
					uuid: "1c5846a8-cca9-4c92-9e18-bec57a8d6859",
					id: "oldwheel",
					location: new CFrame(-9, 6.5, 1.501953125, 0, 0, 1, 1, 0, 0, 0, 1, 0),
				},
				type: "added",
			},
		],
		configureAllServos: [
			{
				uuid: "b11c87ba-291b-44f0-8ce7-8cf0678c0ffc",
				value: {
					type: "number",
					controlConfig: {
						enabled: true,
						keys: [{ value: 15 }, { value: -15 }],
					},
				},
				type: "configChanged",
				key: "angle",
			},
			{
				uuid: "5271ad05-e960-4c45-bf62-52b2a0d5873d",
				value: {
					type: "number",
					controlConfig: {
						enabled: true,
						keys: [{ value: 15 }, { value: -15 }],
					},
				},
				type: "configChanged",
				key: "angle",
			},
			{
				uuid: "9a9c54c8-601c-41ec-b755-c5d14db1db37",
				value: {
					type: "number",
					controlConfig: {
						enabled: true,
						keys: [{ value: 15 }, { value: -15 }],
					},
				},
				type: "configChanged",
				key: "angle",
			},
			{
				uuid: "826fc8a9-4fb6-4401-8c76-21610e67c637",
				value: {
					type: "number",
					controlConfig: {
						enabled: true,
						keys: [{ value: 15 }, { value: -15 }],
					},
				},
				type: "configChanged",
				key: "angle",
			},
			{
				uuid: "f957d4b6-6a1c-407d-a6d1-9dfff2abda1e",
				value: {
					type: "number",
					controlConfig: {
						enabled: true,
						keys: [{ value: 15 }, { value: -15 }],
					},
				},
				type: "configChanged",
				key: "angle",
			},
			{
				uuid: "18db45c8-7f7a-4610-97f3-c1af6c8625d6",
				value: {
					type: "number",
					controlConfig: {
						enabled: true,
						keys: [{ value: 15 }, { value: -15 }],
					},
				},
				type: "configChanged",
				key: "angle",
			},
		],
		configureRoll: [
			{
				uuid: "5271ad05-e960-4c45-bf62-52b2a0d5873d",
				value: {
					type: "number",
					controlConfig: {
						enabled: true,
						keys: [{ key: "D" }, { key: "A" }],
					},
				},
				type: "configChanged",
				key: "angle",
			},
			{
				uuid: "9a9c54c8-601c-41ec-b755-c5d14db1db37",
				value: {
					type: "number",
					controlConfig: {
						enabled: true,
						keys: [{ key: "D" }, { key: "A" }],
					},
				},
				type: "configChanged",
				key: "angle",
			},
		],
		configurePitch: [
			{
				uuid: "826fc8a9-4fb6-4401-8c76-21610e67c637",
				value: {
					type: "number",
					controlConfig: {
						enabled: true,
						keys: [{ key: "W" }, { key: "S" }],
					},
				},
				type: "configChanged",
				key: "angle",
			},
			{
				uuid: "f957d4b6-6a1c-407d-a6d1-9dfff2abda1e",
				value: {
					type: "number",
					controlConfig: {
						enabled: true,
						keys: [{ key: "S" }, { key: "W", value: -15 }],
					},
				},
				type: "configChanged",
				key: "angle",
			},
		],
		configureYaw: [
			{
				uuid: "b11c87ba-291b-44f0-8ce7-8cf0678c0ffc",
				value: {
					type: "number",
					controlConfig: {
						enabled: true,
						keys: [{ key: "A" }, { key: "D" }],
					},
				},
				type: "configChanged",
				key: "angle",
			},
			{
				uuid: "18db45c8-7f7a-4610-97f3-c1af6c8625d6",
				value: {
					type: "number",
					controlConfig: {
						enabled: true,
						keys: [{ key: "A" }, { key: "D" }],
					},
				},
				type: "configChanged",
				key: "angle",
			},
		],
		configureEngine: [
			{
				uuid: "b36b920d-6d56-43c5-b63e-12af744b400d",
				value: {
					type: "number",
					controlConfig: {
						enabled: true,
						keys: [{ key: "R" }, { key: "F" }],
					},
				},
				type: "configChanged",
				key: "thrust",
			},
		],
	},
} satisfies TutorialDiffList;

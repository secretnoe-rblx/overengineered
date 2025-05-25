import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		text: {
			displayName: "Text",
			tooltip: "Text on the button.",
			types: {
				string: {
					config: "CLICK ME!",
				},
			},
			connectorHidden: true,
		},
		sharedMode: {
			displayName: "Shared",
			tooltip: "Allows other players to press the button if enabled.",
			types: {
				bool: {
					config: false,
				},
			},
			connectorHidden: true,
		},
		switchMode: {
			displayName: "Switch Mode",
			tooltip: "Button will act as a switch if enabled.",
			types: {
				bool: {
					config: false,
				},
			},
			connectorHidden: true,
		},
		buttonColor: {
			displayName: "Button Color",
			types: {
				color: {
					config: Color3.fromRGB(196, 40, 28),
				},
			},
			connectorHidden: true,
		},
		lampColor: {
			displayName: "Lamp Color",
			types: {
				color: {
					config: Color3.fromRGB(0xff, 0xff, 0xff),
				},
			},
		},
	},
	output: {
		result: {
			displayName: "Pressed",
			types: ["bool"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

type buttonType = BlockModel & {
	Button: BasePart & {
		ClickDetector: ClickDetector;
		SurfaceGui: {
			TextLabel: TextLabel;
		};
		PrismaticConstraint: PrismaticConstraint;
	};
	LED: BasePart;
};

export type { Logic as ButtonBlockLogic };
class Logic extends BlockLogic<typeof definition> {
	constructor(block: BlockLogicArgs) {
		super(definition, block);

		const inst = this.instance as buttonType | undefined;
		if (!inst) return;
		const button = inst.Button;
		const led = inst.LED;

		const baseLEDColor = led.Color;

		const cachedLEDColor = this.initializeInputCache("lampColor");
		const cachedSwitchMode = this.initializeInputCache("switchMode");

		const detector = button.ClickDetector;

		this.event.subscribe(detector.MouseClick, (state) => {
			led.Color = state ? cachedLEDColor.get() : baseLEDColor;
		});

		this.on(({ buttonColor, switchMode, sharedMode }) => {});
	}
}

export const ButtonBlock = {
	...BlockCreation.defaults,
	id: "button",
	displayName: "Button",
	description: "Returns true when the button is clicked or tapped. Can be activated by other players.",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;

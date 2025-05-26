import { Players, RunService } from "@rbxts/services";
import { A2OCRemoteEvent } from "engine/shared/event/PERemoteEvent";
import { t } from "engine/shared/t";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockSynchronizer } from "shared/blockLogic/BlockSynchronizer";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["text", "switchMode", "sharedMode", "lampColor", "buttonColor"],
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
	};
	PrismaticConstraint: PrismaticConstraint;
	LED: BasePart;
};
const baseLEDColor = Color3.fromRGB(17, 17, 17);
const updateDataType = t.interface({
	block: t.any.as<buttonType>(),
	LEDcolor: t.color,
	buttonState: t.boolean,
	buttonColor: t.color,
	text: t.string,
});
const initButtonType = t.interface({
	block: t.any.as<buttonType>(),
	owner: t.any.as<Player>(),
});

type updateData = t.Infer<typeof updateDataType>;
type initButton = t.Infer<typeof initButtonType>;

const updateButtonStuff = ({ block, LEDcolor, buttonColor, buttonState, text }: updateData) => {
	block.LED.Color = buttonState ? LEDcolor : baseLEDColor;
	block.Button.Color = buttonColor;
	block.Button.SurfaceGui.TextLabel.Text = text;
};

const init = ({ block, owner }: initButton) => {
	block.Button.ClickDetector.MaxActivationDistance = math.huge;
	block.Button.ClickDetector.MouseClick.Connect(() => {
		events.click.send(owner, block);
	});
};

const events = {
	update: new BlockSynchronizer("b_button_data_update", updateDataType, updateButtonStuff),
	init: new BlockSynchronizer("b_button_init", initButtonType, init),
	click: new A2OCRemoteEvent<buttonType>("b_button_click", "RemoteEvent"),
} as const;

export type { Logic as ButtonBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition, buttonType> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const inst = this.instance;
		if (!inst) return;
		const button = inst.Button;
		const led = inst.LED;

		const cachedLEDColor = this.initializeInputCache("lampColor");
		const cachedSwitchMode = this.initializeInputCache("switchMode");
		const cachedSharedMode = this.initializeInputCache("sharedMode");

		const pc = inst.PrismaticConstraint;
		const maxLengthMagicNumber = (pc.UpperLimit = 0.3);
		let UpdateOnNextTick = false;
		let isPressed = false;

		const upd = () => {
			events.update.sendOrBurn(
				{
					block: inst,
					buttonState: isPressed,
					LEDcolor: cachedLEDColor.get(),
					buttonColor: button.Color,
					text: button.SurfaceGui.TextLabel.Text,
				},
				this,
			);
			this.output.result.set("bool", isPressed);
		};

		const pressButton = (playerWhoClicked: Player) => {
			if (!cachedSharedMode.get() && Players.LocalPlayer !== playerWhoClicked) return;

			const isSwitch = cachedSwitchMode.get();

			if (isSwitch) {
				isPressed = !isPressed;
				pc.UpperLimit = isPressed ? 0.1 : maxLengthMagicNumber;
				upd();
				return;
			}

			isPressed = true;
			pc.UpperLimit = 0.1;
			led.Color = cachedLEDColor.get();
			task.delay(0.2, () => {
				pc.UpperLimit = maxLengthMagicNumber;
				upd();
			});
			upd();
			UpdateOnNextTick = true;
		};

		// we should probably add server support but noone cares
		if (RunService.IsClient()) {
			this.event.subscribe(events.click.invoked, (block, whoPressed) => {
				if (this.instance !== block) return;
				if (!whoPressed) return;
				pressButton(whoPressed);
			});
		}

		this.onk(["sharedMode"], ({ sharedMode }) => {
			if (!sharedMode) init({ block: inst, owner: Players.LocalPlayer });
			else events.init.sendOrBurn({ block: inst, owner: Players.LocalPlayer }, this);
		});

		this.onk(["buttonColor", "text"], ({ buttonColor, text }) => {
			button.Color = buttonColor;
			button.SurfaceGui.TextLabel.Text = text;
			upd();
		});

		this.onAlwaysInputs(({ switchMode }) => {
			if (UpdateOnNextTick) return (UpdateOnNextTick = false);
			if (!switchMode && isPressed) {
				this.output.result.set("bool", (isPressed = false));
			}
		});
	}
}

export const ButtonBlock = {
	...BlockCreation.defaults,
	id: "button",
	displayName: "Button",
	description: "Returns true when the button is clicked or tapped. Can be activated by other players if configured.",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;

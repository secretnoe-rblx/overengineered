import { Players, RunService } from "@rbxts/services";
import { A2OCRemoteEvent } from "engine/shared/event/PERemoteEvent";
import { Instances } from "engine/shared/fixes/Instances";
import { t } from "engine/shared/t";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockSynchronizer } from "shared/blockLogic/BlockSynchronizer";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { BlockManager } from "shared/building/BlockManager";
import type { PlayerDataStorage } from "client/PlayerDataStorage";
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
	Base: UnionOperation & {
		PressedPosition: Attachment;
		DepressedPosition: Attachment;
	};
	LED: BasePart;
};
const baseLEDColor = Color3.fromRGB(17, 17, 17);
const updateTextDataType = t.interface({
	block: t.instance("Model").as<buttonType>(),
	buttonColor: t.color,
	text: t.string,
});
const updateStateDataType = t.interface({
	block: t.instance("Model").as<buttonType>(),
	LEDcolor: t.color,
	buttonState: t.boolean,
});
const initButtonType = t.interface({
	block: t.instance("Model").as<buttonType>(),
	owner: t.instance("Player"),
});

type updateTextData = t.Infer<typeof updateTextDataType>;
type updateStateData = t.Infer<typeof updateStateDataType>;
type initButton = t.Infer<typeof initButtonType>;

const updateButtonText = ({ block, buttonColor, text }: updateTextData) => {
	block.Button.SurfaceGui.TextLabel.Text = text;
	block.Button.Color = buttonColor;
};

const updateButtonState = ({ block, LEDcolor, buttonState }: updateStateData) => {
	block.LED.Color = buttonState ? LEDcolor : baseLEDColor;
	allButtonStates.set(block, buttonState);
};

const init = ({ block, owner }: initButton) => {
	block.Button.ClickDetector.MaxActivationDistance = math.huge;
	block.Button.ClickDetector.MouseClick.Connect(() => {
		clickEvent.send(owner, block);
	});

	const YScale = BlockManager.manager.scale.get(block)?.Y;
	if (!YScale) return;

	const base = block.Base;
	const button = block.Button;

	// defining constants and magic numbers
	const pressedPosition = new Vector3(0.2 * YScale, 0.2 * YScale, 0.2 * YScale);
	const depressedPosition = new Vector3(0.5 * YScale, 0.5 * YScale, 0.5 * YScale);

	const e = RunService.Heartbeat.Connect(() => {
		const state = allButtonStates.get(block);
		button.Position = base.CFrame.UpVector.mul(state ? pressedPosition : depressedPosition).add(base.Position);
		button.Orientation = base.Orientation;
	});

	block.DescendantRemoving.Connect(() => e.Disconnect());
};

const allButtonStates = new Map<buttonType, boolean>();

const events = {
	updateText: new BlockSynchronizer("b_button_data_update_text", updateTextDataType, updateButtonText),
	updateState: new BlockSynchronizer("b_button_data_update_state", updateStateDataType, updateButtonState),
	init: new BlockSynchronizer("b_button_init", initButtonType, init),
} as const;
events.updateText.sendBackToOwner = true;

const clickEvent = new A2OCRemoteEvent<buttonType>("b_button_click", "RemoteEvent");

export type { Logic as ButtonBlockLogic };
@injectable
class Logic extends InstanceBlockLogic<typeof definition, buttonType> {
	constructor(block: InstanceBlockLogicArgs, @tryInject playerDataStorage?: PlayerDataStorage) {
		super(definition, block);

		const inst = this.instance;
		if (!inst) return;
		const button = inst.Button;
		button.Anchored = true;

		const led = inst.LED;

		const cachedLEDColor = this.initializeInputCache("lampColor");
		const cachedSwitchMode = this.initializeInputCache("switchMode");
		const cachedSharedMode = this.initializeInputCache("sharedMode");

		let UpdateOnNextTick = false;
		let isPressed = false;

		const upd = () => {
			events.updateState.sendOrBurn(
				{
					block: inst,
					buttonState: isPressed,
					LEDcolor: cachedLEDColor.get(),
				},
				this,
			);
		};

		const pressButton = (playerWhoClicked: Player) => {
			if (!cachedSharedMode.get() && Players.LocalPlayer !== playerWhoClicked) return;

			const isSwitch = cachedSwitchMode.get();

			if (isSwitch) {
				this.output.result.set("bool", (isPressed = !isPressed));
				upd();
				return;
			}

			this.output.result.set("bool", (isPressed = true));
			const triggerLamp = playerDataStorage?.config.get().graphics.logicEffects === true;
			if (triggerLamp) {
				led.Color = cachedLEDColor.get();
				upd();
			}
			UpdateOnNextTick = true;
		};

		// we should probably add server support but noone cares
		if (RunService.IsClient()) {
			this.event.subscribe(clickEvent.invoked, (block, whoPressed) => {
				if (this.instance !== block) return;
				if (!whoPressed) return;
				pressButton(whoPressed);
			});
		}

		this.onEnable(() => this.output.result.set("bool", false));

		this.onk(["sharedMode"], ({ sharedMode }) => {
			if (!sharedMode) init({ block: inst, owner: Players.LocalPlayer });
			else events.init.sendOrBurn({ block: inst, owner: Players.LocalPlayer }, this);
		});

		this.onk(["buttonColor", "text"], ({ buttonColor, text }) => {
			button.Color = buttonColor;
			button.SurfaceGui.TextLabel.Text = text;

			events.updateText.sendOrBurn(
				{
					block: inst,
					text: button.SurfaceGui.TextLabel.Text,
					buttonColor: buttonColor,
				},
				this,
			);
		});

		this.onAlwaysInputs(({ switchMode }) => {
			if (UpdateOnNextTick) return (UpdateOnNextTick = false);
			if (!switchMode && isPressed) {
				this.output.result.set("bool", (isPressed = false));
				upd();
			}
		});
	}
}

const immediate = BlockCreation.immediate(definition, (block: buttonType, config) => {
	const btn = Instances.waitForChild(block, "Button");
	Instances.waitForChild(btn, "SurfaceGui", "TextLabel");

	events.updateText.send({
		block,
		buttonColor: BlockCreation.defaultIfWiredUnset(
			config?.buttonColor,
			definition.input.buttonColor.types.color.config,
		),
		text: BlockCreation.defaultIfWiredUnset(config?.text, definition.input.text.types.string.config),
	});
});

export const ButtonBlock = {
	...BlockCreation.defaults,
	id: "button",
	displayName: "Button",
	description: "Returns true when the button is clicked or tapped. Can be activated by other players if configured.",

	logic: { definition, ctor: Logic, events, immediate },
} as const satisfies BlockBuilder;

import { BlockListBuilder } from "shared/blocks/BlockListBuilder";
import { AltimeterBlock } from "shared/blocks/blocks/AltimeterBlock";
import { AngleSensorBlock } from "shared/blocks/blocks/AngleSensorBlock";
import { DelayBlock } from "shared/blocks/blocks/DelayBlock";
import { DisconnectBlock } from "shared/blocks/blocks/DisconnectBlock";
import { BasicOperationBlocks } from "shared/blocks/blocks/grouped/BasicOperationBlocks";
import { BuildingBlocks } from "shared/blocks/blocks/grouped/BuildingBlocks";
import { LampBlocks } from "shared/blocks/blocks/grouped/LampBlocks";
import { WheelBlocks } from "shared/blocks/blocks/grouped/WheelBlocks";
import { KeySensorBlock } from "shared/blocks/blocks/KeySensorBlock";
import { LaserBlock } from "shared/blocks/blocks/LaserBlock";
import { MouseSensorBlock } from "shared/blocks/blocks/MouseSensorBlock";
import { OwnerCameraLocatorBlock } from "shared/blocks/blocks/OwnerCameraLocatorBlock";
import { OwnerLocatorBlock } from "shared/blocks/blocks/OwnerLocatorBlock";
import { RocketBlocks } from "shared/blocks/blocks/RocketEngineBlocks";
import { ScreenBlock } from "shared/blocks/blocks/ScreenBlock";
import { VehicleSeatBlock } from "shared/blocks/blocks/VehicleSeatBlock";
import type { BlockBuilder } from "shared/blocks/Block";

export const CreateSandboxBlocks = (): BlockList => {
	const blocksArr = [
		...BuildingBlocks,
		...BasicOperationBlocks,
		...WheelBlocks,
		...LampBlocks,
		...RocketBlocks,

		DisconnectBlock,
		DelayBlock,
		ScreenBlock,
		LaserBlock,
		VehicleSeatBlock,

		AltimeterBlock,
		KeySensorBlock,
		AngleSensorBlock,
		OwnerLocatorBlock,
		OwnerCameraLocatorBlock,
		MouseSensorBlock,
		//
	] as const satisfies BlockBuilder[];

	return BlockListBuilder.buildBlockList(blocksArr);
};

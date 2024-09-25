import { RunService } from "@rbxts/services";
import { BlockListBuilder } from "shared/blocks/BlockListBuilder";
import { AltimeterBlock } from "shared/blocks/blocks/AltimeterBlock";
import { AngleSensorBlock } from "shared/blocks/blocks/AngleSensorBlock";
import { BallastBlock } from "shared/blocks/blocks/BallastBlock";
import { BracedShaftBlock } from "shared/blocks/blocks/BracedShaftBlock";
import { ControllerBlock } from "shared/blocks/blocks/ControllerBlock";
import { CounterBlock } from "shared/blocks/blocks/CounterBlock";
import { DelayBlock } from "shared/blocks/blocks/DelayBlock";
import { DisconnectBlock } from "shared/blocks/blocks/DisconnectBlock";
import { FireSensorBlock } from "shared/blocks/blocks/FireSensorBlock";
import { GravitySensorBlock } from "shared/blocks/blocks/GravitySensorBlock";
import { BasicLogicGateBlocks } from "shared/blocks/blocks/grouped/BasicLogicGateBlocks";
import { BasicOperationBlocks } from "shared/blocks/blocks/grouped/BasicOperationBlocks";
import { BuildingBlocks } from "shared/blocks/blocks/grouped/BuildingBlocks";
import { LampBlocks } from "shared/blocks/blocks/grouped/LampBlocks";
import { MechanicalBlocks } from "shared/blocks/blocks/grouped/MechanicalBlocks";
import { ServoMotorBlocks } from "shared/blocks/blocks/grouped/ServoMotorBlocks";
import { TestBlocks } from "shared/blocks/blocks/grouped/TestBlocks";
import { TNTBlocks } from "shared/blocks/blocks/grouped/TNTBlocks";
import { WheelBlocks } from "shared/blocks/blocks/grouped/WheelBlocks";
import { WingBlocks } from "shared/blocks/blocks/grouped/WingsBlocks";
import { HeliumBlock } from "shared/blocks/blocks/HeliumBlock";
import { ImpulseGeneratorBlock } from "shared/blocks/blocks/ImpulseGeneratorBlock";
import { KeySensorBlock } from "shared/blocks/blocks/KeySensorBlock";
import { LaserBlock } from "shared/blocks/blocks/LaserBlock";
import { LedDisplayBlock } from "shared/blocks/blocks/LedDisplayBlock";
import { LogicMemoryBlock } from "shared/blocks/blocks/LogicMemoryBlock";
import { LogicMemoryLegacyBlock } from "shared/blocks/blocks/LogicMemoryOldBlock";
import { MagnetBlock } from "shared/blocks/blocks/MagnetBlock";
import { MassSensorBlock } from "shared/blocks/blocks/MassSensorBlock";
import { MotorBlock } from "shared/blocks/blocks/MotorBlock";
import { MouseSensorBlock } from "shared/blocks/blocks/MouseSensorBlock";
import { OwnerCameraLocatorBlock } from "shared/blocks/blocks/OwnerCameraLocatorBlock";
import { OwnerLocatorBlock } from "shared/blocks/blocks/OwnerLocatorBlock";
import { PassengerSeatBlock } from "shared/blocks/blocks/PassengerSeatBlock";
import { PistonBlock } from "shared/blocks/blocks/PistonBlock";
import { RadarSectionBlock } from "shared/blocks/blocks/RadarSectionBlock";
import { RadioReceiverBlock } from "shared/blocks/blocks/RadioReceiverBlock";
import { RadioTransmitterBlock } from "shared/blocks/blocks/RadioTransmitterBlock";
import { RandomAccessMemoryBlock } from "shared/blocks/blocks/RandomAccessMemoryBlock";
import { RandomBlock } from "shared/blocks/blocks/RandomBlock";
import { ReadonlyMemoryBlock } from "shared/blocks/blocks/ReadonlyMemoryBlock";
import { RocketBlocks } from "shared/blocks/blocks/RocketEngineBlocks";
import { RopeBlock } from "shared/blocks/blocks/RopeBlock";
import { RCSEngineBlock } from "shared/blocks/blocks/RSCEngineBlock";
import { ScreenBlock } from "shared/blocks/blocks/ScreenBlock";
import { SevenSegmentDisplayBlock } from "shared/blocks/blocks/SevenSegmentDisplayBlock";
import { SingleImpulseBlock } from "shared/blocks/blocks/SingleImpulseBlock";
import { SpeedometerBlock } from "shared/blocks/blocks/SpeedometerBlock";
import { StackMemoryBlock } from "shared/blocks/blocks/StackMemoryBlock";
import { SuspensionBlock } from "shared/blocks/blocks/SuspensionBlock";
import { TpsCounterBlock } from "shared/blocks/blocks/TpsCounterBlock";
import { VehicleSeatBlock } from "shared/blocks/blocks/VehicleSeatBlock";
import type { BlockBuilder } from "shared/blocks/Block";

export const CreateSandboxBlocks = (): BlockList => {
	const blocksArr: BlockBuilder[] = [
		...BuildingBlocks,
		...MechanicalBlocks,
		...BasicOperationBlocks,
		...BasicLogicGateBlocks,
		...WheelBlocks,
		...WingBlocks,
		...LampBlocks,
		...RocketBlocks,
		...ServoMotorBlocks,
		...TNTBlocks,

		PistonBlock,
		MotorBlock,
		RCSEngineBlock,
		DisconnectBlock,
		RopeBlock,
		SuspensionBlock,
		BallastBlock,
		HeliumBlock,
		MagnetBlock,
		BracedShaftBlock,

		ScreenBlock,
		LedDisplayBlock,
		SevenSegmentDisplayBlock,

		VehicleSeatBlock,
		PassengerSeatBlock,

		DelayBlock,
		SingleImpulseBlock,
		ImpulseGeneratorBlock,
		CounterBlock,
		TpsCounterBlock,
		LogicMemoryBlock,
		LogicMemoryLegacyBlock,
		RandomAccessMemoryBlock,
		StackMemoryBlock,
		ReadonlyMemoryBlock,
		RandomBlock,

		AltimeterBlock,
		KeySensorBlock,
		ControllerBlock,
		AngleSensorBlock,
		FireSensorBlock,
		OwnerLocatorBlock,
		OwnerCameraLocatorBlock,
		GravitySensorBlock,
		MassSensorBlock,
		MouseSensorBlock,
		RadioReceiverBlock,
		RadioTransmitterBlock,
		RadarSectionBlock,
		SpeedometerBlock,
		LaserBlock,
	];

	if (RunService.IsStudio()) {
		for (const block of TestBlocks) {
			blocksArr.push(block);
		}
	}

	return BlockListBuilder.buildBlockList(blocksArr);
};

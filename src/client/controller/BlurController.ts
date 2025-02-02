import { Lighting } from "@rbxts/services";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { Transforms } from "engine/shared/component/Transforms";
import { HostedService } from "engine/shared/di/HostedService";

export class BlurController extends HostedService {
	readonly blur;

	constructor() {
		super();

		const blur = this.parent(new InstanceComponent(Lighting.WaitForChild("Blur") as BlurEffect));

		this.blur = blur.valuesComponent().get("Size");
		this.blur.addBasicTransform(Transforms.quadOut02);
	}
}

import { ReplicatedStorage } from "@rbxts/services";
import { LocalPlayer } from "engine/client/LocalPlayer";
import { ButtonControl } from "client/gui/controls/Button";
import { Gui } from "client/gui/Gui";
import { Popup } from "client/gui/Popup";
import { WikiCategoriesControl, WikiContentControl } from "client/wiki/WikiControl";
import type { WikiCategoriesControlDefinition, WikiContentControlDefinition } from "client/wiki/WikiControl";
import type { GameHostBuilder } from "engine/shared/GameHostBuilder";

namespace WikiStorage {
	let cache: readonly WikiEntry[] | undefined = undefined;

	export function getAll(di: DIContainer): readonly WikiEntry[] {
		function findAllWikis(): readonly ModuleScript[] {
			const ret: ModuleScript[] = [];
			const visit = (instance: Instance) => {
				if (instance.IsA("ModuleScript") && instance.Name.find(".wiki")[0]) {
					ret.push(instance);
				}

				for (const child of instance.GetChildren()) {
					visit(child);
				}
			};

			visit(ReplicatedStorage);
			visit(LocalPlayer.player.WaitForChild("PlayerScripts"));

			return ret;
		}

		if (cache) return cache;

		const found: WikiEntry[] = [];
		for (const scr of findAllWikis()) {
			const w = require(scr) as {
				readonly _Wiki?: WikiEntry;
				readonly _Wikis?: (di: DIContainer) => readonly WikiEntry[];
			};

			if (w._Wiki) {
				found.push(w._Wiki);
			}
			if (w._Wikis) {
				for (const wiki of w._Wikis(di)) {
					found.push(wiki);
				}
			}
		}

		return (cache = found);
	}
}

export type WikiPopupDefinition = GuiObject & {
	readonly Heading: Frame & {
		readonly CloseButton: TextButton;
		readonly TitleLabel: TextLabel;
	};
	readonly Content: GuiObject & {
		readonly Categories: WikiCategoriesControlDefinition;
		readonly Content: WikiContentControlDefinition;
	};
};

@injectable
export class WikiPopup extends Popup<WikiPopupDefinition> {
	static addAsService(host: GameHostBuilder) {
		const gui = Gui.getGameUI<{ Popup: { Wiki: WikiPopupDefinition } }>().Popup.Wiki;
		host.services.registerTransientFunc((ctx) => ctx.resolveForeignClass(this, [gui.Clone()]));
	}

	constructor(gui: WikiPopupDefinition, @inject blockList: BlockList, @inject di: DIContainer) {
		super(gui);

		this.add(new ButtonControl(gui.Heading.CloseButton, () => this.hide()));

		const sidebar = this.add(new WikiCategoriesControl(gui.Content.Categories));
		const content = this.add(new WikiContentControl(gui.Content.Content, blockList));
		content.requestedTeleport.Connect((id) => sidebar.select(id));
		content.set({ id: "", title: "", tags: new ReadonlySet(), content: [] });

		const wikis = asObject(WikiStorage.getAll(di).mapToMap((w) => $tuple(w.id, w)));
		sidebar.addItems(
			asMap(wikis)
				.map((k, w) => ({ id: k, title: w.title }))
				.sort((l, r) => l.id < r.id),
		);
		this.event.subscribe(sidebar.clicked, (id) => content.set(wikis[id]));

		this.onEnable(() => sidebar.select("blocks"));
	}
}

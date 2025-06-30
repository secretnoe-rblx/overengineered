import { ReplicatedStorage } from "@rbxts/services";
import { Interface } from "client/gui/Interface";
import { WikiCategoriesControl, WikiContentControl } from "client/wiki/WikiControl";
import { ButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { LocalPlayer } from "engine/client/LocalPlayer";
import type { WikiCategoriesControlDefinition, WikiContentControlDefinition } from "client/wiki/WikiControl";

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
			visit(LocalPlayer.player.FindFirstChildOfClass("PlayerScripts")!);

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

type WikiPopupDefinition = GuiObject & {
	readonly Heading: Frame & {
		readonly CloseButton: TextButton;
		readonly TitleLabel: TextLabel;
	};
	readonly Content: GuiObject & {
		readonly Categories: WikiCategoriesControlDefinition;
		readonly Content: WikiContentControlDefinition;
	};
};

export class WikiPopup extends Control<WikiPopupDefinition> {
	constructor() {
		const gui = Interface.getGameUI<{ Popup: { Wiki: WikiPopupDefinition } }>().Popup.Wiki.Clone();
		super(gui);

		this.$onInjectAuto((blockList: BlockList, di: DIContainer) => {
			this.parent(new ButtonControl(gui.Heading.CloseButton, () => this.hide()));

			const sidebar = this.parent(new WikiCategoriesControl(gui.Content.Categories));
			const content = this.parent(new WikiContentControl(gui.Content.Content, blockList));
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
		});
	}
}

/// <reference types="../../node_modules/@rbxts/types/include/generated/PluginSecurity.d.ts" />
if (game.GetService("RunService").IsRunning()) {
	new Instance("BindableEvent").Event.Wait();
}

declare const plugin: Plugin;
const log = (...args: unknown[]) => print("[AWMP]", ...args);

log("Initializing");

import { CollectionService, HttpService } from "@rbxts/services";
import { LabelControl } from "client/gui/controls/LabelControl";
import { TextButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { TextBoxControl } from "engine/client/gui/TextBoxControl";
import { Component } from "engine/shared/component/Component";
import { Element } from "engine/shared/Element";
import { Sets } from "engine/shared/fixes/Arrays";
import { Instances } from "engine/shared/fixes/Instances";

const selectionService = game.GetService("Selection");
const historyService = game.GetService("ChangeHistoryService");

let properties: { readonly [k in keyof Instances]: readonly string[] } = undefined!;
task.spawn(() => {
	type member = { MemberType: string; Name: string; Tags?: string[]; Security?: { Read: unknown; Write: unknown } };
	type clazz = { Name: keyof Instances; Superclass: keyof Instances; Members: member[] };
	type dump = { Classes: clazz[] };

	const dump = HttpService.JSONDecode(
		HttpService.GetAsync(
			"https://raw.githubusercontent.com/MaximumADHD/Roblox-Client-Tracker/refs/heads/roblox/API-Dump.json",
		),
	) as dump;
	log("Fetched dump of:", dump?.Classes?.size());

	const keyedDump = dump.Classes.mapToMap((c) => $tuple(c.Name, c));

	const props: { [k in keyof Instances]?: readonly string[] } = {};
	const add = (props: string[], clazz: clazz): void => {
		for (const prop of clazz.Members) {
			if (prop.Name === "Parent") continue;
			if (prop.MemberType !== "Property") continue;

			if (prop.Tags?.contains("ReadOnly")) continue;
			if (prop.Security?.Read === "LocalUserSecurity") continue;
			if (prop.Security?.Write === "LocalUserSecurity") continue;
			if (prop.Security?.Read === "RobloxSecurity") continue;
			if (prop.Security?.Write === "RobloxSecurity") continue;
			if (prop.Security?.Read === "RobloxScriptSecurity") continue;
			if (prop.Security?.Write === "RobloxScriptSecurity") continue;
			if (prop.Security?.Read === "NotAccessibleSecurity") continue;
			if (prop.Security?.Write === "NotAccessibleSecurity") continue;

			props.push(prop.Name);
		}

		if (clazz.Superclass) {
			const superclass = keyedDump.get(clazz.Superclass);
			if (!superclass) return;

			add(props, superclass);
		}
	};

	for (const clazz of dump.Classes) {
		const ps: string[] = [];
		add(ps, clazz);

		props[clazz.Name] = ps;
	}

	properties = props as Required<typeof props>;
});

while (!properties) {
	task.wait();
}

//

namespace Prefabing {
	const prefix = "awmp";
	const guidKey = `${prefix}_guid`;
	const prefabOfKey = `${prefix}_prefabOf`;

	/** Name for a Folder that holds the prefab info */
	const storageFolderName = `__${prefix}_storage`;
	function isStorageFolder(instance: Instance): instance is Folder {
		return instance.Name === storageFolderName;
	}
	function tryGetStorageOf(instance: Instance): Folder | undefined {
		return instance.FindFirstChild(storageFolderName) as Folder | undefined;
	}
	function getStorageOf(instance: Instance): Folder {
		const existing = tryGetStorageOf(instance);
		if (existing) return existing;

		return Element.create("Folder", { Name: storageFolderName, Parent: instance });
	}
	function deleteStorageFolderIfEmpty(folder: Folder): asserts folder is never {
		if (folder.GetAttributes().size() !== 0) return;
		if (folder.GetTags().size() !== 0) return;

		folder.Destroy();
	}

	const addedInstanceKey = `${prefix}_added`;
	/** Is instance marked as added, as to not remove it when resetting */
	function isAddedInstance(instance: Instance): boolean {
		return tryGetStorageOf(instance)?.HasTag(addedInstanceKey) ?? false;
	}
	/** Mark instance as added, as to not remove it when resetting */
	export function markInstanceAsAdded(instance: Instance) {
		getStorageOf(instance).AddTag(addedInstanceKey);
	}
	export function unmarkInstanceAsAdded(instance: Instance) {
		const storage = tryGetStorageOf(instance);
		if (!storage) return;

		storage.RemoveTag(addedInstanceKey);
		deleteStorageFolderIfEmpty(storage);
	}

	const changedPropertiesKey = "changedProperties";
	export function getPropertiesMarkedAsChanged(instance: Instance): readonly string[] {
		return HttpService.JSONDecode(
			(getStorageOf(instance).GetAttribute(changedPropertiesKey) as string | undefined) ?? "[]",
		) as readonly string[];
	}
	function setOnlyPropertiesAsChanged(instance: Instance, properties: readonly string[]) {
		const storage = getStorageOf(instance);

		if (properties.size() === 0) {
			storage.SetAttribute(changedPropertiesKey, undefined);
			deleteStorageFolderIfEmpty(storage);
		} else {
			storage.SetAttribute(changedPropertiesKey, HttpService.JSONEncode(properties));
		}
	}
	export function markPropertiesAsChanged(instance: Instance, properties: readonly string[]) {
		const existing = getPropertiesMarkedAsChanged(instance);
		setOnlyPropertiesAsChanged(instance, [...new Set([...existing, ...properties])]);
	}
	export function unmarkPropertiesAsChanged(instance: Instance, properties: readonly string[]) {
		const existing = getPropertiesMarkedAsChanged(instance);
		setOnlyPropertiesAsChanged(instance, existing.except(properties));
	}

	function getGuidOfInstance(instance: Instance): string {
		const storage = getStorageOf(instance);

		const existing = storage.GetAttribute(guidKey) as string | undefined;
		if (existing) return existing;

		const guid = HttpService.GenerateGUID(false);
		storage.SetAttribute(guidKey, guid);
		storage.AddTag(`${guidKey}_${guid}`);
		return guid;
	}
	function getPrefabOf(instance: Instance): Instance | undefined {
		const storage = tryGetStorageOf(instance);
		if (!storage) return undefined;

		const guid = storage.GetAttribute(prefabOfKey) as string | undefined;
		if (!guid) return undefined;

		return CollectionService.GetTagged(`${guidKey}_${guid}`)[0]?.Parent;
	}
	function setPrefabOf(instance: Instance, prefab: Instance) {
		const storage = getStorageOf(instance);
		storage.SetAttribute(prefabOfKey, getGuidOfInstance(prefab));
	}

	/** Get prefab of the provided instance, recursively traversing through .Parent */
	function getPrefabOfRecursiveWithPathToThis(
		instance: Instance,
	): LuaTuple<[Instance, readonly string[]] | [undefined, undefined]> {
		const path: string[] = [];
		let parent: Instance | undefined = instance;
		while (parent) {
			const prefab = getPrefabOf(parent);
			if (prefab) return $tuple(prefab, path);

			parent = instance.Parent;
		}

		return $tuple(undefined, undefined);
	}

	function copyProperties(to: Instance, from: Instance, keys?: readonly string[]) {
		if (to.ClassName !== from.ClassName) {
			throw `Trying to reset ${to.ClassName} to ${from.ClassName}`;
		}

		const props = keys ?? properties[to.ClassName as keyof Instances];
		for (const property of props) {
			type writableInstance = Instance & { [k in string]: unknown };
			(to as writableInstance)[property] = (from as writableInstance)[property];
		}
	}

	function resetInstancePropertiesToPrefab(instance: Instance, prefab: Instance) {
		copyProperties(instance, prefab);
	}
	function resetInstanceChildrenToPrefab(instance: Instance, prefab: Instance) {
		for (const child of instance.GetChildren()) {
			if (isStorageFolder(child)) continue;
			if (isAddedInstance(child)) continue;

			const prefabChild = prefab.FindFirstChild(child.Name);
			if (!prefabChild) {
				child.Destroy();
				break;
			}

			resetInstanceWithChildrenToPrefab(child, prefabChild);
		}

		for (const prefabChild of prefab.GetChildren()) {
			if (instance.FindFirstChild(prefabChild.Name)) continue;
			if (isStorageFolder(prefab)) continue;

			const clone = prefabChild.Clone();
			clone.Parent = instance;
		}
	}
	function resetInstanceWithChildrenToPrefab(instance: Instance, prefab: Instance) {
		resetInstancePropertiesToPrefab(instance, prefab);
		resetInstanceChildrenToPrefab(instance, prefab);
	}
	export function resetInstanceWithChildrenToItsPrefab(instance: Instance) {
		const prefab = getPrefabOf(instance);
		if (!prefab) throw `Instance ${instance.Name} does not have a prefab`;

		resetInstanceWithChildrenToPrefab(instance, prefab);
	}

	export function createCopyOfPrefab<T extends Instance>(prefab: T): T {
		const copy = prefab.Clone();
		setPrefabOf(copy, prefab);

		return copy;
	}

	function applyChangesOfInstanceProperties(instance: Instance, prefab: Instance) {
		copyProperties(prefab, instance);
	}
	function applyChangesOfInstanceChildren(instance: Instance, prefab: Instance) {
		for (const child of instance.GetChildren()) {
			if (isStorageFolder(child)) continue;

			const prefabChild = prefab.FindFirstChild(child.Name);
			if (prefabChild) {
				applyChangesToInstancePrefab(instance, prefabChild);
			} else {
				const clone = child.Clone();
				clone.Parent = prefab;
			}
		}
	}
	function applyChangesToInstancePrefab(instance: Instance, prefab: Instance) {
		unmarkInstanceAsAdded(instance);

		applyChangesOfInstanceProperties(instance, prefab);
		applyChangesOfInstanceChildren(instance, prefab);
	}
	// export function applyChanges(instance: Instance) {
	// 	const prefab = getPrefabOf(instance);
	// 	if (!prefab) throw `Instance ${instance.Name} doesn't have a prefab`;

	// 	applyChangesToInstancePrefab(instance, prefab);
	// }

	/** Apply change of changing properties in the provided instance to a prefab.
	 * @param keys The changed properties or undefined for every property
	 */
	export function applyPropertyChanges(instance: Instance, keys: readonly string[] | undefined) {
		const [prefab, path] = getPrefabOfRecursiveWithPathToThis(instance);
		if (!prefab) throw `Instance ${instance.Name} doesn't have a prefab`;

		keys ??= getPropertiesMarkedAsChanged(instance);
		copyProperties(prefab, instance, keys);
		unmarkPropertiesAsChanged(instance, keys);
	}

	/** Apply change of adding a new Instance to a prefab.
	 * @param instance The added instance
	 */
	export function applyAddedChange(instance: Instance) {
		if (!isAddedInstance(instance)) {
			throw `Instance ${instance.Name} is not an added instance`;
		}

		const [prefab, path] = getPrefabOfRecursiveWithPathToThis(instance);
		if (!prefab) throw `Instance ${instance.Name} doesn't have a prefab`;

		unmarkInstanceAsAdded(instance);

		const newPath = [...path];
		newPath.pop();

		const prefabParent = Instances.waitForChild(prefab, ...newPath);

		const clone = instance.Clone();
		clone.Parent = prefabParent;
	}
}
namespace Prefabing2 {
	/* Definitions
	 * Prefab: An Instance that works as a source to other instances
	 * CFab: An Instance that is a copy of a prefab
	 * DFab: An Instance that is a descendand of a cfab, including the cfab itself
	 */

	export type PrefabGuid = string & { /** @deprecated */ __nominal: "PrefabGuid" };
	export interface DFabInfo {
		readonly instance: Instance;
		/** Prefab of the **dfab** specifically, not the parent prefab */
		readonly prefab: Instance;

		readonly cfabInfo: CFabInfo;
		readonly pathFromCFab: readonly string[];

		readonly data?: DFabData;
	}
	export interface CFabInfo {
		readonly instance: Instance;
		readonly prefab: Instance;
		readonly data: CFabData;
	}

	export interface DFabData {
		readonly added?: boolean;
		readonly changedProperties?: ReadonlySet<string>;
	}
	export interface CFabData {
		// readonly prefab: PrefabGuid;
	}

	export interface PrefabData {
		readonly guid: PrefabGuid;
	}

	const prefix = "awmp";

	/** Name for a Folder that holds the prefab info */
	const storageFolderName = `__${prefix}_storage`;
	// function isStorageFolder(instance: Instance): instance is Folder {
	// 	return instance.Name === storageFolderName;
	// }
	function tryGetStorageOf(instance: Instance): Folder | undefined {
		return instance.FindFirstChild(storageFolderName) as Folder | undefined;
	}
	function getStorageOf(instance: Instance): Folder {
		const existing = tryGetStorageOf(instance);
		if (existing) return existing;

		return Element.create("Folder", { Name: storageFolderName, Parent: instance });
	}
	function deleteStorageFolderIfEmpty(folder: Folder): asserts folder is never {
		if (folder.GetAttributes().size() !== 0) return;
		if (folder.GetTags().size() !== 0) return;

		folder.Destroy();
	}

	function _readWriteDataFunctions<T extends object>(
		key: string,
	): LuaTuple<[(instance: Instance) => T | undefined, (instance: Instance, data: T | undefined) => void]> {
		return $tuple(
			(instance) => {
				const storage = tryGetStorageOf(instance);
				if (!storage) return undefined;

				const data = storage.GetAttribute(key) as string | undefined;
				if (!data) {
					deleteStorageFolderIfEmpty(storage);
					return undefined;
				}

				return HttpService.JSONDecode(data) as T;
			},
			(instance, data) => {
				const storage = getStorageOf(instance);
				storage.SetAttribute(key, data && HttpService.JSONEncode(data));

				if (!data) {
					deleteStorageFolderIfEmpty(storage);
				}
			},
		);
	}

	const [readPrefabData, writePrefabData] = _readWriteDataFunctions<PrefabData>(`${prefix}_prefabdata`);
	function readPrefabDataOrMakePrefab(instance: Instance): PrefabData {
		const data = readPrefabData(instance);
		if (data) return data;

		const d: PrefabData = { guid: HttpService.GenerateGUID(false) as PrefabGuid };
		writePrefabData(instance, d);

		return d;
	}

	const [readDFabData, writeDFabData] = _readWriteDataFunctions<DFabData>(`${prefix}_dfabdata`);
	const [readCFabData, writeCFabData] = _readWriteDataFunctions<CFabData>(`${prefix}_cfabdata`);

	const cfabPrefabKey = "prefab";
	function writeCFabPrefab(instance: Instance, prefab: Instance) {
		const storage = getStorageOf(instance);
		let prefabStorage = storage.FindFirstChild(cfabPrefabKey) as ObjectValue | undefined;
		if (!prefabStorage) {
			prefabStorage = Element.create("ObjectValue");
			prefabStorage.Name = cfabPrefabKey;
			prefabStorage.Parent = storage;
		}

		prefabStorage.Value = prefab;
	}

	function getPrefabOfCFab(instance: Instance): Instance | undefined {
		const storage = tryGetStorageOf(instance);
		if (!storage) return undefined;

		const prefabStorage = storage.FindFirstChild(cfabPrefabKey) as ObjectValue | undefined;
		if (!prefabStorage) return undefined;

		return prefabStorage.Value;
	}

	function getCFabOfDFabWithPath(instance: Instance): LuaTuple<[Instance, string[]] | [undefined, undefined]> {
		const path: string[] = [];
		let parent: Instance | undefined = instance;
		while (parent) {
			const data = readCFabData(parent);
			if (data) return $tuple(parent, path);

			path.unshift(parent.Name);
			parent = parent.Parent;
		}

		return $tuple(undefined, undefined);
	}

	function getCFabInfo(instance: Instance): CFabInfo | undefined {
		const data = readCFabData(instance);
		if (!data) throw "Not a CFab";

		const prefab = getPrefabOfCFab(instance);
		if (!prefab) throw "CFab has no prefab";

		return {
			instance,
			data,
			prefab,
		};
	}
	export function getDFabInfo(instance: Instance): DFabInfo | undefined {
		const [cfab, pathFromCFab] = getCFabOfDFabWithPath(instance);
		if (!cfab) return undefined;

		const cfabInfo = getCFabInfo(cfab);
		if (!cfabInfo) return undefined;

		const data = readDFabData(instance);
		const prefab = Instances.waitForChild(cfabInfo.prefab, ...pathFromCFab);

		return {
			prefab,
			instance,
			cfabInfo,
			data,
			pathFromCFab,
		};
	}

	export function clonePrefab(prefab: Instance): Instance {
		const prefabData = readPrefabDataOrMakePrefab(prefab);

		const clone = prefab.Clone();
		clone.Name += " (clone)";
		writeCFabData(clone, {});
		writeCFabPrefab(clone, prefab);
		writePrefabData(clone, undefined);

		return clone;
	}

	export namespace R {
		export function markPropertiesAsChanged(instance: Instance, keys: readonly string[]): void {
			const info = getDFabInfo(instance);
			if (!info) throw "Not a DFab";

			writeDFabData(instance, {
				...info.data,
				changedProperties: info.data?.changedProperties?.withAdded(keys) ?? new Set(keys),
			});
		}
		export function unmarkPropertiesAsChanged(instance: Instance, keys: readonly string[]): void {
			const info = getDFabInfo(instance);
			if (!info) throw "Not a DFab";

			writeDFabData(instance, {
				...info.data,
				changedProperties: info.data?.changedProperties?.except(keys),
			});
		}
		export function resetPropertiesOfDFab(instance: Instance, keys?: readonly string[]): void {
			const info = getDFabInfo(instance);
			if (!info) throw "Not a DFab";

			keys ??= properties[instance.ClassName as keyof Instances] //
				.except(info.data?.changedProperties?.toArray() ?? []);

			for (const key of keys) {
				type wr = { [k in string]: unknown };
				(instance as unknown as wr)[key] = (info.prefab as unknown as wr)[key];
			}
		}
	}
}

type PluginGuiDefinition = GuiObject;
class PluginControl extends Control<PluginGuiDefinition> {
	constructor(gui: PluginGuiDefinition) {
		super(gui);

		class Data extends Control {
			constructor() {
				const gui = Element.create(
					"Frame",
					{
						LayoutOrder: 0,
						BackgroundTransparency: 0.5,
						BackgroundColor3: Color3.fromRGB(0, 0, 128),
						Size: new UDim2(),
						AutomaticSize: Enum.AutomaticSize.XY,
					},
					{ list: Element.create("UIListLayout", { FillDirection: Enum.FillDirection.Vertical }) },
				);
				super(gui);

				const newLabel = () => {
					return new LabelControl(
						Element.create("TextLabel", {
							AutomaticSize: Enum.AutomaticSize.XY,
							TextSize: 16,
						}),
					);
				};

				const textSelected = this.parent(newLabel());
				const textChangedProperties = this.parent(newLabel());

				this.event.subscribeImmediately(selectionService.SelectionChanged, () => {
					const selected = selectionService.Get();

					textSelected.value.set(`Selected: ${selected.map((s) => s.Name).join()}`);

					const dfabs = selected.mapFiltered(Prefabing2.getDFabInfo);
					const changedProperties = Sets.intersect(
						dfabs.map((d) => d?.data?.changedProperties ?? new Set<string>()),
					);
					textChangedProperties.value.set(`Changed: ${changedProperties.join()}`);
				});
			}
		}
		this.parentGui(new Data());

		//

		Element.create("UIListLayout", { Parent: gui });

		this.parent(TextButtonControl.create({ Text: "GETDFABINFO", Size: new UDim2(0, 200, 0, 50) })) //
			.addButtonAction(() => {
				for (const instance of selectionService.Get()) {
					const info = Prefabing2.getDFabInfo(instance);
					print(instance.Name, info);
				}
			});
		this.parent(TextButtonControl.create({ Text: "Clone2", Size: new UDim2(0, 200, 0, 50) })) //
			.addButtonAction(() => {
				for (const instance of selectionService.Get()) {
					const clone = Prefabing2.clonePrefab(instance);
					clone.Parent = instance.Parent;
				}
			});

		const propertyInput = this.parent(
			new TextBoxControl(
				Element.create("TextBox", { LayoutOrder: 0, PlaceholderText: "prop", Size: new UDim2(0, 200, 0, 50) }),
			),
		);
		this.parent(TextButtonControl.create({ Text: "Mark property as changed", Size: new UDim2(0, 200, 0, 50) })) //
			.addButtonAction(() => {
				for (const instance of selectionService.Get()) {
					Prefabing2.R.markPropertiesAsChanged(instance, [propertyInput.text.get()]);
				}
			});
		this.parent(TextButtonControl.create({ Text: "UNMark property as changed", Size: new UDim2(0, 200, 0, 50) })) //
			.addButtonAction(() => {
				for (const instance of selectionService.Get()) {
					Prefabing2.R.unmarkPropertiesAsChanged(instance, [propertyInput.text.get()]);
				}
			});

		this.parent(TextButtonControl.create({ Text: "Reset properties", Size: new UDim2(0, 200, 0, 50) })) //
			.addButtonAction(() => {
				for (const instance of selectionService.Get()) {
					Prefabing2.R.resetPropertiesOfDFab(instance);
				}
			});

		// this.parent(TextButtonControl.create({ Text: "Clone", Size: new UDim2(0, 200, 0, 50) })) //
		// 	.addButtonAction(() => {
		// 		for (const instance of selectionService.Get()) {
		// 			const clone = Prefabing.createCopyOfPrefab(instance);
		// 			clone.Name = `${instance.Name}_prefab`;
		// 			clone.Parent = instance.Parent;
		// 		}
		// 	});

		// this.parent(TextButtonControl.create({ Text: "Reset", Size: new UDim2(0, 200, 0, 50) })) //
		// 	.addButtonAction(() => {
		// 		for (const instance of selectionService.Get()) {
		// 			Prefabing.resetInstanceWithChildrenToItsPrefab(instance);
		// 		}
		// 	});

		// this.parent(TextButtonControl.create({ Text: "Mark as added", Size: new UDim2(0, 200, 0, 50) })) //
		// 	.addButtonAction(() => {
		// 		for (const instance of selectionService.Get()) {
		// 			Prefabing.markInstanceAsAdded(instance);
		// 		}
		// 	});

		// this.parent(TextButtonControl.create({ Text: "Apply ADDED change", Size: new UDim2(0, 200, 0, 50) })) //
		// 	.addButtonAction(() => {
		// 		for (const instance of selectionService.Get()) {
		// 			Prefabing.applyAddedChange(instance);
		// 		}
		// 	});

		// this.parent(TextButtonControl.create({ Text: "Apply PROPERTY changes", Size: new UDim2(0, 200, 0, 50) })) //
		// 	.addButtonAction(() => {
		// 		for (const instance of selectionService.Get()) {
		// 			Prefabing.applyPropertyChanges(instance, undefined);
		// 		}
		// 	});

		// const propertyInput = this.parent(
		// 	new TextBoxControl(
		// 		Element.create("TextBox", { LayoutOrder: 0, PlaceholderText: "prop", Size: new UDim2(0, 200, 0, 50) }),
		// 	),
		// );
		// this.parent(TextButtonControl.create({ Text: "Mark PROPERTY as changed", Size: new UDim2(0, 200, 0, 50) })) //
		// 	.addButtonAction(() => {
		// 		const prop = propertyInput.text.get();
		// 		for (const instance of selectionService.Get()) {
		// 			Prefabing.markPropertiesAsChanged(instance, [prop]);
		// 		}
		// 	});
		// this.parent(TextButtonControl.create({ Text: "UNMark PROPERTY as changed", Size: new UDim2(0, 200, 0, 50) })) //
		// 	.addButtonAction(() => {
		// 		const prop = propertyInput.text.get();
		// 		for (const instance of selectionService.Get()) {
		// 			Prefabing.unmarkPropertiesAsChanged(instance, [prop]);
		// 		}
		// 	});
	}
}

//

const toolbar = plugin.CreateToolbar("AwmPrefabs");
const pluginButton = toolbar.CreateButton("AwmPrefabs", "Show prefab stuff", "rbxassetid://1507949215");

const info = new DockWidgetPluginGuiInfo(Enum.InitialDockState.Left, false);
const widget = plugin.CreateDockWidgetPluginGui("awm_prefabs", info);
widget.Title = "AwmPrefabs";

const gui: PluginGuiDefinition = Element.create("Frame", {
	Size: new UDim2(1, 0, 1, 0),
	BackgroundColor3: Color3.fromRGB(0, 0, 0),
});
gui.Visible = true;
gui.Parent = widget;

const root = new Component();

task.spawn(() => {
	root.parent(new PluginControl(gui));
	root.setEnabled(widget.Enabled);
	pluginButton.Click.Connect(() => {
		widget.Enabled = !widget.Enabled;
		root.setEnabled(widget.Enabled);
	});
});

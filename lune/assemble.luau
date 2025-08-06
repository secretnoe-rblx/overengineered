--[[
  Place Builder Script
  Reads a `structure.json` manifest to build a Roblox place file (`.rbxl`).
  This script recursively processes a structure of folders and model files (.rbxm/.rbxmx)
  and assembles them into a new DataModel.
]]

-- Required modules
local fs = require("@lune/fs")
local roblox = require("@lune/roblox")
local serde = require("@lune/serde")

local Instance = roblox.Instance

--------------------------------------------------------------------------------
-- Configuration
--------------------------------------------------------------------------------
local CONFIG = {
	-- Enable/disable debug messages
	Debug = true,
	ManifestPath = "./lune/structure.json",
	OutputPath = "place.rbxl",
}

-- Table for special containers
local SPECIAL_CONTAINERS = {
	StarterPlayerScripts = "StarterPlayerScripts",
	StarterCharacterScripts = "StarterCharacterScripts",
}

--------------------------------------------------------------------------------
-- Global State and Helper Functions
--------------------------------------------------------------------------------
local missingFiles = {}
local criticalErrors = {}

local function log(message)
	if CONFIG.Debug then
		print("[DEBUG] " .. tostring(message))
	end
end

local function warn(message)
	print("[WARN] " .. tostring(message))
end

local function error(message)
	print("[ERROR] " .. tostring(message))
	table.insert(criticalErrors, message)
end

local function protectedCall(func, errorMessage, ...)
	local success, result = pcall(func, ...)
	if not success then
		error(errorMessage .. ": " .. tostring(result))
		return false, result
	end
	return true, result
end

type instanceProps = {
	kind: nil | { kind: "folder", root: string },
	path: string | nil,
	children: { [string]: instanceProps },
}
type manifest = {
	game: { [string]: instanceProps },
}

local function loadAndPlaceModel(filePath: string, parent: Instance, name: string): { Instance }
	log("Attempting to load: " .. filePath)
	if not fs.isFile(filePath) then
		warn("File not found: " .. filePath)
		table.insert(missingFiles, filePath)
		return {}
	end

	local success, contents = protectedCall(fs.readFile, "Failed to read file: " .. filePath, filePath)
	if not success then return {} end

	success, localInstances = protectedCall(roblox.deserializeModel, "Failed to deserialize: " .. filePath, contents)
	if not success then return {} end


	if #localInstances == 0 then
		warn("No instances found in file: " .. filePath)
		return {}
	end

	for _, inst in ipairs(localInstances) do
		inst.Name = name

		success, err = protectedCall(function() inst.Parent = parent end, "Failed to parent instance '" .. inst.Name .. "' from " .. filePath .. " to " .. parent:GetFullName())
		if not success then
			return {}
		end
		log("Placed instance '" .. inst.Name .. "' from " .. filePath .. " into " .. (if parent:IsA('DataModel') then "game" else parent:GetFullName()))
	end
 
	return localInstances
end
local function processNode(props: instanceProps, name: string, parent: Instance)
	if props.kind then
		if props.kind.kind == "folder" then
			local function writeFoldered(path: string, parent: Instance)
				if not fs.isDir(path) then fs.writeDir(path) end

				local files = fs.readDir(path)
				for i, fname in  files do
					local fpath = path .. '/' .. fname
					print(fpath, ' | ', fname)
					local idx = fname:find("%.") or math.huge
					fname = fname:sub(1, idx - 1)

					if fs.isFile(fpath) then
						loadAndPlaceModel(fpath, parent, fname)
					else
						local instance = parent:FindFirstChild(fname);
						if not instance then
							local className = SPECIAL_CONTAINERS[name] or "Folder"
							log("Creating instance: '" .. name .. "' of class '" .. className .. "' in " .. parent:GetFullName())
							instance = Instance.new(className)
							instance.Name = name
							instance.Parent = parent
						else
							log("Found existing container: '" .. instance:GetFullName() .. "' of class " .. instance.ClassName)
						end

						writeFoldered(fpath, instance)
					end
				end
			end

			writeFoldered(props.kind.root, parent);
			return true
		end
	end

	local instance
	if props.path then
		instance = loadAndPlaceModel(props.path, parent, name)[1]
		if not instance then return false end
	else
		if parent:IsA('DataModel') then
			instance = parent:GetService(name)
		else
			instance = parent:FindFirstChild(name);
		end

		if not instance then
			local className = SPECIAL_CONTAINERS[name] or "Folder"
			log("Creating instance: '" .. name .. "' of class '" .. className .. "' in " .. parent:GetFullName())
			instance = Instance.new(className)
			instance.Name = name
			instance.Parent = parent
		else
			log("Found existing container: '" .. instance:GetFullName() .. "' of class " .. instance.ClassName)
		end
	end

	if props.children then
		local allChildrenProcessed = true
		for k, v in pairs(props.children) do
			if not processNode(v, k, instance) then
				allChildrenProcessed = false
			end
		end
		return allChildrenProcessed
	end

	return true;
end

local function processStructureJson(game: DataModel)
	log("Reading manifest from: " .. CONFIG.ManifestPath)
	local manifestJson, readErr = fs.readFile(CONFIG.ManifestPath)
	if not manifestJson then
		error("Failed to read manifest file '" .. CONFIG.ManifestPath .. "': " .. tostring(readErr))
		return false
	end

	local success, manifest: manifest = protectedCall(serde.decode, "Failed to parse manifest JSON", "json", manifestJson)
	if not success then return false end
	log("Manifest parsed successfully.")


	for name, props in pairs(manifest.game) do
		processNode(props, name, game)
	end

	log("Finished processing all services")
	return true
end

--------------------------------------------------------------------------------
-- Main Function
--------------------------------------------------------------------------------
local function main()
	log("Starting place build process...")
	local game = Instance.new("DataModel")

	log("Processing manifest...")
	local success = processStructureJson(game)

	game:GetService("HttpService").HttpEnabled = true;

	log("Serializing the place...")
	success, output = protectedCall(roblox.serializePlace, "Failed to serialize place", game)
	if not success then return false end
	log("Writing place to: " .. CONFIG.OutputPath)
	success, err = protectedCall(fs.writeFile, "Failed to write place.rbxl", CONFIG.OutputPath, output)
	if not success then return false end
	log("Place saved successfully to " .. CONFIG.OutputPath)

	return success and (#criticalErrors == 0)
end

--------------------------------------------------------------------------------
-- Script Execution and Final Report
--------------------------------------------------------------------------------
print("--- Starting Build ---")
local buildSuccessful = protectedCall(main, "Main build function failed unexpectedly")

print("\n--- Build Summary ---")
if #missingFiles > 0 then
	print("The following files were missing (and skipped):")
	for _, file in ipairs(missingFiles) do
		print("  - " .. file)
	end
else
	print("No missing files detected.")
end

if #criticalErrors > 0 then
	print("\nCritical errors occurred during build:")
	for i, err in ipairs(criticalErrors) do
		print(string.format("  %d. %s", i, err))
	end
end

if buildSuccessful and #criticalErrors == 0 then
	print("\nBuild completed successfully!")
elseif not buildSuccessful then
	print("\nBuild failed due to critical errors.")
else
	print("\nBuild completed with warnings (e.g., missing files, but no critical failures).")
end
print("--- End of Build Summary ---")

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

-- Run the SDK installation script first
require("./_install")

local Instance = roblox.Instance

--------------------------------------------------------------------------------
-- Configuration
--------------------------------------------------------------------------------
local CONFIG = {
	-- Enable/disable debug messages
	Debug = true,
	ManifestPath = "./lune/structure.json",
	OutputPath = "place.rbxl",

	-- Properties to set for DataModel.Workspace
	WorkspaceProperties = {
		Origin = roblox.CFrame.new(0, -16384, 0),
		WorldPivot = roblox.CFrame.new(0, -16384, 0),
		FallenPartsDestroyHeight = -17000,
		SignalBehavior = roblox.Enum.SignalBehavior.Default,
		FluidForces = roblox.Enum.FluidForces.Experimental,
		PhysicsSteppingMethod = roblox.Enum.PhysicsSteppingMethod.Adaptive,
		RenderingCacheOptimizations = roblox.Enum.RenderingCacheOptimizationMode.Enabled,
		StreamingEnabled = false,
	},

	Services = {
		Players = {
			RespawnTime = 3,
		},
		Lighting = {
			Ambient = roblox.Color3.fromRGB(70, 70, 70),
			Brightness = 3,
			EnvironmentDiffuseScale = 1,
			EnvironmentSpecularScale = 1,
			GlobalShadows = true,
			OutdoorAmbient = roblox.Color3.fromRGB(57, 56, 46),
			PrioritizeLightingQuality = true,
			ClockTime = 14,
			GeographicLatitude = 41.733,
		},
		MaterialService = {
			Use2022Materials = true,
		},
		StarterPlayer = {
			CharacterWalkSpeed = 20,
			NameDisplayDistance = 0,
		},
		TextChatService = {
			ChatVersion = roblox.Enum.ChatVersion.TextChatService,
		},
	}
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
		log("Placed instance '" .. inst.Name .. "' from " .. filePath .. " into " .. parent:GetFullName())
	end
 
	return localInstances
end
local function processNode(props: instanceProps, name: string, parent: Instance)
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
			print('						pcc', k)
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

	-- 1. Workspace configuration
	log("Configuring Workspace service...")
	local success, err = protectedCall(function()
		for prop, val in pairs(CONFIG.WorkspaceProperties) do
			game.Workspace[prop] = val
		end
	end, "Failed to configure Workspace properties")
	if not success then return false end

	-- CHANGE HERE: Added step for Lighting configuration
	-- 2. Lighting configuration
	log("Configuring services...")
	for k, v in pairs(CONFIG.Services) do
		log("Configuring " .. k .. "...")
		success, err = protectedCall(function()
			local service = game:GetService(k)
			for prop, val in pairs(v) do
				service[prop] = val
			end
		end, "Failed to configure " .. k .. " properties")
		if not success then return false end

		log(k .. " configured.")
	end
	log("Services configured.")

	success = processStructureJson(game)

	game:GetService("ServerScriptService"):AddTag("overengineered")
	game:GetService("HttpService").HttpEnabled = true;

	-- 6. Serialization and saving of .rbxl
	log("Serializing final place...")
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

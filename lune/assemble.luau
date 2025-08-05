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
		FallenPartsDestroyHeight = -17000,
		SignalBehavior = roblox.Enum.SignalBehavior.Default,
		FluidForces = roblox.Enum.FluidForces.Experimental,
		PhysicsSteppingMethod = roblox.Enum.PhysicsSteppingMethod.Adaptive,
		RenderingCacheOptimizations = roblox.Enum.RenderingCacheOptimizationMode.Enabled,
		StreamingEnabled = false,
	},

	Services = {
		Lighting = {
			Ambient = roblox.Color3.fromRGB(70, 70, 70),
			Brightness = 3,
			EnvironmentDiffuseScale = 1,
			EnvironmentSpecularScale = 1,
			GlobalShadows = true,
			OutdoorAmbient = roblox.Color3.fromRGB(57, 56, 46),
			PrioritizeLightingQuality = true,
		},
		MaterialService = {
			Use2022Materials = true,
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

local function loadAndPlaceModel(filePath, parent, instanceName)
	log("Attempting to load: " .. filePath)
	if not fs.isFile(filePath) then
		warn("File not found: " .. filePath)
		table.insert(missingFiles, filePath)
		return false
	end

	local success, contents = protectedCall(fs.readFile, "Failed to read file: " .. filePath, filePath)
	if not success then return false end

	success, localInstances = protectedCall(roblox.deserializeModel, "Failed to deserialize: " .. filePath, contents)
	if not success then return false end

	if #localInstances == 0 then
		warn("No instances found in file: " .. filePath)
		return false
	end

	for _, inst in ipairs(localInstances) do
		if instanceName then
			inst.Name = instanceName
		end
		success, err = protectedCall(function() inst.Parent = parent end,
			"Failed to parent instance '" .. inst.Name .. "' from " .. filePath .. " to " .. parent:GetFullName())
		if not success then return false end
		log("Placed instance '" .. inst.Name .. "' from " .. filePath .. " into " .. parent:GetFullName())
	end
	return true
end

local function processNode(node, parent)
	if not node.name then
		error("Invalid manifest node: missing 'name' key.")
		return false
	end

	if node.path then
		return loadAndPlaceModel(node.path, parent, node.name)
	elseif node.children then
		local container = parent:FindFirstChild(node.name)
		if not container then
			local className = SPECIAL_CONTAINERS[node.name] or "Folder"
			log("Creating instance: '" .. node.name .. "' of class '" .. className .. "' in " .. parent:GetFullName())
			container = Instance.new(className)
			container.Name = node.name
			container.Parent = parent
		else
			log("Found existing container: '" .. container:GetFullName() .. "' of class " .. container.ClassName)
		end

		local allChildrenProcessed = true
		for _, childNode in ipairs(node.children) do
			if not processNode(childNode, container) then
				allChildrenProcessed = false
			end
		end
		return allChildrenProcessed
	else
		error("Invalid manifest node '" .. node.name .. "': must have 'path' or 'children' key.")
		return false
	end
end

--------------------------------------------------------------------------------
-- Main Function
--------------------------------------------------------------------------------
local function main()
	log("Starting place build process...")
	local game = Instance.new("DataModel")

	game:GetService("HttpService").HttpEnabled = true;

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

	-- 3. Reading and parsing the manifest
	log("Reading manifest from: " .. CONFIG.ManifestPath)
	local manifestJson, readErr = fs.readFile(CONFIG.ManifestPath)
	if not manifestJson then
		error("Failed to read manifest file '" .. CONFIG.ManifestPath .. "': " .. tostring(readErr))
		return false
	end
	success, manifest = protectedCall(serde.decode, "Failed to parse manifest JSON", "json", manifestJson)
	if not success then return false end
	log("Manifest parsed successfully.")

	-- 4. Processing services
	local overallBuildSuccess = true
	for _, serviceData in ipairs(manifest) do
		local serviceName = serviceData.name
		if not serviceName then
			error("Invalid service entry in manifest: missing 'name'. Skipping.")
			overallBuildSuccess = false
			continue
		end
		if not serviceData.children then
			error("Invalid service entry '" .. serviceName .. "': missing 'children'. Skipping.")
			overallBuildSuccess = false
			continue
		end
		log("Processing service: " .. serviceName)
		local getServiceSuccess, service = protectedCall(game.GetService, "Failed to get service: " .. serviceName, game,
			serviceName)
		if not getServiceSuccess then
			overallBuildSuccess = false
			continue
		end
		for _, childNode in ipairs(serviceData.children) do
			if not processNode(childNode, service) then
				overallBuildSuccess = false
			end
		end
	end
	log("Finished processing all services.")

	-- 5. SDK Flag in ServerScriptService
	game:GetService("ServerScriptService"):AddTag("overengineered")

	-- 6. Serialization and saving of .rbxl
	log("Serializing final place...")
	success, output = protectedCall(roblox.serializePlace, "Failed to serialize place", game)
	if not success then return false end
	log("Writing place to: " .. CONFIG.OutputPath)
	success, err = protectedCall(fs.writeFile, "Failed to write place.rbxl", CONFIG.OutputPath, output)
	if not success then return false end
	log("Place saved successfully to " .. CONFIG.OutputPath)

	return overallBuildSuccess and (#criticalErrors == 0)
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

local fs = require("@lune/fs")
local roblox = require("@lune/roblox")
local serde = require("@lune/serde")
local process = require("@lune/process")

-- Check if running on Windows
if process.os ~= "windows" then
    print("SDK installation is not supported on " .. process.os .. " systems, install it yourself")
    return
end

-- Define source and destination paths
local sourcePath = "./game/SDK.rbxmx"
local pluginPath = roblox.studioPluginPath()
local destinationPath = pluginPath .. "/SDK.rbxmx"

-- Check if source file exists
if not fs.isFile(sourcePath) then
    print("Error: Source file not found at " .. sourcePath)
    return
end

-- Check if SDK is already installed
if fs.isFile(destinationPath) then
    -- Already installed, exit silently
	return
end

-- Check if plugin directory exists, create if it doesn't
if not fs.isDir(pluginPath) then
    print("Creating plugin directory at " .. pluginPath)
    fs.writeDir(pluginPath)
end

-- Copy the SDK file
print("Copying SDK.rbxmx to Roblox Studio plugins...")
print("Source: " .. sourcePath)
print("Destination: " .. destinationPath)

local sourceContent = fs.readFile(sourcePath)
fs.writeFile(destinationPath, sourceContent)

print("SDK.rbxmx successfully installed to Roblox Studio plugins!")

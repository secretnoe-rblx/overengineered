#!/bin/sh

rm /temp/_rbx -r
cp . /temp/_rbx -r
echo 'copied'
cd /temp/_rbx

npx roblox-ts --rojo plugins.project.json
rojo build plugins.project.json --output awm-plugins.rbxm
mv awm-plugins.rbxm ~/.local/share/vinegar/prefixes/studio/drive_c/users/steamuser/AppData/Local/Roblox/Plugins/

cd -
rm /temp/_rbx -r

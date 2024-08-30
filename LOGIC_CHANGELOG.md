# Logic update changelog; not full

## Fixing the logic
Logic should now always work correctly (it didn't).
If you seen errors like "attempt to add string and number" or unexpectedly exploding tnt blocks, now they shouldn't happen.
The blocks will no longer be in a half-working state just because it didn't like your wire order.
Circular wire connections will result in fire now, though. Some of them. Just use a counter or something idk


## Config tool
UI of the config tool was updated to be more cool and easier to work with. ||The colors are shit though. Maks, please fix||

- Improved handling for multi-type logic values
Did you notice that you could connect a multi-typed logic marker to a single-type in the wire tool, and then still be able to change its type in the config tool? Well good if you didn't and anyways that's now fixed.
- New cool and useless colors indicating the type!!!!!wow
- The configuration values will now be property ordered. ||Most of them, at least||
No more of that stupid "YZX" in vector blocks or "+" after "-" in the rocket engine.


## Other
- Added ordering of logic markers to the wire tool
No more of that stupid [Y Z X] in vector blocks

- Improved reliability & latency of the rocket engine autoconfigured controls
- Added description tooltips to some configuration values (in the config tool), explaining something. Also measurement units. Sometimes.



## next stuff
- Improved controls stuff, like you can change the types or something (yes or no?) // TODO:write

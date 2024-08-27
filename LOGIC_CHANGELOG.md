# Logic update changelog; not full

## Fixing the logic
Logic should now always work correctly (it didn't).
If you seen errors like "attempt to add string and number" or unexpectedly exploding tnt blocks, now they shouldn't happen.
The blocks will no longer be in a half-working state just because it didn't like your wire order.
Circular wire connections will result in fire now, though. Some of them. Just use a counter or something idk


## Config tool
UI of the config tool was updated to be more cool and easier to work with.

- Improved handling for multi-type logic values
Did you notice that you could connect a multi-typed logic marker to a single-type in the wire tool, and then still be able to change its type in the config tool? Well good if you didn't and anyways that's now fixed.
- New cool and useless colors indicating the type!!!!!wow
- The configuration values will now be property ordered. ||Most of them, at least||
No more of that stupid "YZX" in vector blocks or "+" after "-" in the rocket engine.


## Other
- Added ordering of logic markers to the wire tool
No more of that stupid [Y Z X] in vector blocks

- Improved reliability & latency of the rocket engine autoconfigured controls



## next stuff
- Improved controls stuff, like you can change the types or something // TODO:write


___
# not a changelog part

## EXISTING control types

- Thrust:
hold to change (holding W to increase value, holding S to decrease value)
configurable switch mode - pressing W to set, pressing W again to unset; pressing S to set, pressing S again to unset

- Controllable number
literally thrust but with the changeable min, max, step(?)

- Motor rotation speed
hold to set (holding R to set +value, holding F to set -value)
configurable switch mode - pressing W to set, pressing W again to unset; pressing S to set, pressing S again to unset

- Servomotor angle
literally motor rotation speed


## Control types

- hold to change (W to increase, S to decrease)
- press to change (W to set, W again to unset)

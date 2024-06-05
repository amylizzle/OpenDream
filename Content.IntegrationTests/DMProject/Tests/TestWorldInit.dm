/proc/RunTest()
	var/a = 0
	var/b = 0
	for(var/turf/t in world)
		if(istype(t,/turf/border))
			b += 1
		else
			a += 1
	if(a + b != 25)
		CRASH("Map probably failed to load; expected 25 tiles in the map, instead found [a + b].")


#define P_INDEX 1
#define P_IMAGE 2
#define P_ISTATE 3
#define P_ILEN P_ISTATE // maximum index

/obj/overlay_test
	var/list/overlay_refs = list()

	proc/AddOverlay(var/image/I, var/key)
		var/list/prev_data = overlay_refs[key]
		var/hash = ref(I.appearance)
		if(isnull(prev_data)) //Ok, we don't have previous data, but we will add an overlay
			src.overlays += I
			prev_data = list(length(src.overlays), I, hash)
			overlay_refs[key] = prev_data
			return TRUE

		var/image/prev_overlay = prev_data[P_IMAGE] //overlay_refs[key]
		if((prev_overlay == I) && hash == prev_data[P_ISTATE]) //If it's the same image as the other one and the appearances match then do not update
			return 0

		var/index = prev_data[P_INDEX]
		if(index) //There is an existing overlay in place in this slot, remove it
			if(index <= length(src.overlays))
				src.overlays.Cut(index, index+1) //Fuck yoooou byond (this gotta be by index or it'll fail if the same thing's in overlays several times)
			else
				CRASH("Overlays were modified by non-UpdateOverlays method.")

			for(var/ikey in overlay_refs) //Because we're storing the position of each overlay in the list we need to shift our indices down to stay synched
				var/list/L = overlay_refs[ikey]
				if(L?[P_INDEX] >= index)
					L[P_INDEX]--

		src.overlays += I
		prev_data = list(length(src.overlays), I, hash) // (`P_INDEX`, `P_IMAGE`, `P_ISTATE`)

		overlay_refs[key] = prev_data
		return TRUE

	proc/RemoveOverlays()
		if(length(src.overlays))
			src.overlays.len = 0
			src.overlay_refs.len = 0

	proc/UpdateOverlay(var/image/I, var/key)
		var/list/prev_data = overlay_refs[key]
		var/hash = I ? ref(I.appearance) : null
		var/index = prev_data[P_INDEX]

		if(isnull(prev_data) && I) //Ok, we don't have previous data, but we will add an overlay
			src.overlays += I
			prev_data = list(length(src.overlays), I, hash) // (`P_INDEX`, `P_IMAGE`, `P_ISTATE`)
			overlay_refs[key] = prev_data
			return TRUE
		else if(isnull(prev_data))
			return FALSE

		if(index) //There is an existing overlay in place in this slot, remove it
			if(index <= length(src.overlays))
				src.overlays.Cut(index, index+1) 
			else
				CRASH("Overlays were modified by non-UpdateOverlays method.")

		for(var/ikey in overlay_refs) //Because we're storing the position of each overlay in the list we need to shift our indices down to stay synched
			var/list/L = overlay_refs[ikey]
			if(L?[P_INDEX] >= index)
				L[P_INDEX]--

		if(I)
			src.overlays += I
			prev_data = list(length(src.overlays), I, hash) // (`P_INDEX`, `P_IMAGE`, `P_ISTATE`)

			overlay_refs[key] = prev_data

/datum/unit_test/overlay_integrity/RunTest()
	var/obj/overlay_test/OT = new()
	OT.AddOverlay(image('icons.dmi',"mob"), "mob_overlay")
	var/image/perm = image('icons.dmi',"mob",layer=4)
	OT.AddOverlay(perm, "perm1")
	perm.color = "red"
	OT.AddOverlay(perm, "perm_red")
	perm = image('icons.dmi',"mob")
	perm.pixel_x += 16
	OT.UpdateOverlay(perm, "perm1")
	sleep(10)
	OT.Move(Dir=NORTH)
	OT.color = "blue"
	ASSERT(length(OT.overlays) == 3)
	OT.UpdateOverlay(perm, "perm1")
	

#undef P_INDEX
#undef P_IMAGE
#undef P_ISTATE
#undef P_ILEN

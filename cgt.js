

// keep track of games by indices in the following list

games = []
comparison_cache = {}

silent = true;

function bare_le(g, h) {
    for(var i = 0; i < g.left.length; i++) {
	if(le(h,g.left[i]))
	    return false;
    }
    for(var i = 0; i < h.right.length; i++) {
	if(le(h.right[i],g))
	    return false;
    }
    return true;
}



function le(g,h) {
    if(g.index && h.index) {
	var d = 0;
	if(comparison_cache[g.index])
	    d = comparison_cache[g.index][h.index];
	if(d)
	    return d > 0;
	d = bare_le(g,h);
	if(!comparison_cache[g.index]) {
	    comparison_cache[g.index] = {};
	}
	comparison_cache[g.index][h.index] = d;
	return d;
    }
    return bare_le(g,h);
}

function eq(g, h) {
    return le(g,h) && le(h,g);
}

// take the indices as input, not the games,
// and return the index!
function get_game(lefts, rights) {
    ell = [];
    arr = [];
    for(var i = 0; i < lefts.length; i++) {
	ell.push(games[lefts[i]]);
    }
    for(var i = 0; i < rights.length; i++) {
	arr.push(games[rights[i]]);
    }
    g = {left: ell, right: arr};
    for(var i = 0; i < games.length; i++) {
	if(eq(g,games[i])) {
	    //console.log('duplicate game' + i);
	    //console.log(g);
	    return i;
	}
    }
    games.push(g);
    g.index = games.length - 1;
    //console.log(g.index + ", " + games[g.index].index);
    // canonicalize,
    // sigh, this is always a pain
    while(remove_reversibles(g)); // [sic]
    var retained = [];
    for(var i = 0; i < g.left.length; i++)
	retained[i] = true;
    for(var i = 0; i < g.left.length; i++) {
	for(var j = 0; j < g.left.length && retained[i]; j++) {
	    if(j == i || !retained[j])
		continue;
	    if(le(g.left[i],g.left[j])) {
		// ith option is dominated, so don't retain it
		retained[i] = false;
	    }
	}
    }
    var newleft = []
    for(var i = 0; i < g.left.length; i++) {
	if(retained[i]) {
	    newleft.push(g.left[i]);
	}
    }
    g.left = newleft;

    retained = [];
    for(var i = 0; i < g.right.length; i++)
	retained[i] = true;
    for(var i = 0; i < g.right.length; i++) {
	for(var j = 0; j < g.right.length && retained[j]; j++) {
	    if(j == i || !retained[j])
		continue;
	    if(le(g.right[j],g.right[i])) {
		retained[i] = false;
	    }
	}
    }
    var newright = []
    for(var i = 0; i < g.right.length; i++) {
	if(retained[i]) {
	    newright.push(g.right[i]);
	}
    }
    g.right = newright;
    

    return g.index;
}

function remove_reversibles(g) {
    for(var i = 0; i < g.left.length; i++) {
	gl = g.left[i];
	for(var j = 0; j < gl.right.length; j++) {
	    glr = gl.right[j];
	    if(le(glr,g)) {
		// TODO: do anything with lists in javascript
		for(var k = i+1; k < g.left.length; k++) {
		    g.left[k-1] = g.left[k];
		}
		g.left.pop()
		for(var k = 0; k < glr.left.length; k++) {
		    g.left.push(glr.left[k]);
		}
		return true;
	    }
	}
    }
    for(var i = 0; i < g.right.length; i++) {
	gr = g.right[i];
	for(var j = 0; j < gr.left.length; j++) {
	    grl = gr.left[j];
	    if(le(g,grl)) {
		for(var k = i+1; k < g.right.length; k++) {
		    g.right[k-1] = g.right[k];
		}
		g.right.pop()
		for(var k = 0; k < grl.right.length; k++) {
		    g.right.push(grl.right[k]);
		}
		return true;
	    }
	}
    }
    return false;
}




function neg(index) {
    var g = games[index];
    var ell = [];
    var arr = [];
    for(var i = 0; i < g.left.length; i++)
	arr.push(neg(g.left[i].index));
    for(var i = 0; i < g.right.length; i++)
	ell.push(neg(g.right[i].index));
    // console.log(ell);
    // console.log(arr);
    return get_game(ell,arr);
}

function plus(g,h) {
    // console.log("adding games " + g + " and " + h + " together.");
    g = games[g];
    h = games[h];
    //console.log(g);
    //console.log(h);
    var ell = [];
    var arr = [];
    for(var i = 0; i < g.left.length; i++) {
	//console.log("nbw that g.left[i].index is" + g.left[i].index);
	//console.log("and h.index is" + h.index);
	//console.log("coz h is ");
	//console.log(h);
	ell.push(plus(g.left[i].index,h.index));
    }
    for(var i = 0; i < h.left.length; i++)
	ell.push(plus(g.index,h.left[i].index));
    for(var i = 0; i < g.right.length; i++)
	arr.push(plus(g.right[i].index,h.index));
    for(var i = 0; i < h.right.length; i++)
	arr.push(plus(g.index,h.right[i].index));
    return get_game(ell,arr);
}



namesToValues = {};
valuesToNames = {};

function bind(name,value) {
    namesToValues[name] = value;
    valuesToNames[value] = name;
}




// takes the index of g
function display(g) {
    //console.log("trying to display " + g);
    if(g in valuesToNames) {
	return valuesToNames[g];
    }
    ng = neg(g);
    if(ng in valuesToNames) {
    	return "-" + valuesToNames[ng];
    }
    g = games[g];
    var s = "{";
    if(g.left.length > 0) {
	for(var i = 0; i < g.left.length; i++) {
	    if(i > 0)
		s += ", ";
	    s += display(g.left[i].index);
	}
    }
    s += "|";
    if(g.right.length > 0) {
	for(var i = 0; i < g.right.length; i++) {
	    if(i > 0)
		s += ", ";
	    s += display(g.right[i].index);
	}
    }
    s += "}";
    return s;
}

function forceDisplay(g) {
    g = games[g];
    var s = "{";
    if(g.left.length > 0) {
	for(var i = 0; i < g.left.length; i++) {
	    if(i > 0)
		s += ", ";
	    s += display(g.left[i].index);
	}
    }
    s += "|";
    if(g.right.length > 0) {
	for(var i = 0; i < g.right.length; i++) {
	    if(i > 0)
		s += ", ";
	    s += display(g.right[i].index);
	}
    }
    s += "}";
    return s;
}


// console.log(games[plus(up,up)]);
// console.log(display(plus(up,up)));

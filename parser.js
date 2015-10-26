function atom(str) {
    return {type:'atom', value:str};
}

function parser_plus(first, second) {
    return {type:'plus', first:first, second:second};
}

function unary_minus(x) {
    return {type:'neg', value:x};
}

function minus(first,second) {
    return parser_plus(first,unary_minus(second));
}

function unary_plus(x) {
    return x;
}

function brackets(first,second) {
    return {type:'brackets', first:first, second:second};
}

function comparison(first, operator, second) {
    return {type:'comparison', operator:operator, first:first, second:second};
}


function recursivePrint(entity) {
    if(entity.type == "atom")
	return entity.value;
    if(entity.type == "plus")
	return recursivePrint(entity.first) + "+" + recursivePrint(entity.second);
    if(entity.type == "comparison")
	return recursivePrint(entity.first) + entity.operator + recursivePrint(entity.second)
    if(entity.type == "neg")
	return "-(" + recursivePrint(entity.value) + ")";
    if(entity.type == "brackets") {
	var first = "";
	var second = "";
	if(entity.first.length > 0) {
	    for(var i = 0; i < entity.first.length; i++) {
		if(i > 0)
		    first += ",";
		first += recursivePrint(entity.first[i]);
	    }
	}
	if(entity.second.length > 0) {
	    for(var i = 0; i < entity.second.length; i++) {
		if(i > 0)
		    second += ",";
		second += recursivePrint(entity.second[i]);
	    }
	}
	return "{" + first + "|" + second + "}";
    }
    return "error";
}


// return a list of pairs [token,loc]
// where loc is the location of the first character of token
function lex(str) {
    function get_type(c) {
	if(c == ' ')
	    return ' ';
	if(c == '|')
	    return '|';
	if("{}(),=?+-".indexOf(c) > -1)
	    return '!';
	return 'x';
    }
    // console.log("str is: " + str);
    var types = "";
    for(i = 0; i < str.length; i++) {
	types += get_type(str[i]);
    }
    // console.log("types is: " + types);
    var retval = []
    var start = 0;
    while(start < str.length) {
	var current = str[start];
	var end = start+1;
	while(end < str.length && types[end] == types[start]
	      && types[end] != '!')
	    current += str[end++];
	if(types[start] != ' ')
	    retval.push([current,start]);
	start = end;
    }
    return retval;
	    
}


function parse(lexdata) {
    var tokens = [];
    var types = [];
    var locs = [];
    for(var i = 0; i < lexdata.length; i++) {
	tokens.push(lexdata[i][0]);
	locs.push(lexdata[i][1]);
	c = lexdata[i][0][0];
	if("?|{},=()+".indexOf(c) > -1)
	    types.push(c);
	else if(c == "-")
	    types.push("+");
	else
	    types.push("x");
    }

    var where = 0;
    var failure = false;

    function fail(s) {
	if(failure)
	    return;
	failure = s;
    }

    function peekType() {
	if(where >= tokens.length)
	    return "$";
	return types[where];
    }

    function pullValue(type) {
	if(peekType() == '$') {
	    unexpectedFail();
	    return "error";
	}
	if(peekType() != type) {
	    fail("At " + locs[where] + ", expected " + type
		 + ", but got " + peekType());
	    return "error";
	}
	return tokens[where++];
    }

    function unexpectedFail() {
	if(where >= tokens.length)
	    fail("Unexpected end of input!");
	else
	    fail("Unexpected token " + tokens[where]
		 + " at location " + locs[where]);
    }

	

    
    

    function readTerm() {
	switch(peekType()) {
	case '+':
	    var c = pullValue('+');
	    if(c == '+')
		return unary_plus(readTerm());
	    else
		return unary_minus(readTerm());
	case '(':
	    pullValue('(');
	    ret = readExpression();
	    pullValue(')');
	    return ret;
	case 'x':
	    return atom(pullValue('x'));
	case '{':
	    pullValue('{');
	    ret = readBarList();
	    pullValue('}');
	    return ret;
	default:
	    unexpectedFail();
	    return "error";
	}
    }

    function readExpression() {
	var running = readTerm();
	while(!failure && peekType() == '+') {
	    var op = pullValue('+');
	    var second = readTerm();
	    if(op == '+')
		running = parser_plus(running,second);
	    else
		running = minus(running,second);
	}
	return running;
    }

    function readCommaList() {
	var retval = [];
	if(peekType() == '|' || peekType() == '}') {
	    return retval;
	}
	while(!failure) {
	    retval.push(readExpression());
	    if(peekType() == '|' || peekType() == '}') {
		return retval;
	    }
	    pullValue(',');
	}
    }

    

    function readCommand() {
	var e1 = readExpression();
	if(peekType() == '$') {
	    return e1;
	}
	if(peekType() == '?' || peekType() == '=') {
	    var op = pullValue(peekType());
	    var e2 = readExpression();
	    if(peekType() != '$') {
		unexpectedFail();
		return "error";
	    }
	    return comparison(e1,op,e2);
	}
	unexpectedFail();
	return "error";
    }


    function readBarList() {
	var commaLists = [];
	var bars = [];
	var barLocs = [];
	commaLists.push(readCommaList());
	while(!failure && peekType() == '|') {
	    barLocs.push(where);
	    bars.push(pullValue('|'));
	    commaLists.push(readCommaList());
	}
	
	// now things get tricky
    
	if(bars.length == 0) {
	    // special syntax for games where both
	    // players have the same options...
	    // commaLists = [x], and we want brackets(x,x)
	    return brackets(commaLists[0],commaLists[0]);
	}
	return handleBrackets(commaLists,bars,barLocs);
    }

    function handleBrackets(commaLists,bars,barLocs) {
	if(bars.length == 1)
	    return brackets(commaLists[0],commaLists[1]);
	
	var biggest = -1;
	var first, last;
	for(var i = 0; i < bars.length; i++) {
	    var val = bars[i].length;
	    if(val > biggest) {
		biggest = val;
		first = last = i;
	    }
	    else if(val == biggest)
		last = i;
	    
	}
	if(last > first) {
	    lastLoc = barLocs[last];
	    firstLoc = barLocs[first];
	    sep = tokens[first];
	    fail("Ambiguous parse between " + sep +
		 " at " + firstLoc + " and " + lastLoc);
	    return "error";
	}
	var cL1 = commaLists.slice(0,first+1);
	var cL2 = commaLists.slice(first+1,commaLists.length);
	var sep1 = bars.slice(0,first);
	var sep2 = bars.slice(first+1,bars.length);
	var debug1 = barLocs.slice(0,first);
	var debug2 = barLocs.slice(first+1,bars.length);
	var g1, g2;
	if(cL1.length == 1)
	    g1 = cL1[0];
	else
	    g1 = [handleBrackets(cL1,sep1,debug1)];
	if(cL2.length == 1)
	    g2= cL2[0];
	else
	    g2 = [handleBrackets(cL2,sep2,debug2)];
	return brackets(g1,g2);
    }

    var final_retval = readCommand();
    if(failure)
	return [false,failure];
    return [true,final_retval];
}



// exports.process_input = function(input) {
//     return parse(lex(input));
// }

// exports.recursivePrint = recursivePrint;
	    

// console.log(parse(lex("a = {b|c+d,e}")));


// console.log(lexer("a bc|<||   diax? =} {"));



function toGame(entity) {
    switch(entity.type) {
    case "plus":
	return plus(toGame(entity.first),toGame(entity.second));
    case "neg":
	return neg(toGame(entity.value));
    case "atom":
	if(entity.value in namesToValues) {
	    return namesToValues[entity.value];
	}
	return get_game([],[]); // FIXME
    case "brackets":
	var lefts = [];
	var rights = [];
	for(var i = 0; i < entity.first.length; i++)
	    lefts.push(toGame(entity.first[i]));
	for(var i = 0; i < entity.second.length; i++)
	    rights.push(toGame(entity.second[i]));
	return get_game(lefts,rights);
    }
}



function calculate(input) {
    var data = parse(lex(input));
    if(data[0]) {
	// do stuff
	data = data[1];
	if(data.type == "comparison") {
	    var first = data.first;
	    var second = data.second;
	    var op = data.operator;
	    if(op == "?") {
		first = toGame(first);
		second = toGame(second);
		first = games[first];
		second = games[second];
		var fs = le(first,second);
		var sf = le(second,first);
		first = recursivePrint(data.first);
		second = recursivePrint(data.second);
		if(fs && sf)
		    return first + " = " + second;
		if(fs && !sf)
		    return first + " < " + second;
		if(sf && !fs)
		    return first + " > " + second;
		return first + " || " + second;
	    }
	    if(op == "=") {
		if(first.type != "atom")
		    return "Error: can't assign to non-variable " + recursivePrint(first);
		first = first.value;
		second = toGame(second);
		bind(first,second);
		return first + " = " + forceDisplay(second);
	    }
	}
	if(data.type == "atom") {
	    data = data.value;
	    if(data in namesToValues)
		return forceDisplay(namesToValues[data]);
	    return "Error: unrecognized variable " + data;
	}
	if(data.type == "neg" && data.value.type == "atom") {
	    data = data.value.value;
	    if(data in namesToValues)
		return forceDisplay(neg(namesToValues[data]));
	    return "Error: unrecognized variable " + data;
	}
	    
	data = toGame(data);
	return display(data);
	
    }
    else {
	// parse error
	return "Parse error: " + data[1];
    }
}


calculate("0 = {|}");
calculate("1 = {0|}");
calculate("* = {0}");
calculate("2 = 1+1");
calculate("3 = 1+2");
calculate("*2 = {0,*}");
calculate("4=2+2");
calculate("1/2 = {0|1}");
calculate("3/2 = {1|2}");
calculate("1/4 = {0|1/2}");
calculate("3/4 = 1/4+1/2");
calculate("1/8 = {0|1/4}");
calculate("3/8 = 1/8+1/4");
calculate("5/8 = 1/2+1/8");
calculate("7/8 = 1-1/8");
calculate("\u2191 = {0|*}");
calculate("\u2193 = -\u2191");
calculate("\u2191* = \u2191+*");
calculate("\u2193* = \u2193+*");



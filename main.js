var inp = document.getElementById('input');
var out = document.getElementById('output');

out.value="Welcome!";
inp.value="";

function doCalc() {
    out.value += "\n>> " + inp.value;
    out.value += "\n" + calculate(inp.value);
    inp.value = "";
    out.scrollTop = out.scrollHeight;
}

function doUp() {
    inp.value += "\u2191";
    inp.focus();
}

function doDown() {
    inp.value += "\u2193";
    inp.focus();
}
    

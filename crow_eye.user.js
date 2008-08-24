// ==UserScript==
// @name	Krähenauge
// @description	Dies ist bzw. wird das clientseitige KSK-Programm. Es unterstützt die Krähen auf ihren Wegen in Alirion und gibt ihnen Überblick und schnelle Reaktionsmöglichkeiten.
// @include	http://www.ritterburgwelt.de/rb/rbstart.php
// @author	JonnyJD
// @version	1.0.1
// ==/UserScript==

var spiel = {
	standard: {
		links: new Array("rbstart",
			//News
		       "|", "rbchronik1", "rbereignis", "rbnachr1", "rbquest",
			//Mili
		       "|", "rbfturma", "rbmonster", "rbminfo0",
			//Wirt
		       "|", "rbrinfo0", "rbrezept", "rbsanzeige2",
			//Diplo
		       "|", "rbtop10", "rbreiche", "rbdiplo", "rbally1"),
		hb: new Array({ mfeld: "294270", feld: "55" },
			{ mfeld: "292269", feld: "44" })
	},
	ab: "rbspiel1728",
	rbspiel1728: {
		armeen: new Array("7666", "h7666h", "7511", "h7511h",
				"6669", "521", "6695", "522"),
		dorf: new Array("297273", "294270", "292269", "293273", "292270"),
		hb: new Array({ mfeld: "294270", feld: "55" },
			{ mfeld: "292269", feld: "44" })
	},
	rbspiel1802: {
		armeen: new Array("7692", "h7692h", "7687", "h7687h",
				"51", "hsol6", "135", "h135h"),
		dorf: new Array("293267", "292267", "291267", "290267", "295268"),
		hb: new Array({ mfeld: "293267", feld: "44" })
	}
}

var seiten = {
	rbstart:	{name: "Thronsaal",	pic: "start"},
	rbchronik1:	{name: "Chronik",	pic: "chronik"},
	rbereignis:	{name: "Ereignisse",	pic: "ereignisse"},
	rbnachr1:	{name: "nachricht",	pic: "name"},
	rbquest:	{name: "Quests",	pic: "quest"},
	rbfturma:	{name: "Allianztürme",	pic: "allianz"},
	rbmonster:	{name: "Monster",	pic: "monster"},
	rbminfo0:	{name: "Untertanen",	pic: "untertanen"},
	rbrinfo0:	{name: "Ressourcen",	pic: "ress0"},
	rbrezept:	{name: "Rezepte",	pic: "rezept"},
	rbsanzeige2:	{name: "Gegenstände",	pic: "sache"},
	rbtop10:	{name: "Top10",		pic: "top10"},
	rbreiche:	{name: "Reiche",	pic: "reiche"},
	rbdiplo:	{name: "Diplomatie",	pic: "diplomatie"},
	rbally1:	{name: "Allianzen",	pic: "allianz"}
}

//Kernvariablen
var wholePage = document.getElementsByTagName('HTML')[0].innerHTML;
var session = document.getElementsByName('name')[0].value;
var spieler = document.getElementsByName('passw')[0].value;

//Bereiche für die Linkleisten einfuegen
//Aufpassen, dass interne forms noch funktionieren
//Test Case: Waren zwischen Einheiten
var altesZentrum = document.getElementsByTagName('CENTER')[0];
var newStuff = document.createElement('table');
newStuff.innerHTML = '<table><tr>' +
	'<td align="center" valign="top"><div id="Leiste3"></div></td>' +
	'<td align="center" valign="top"><div id="Leiste1"></div></td>' +
	'<td id="zentrum"></td>' +
	'<td align="center" valign="top"><div id="Leiste2"></div></td>' +
	'<td align="center" valign="top"><div id="Leiste4"></div></td>' +
	'</tr></table>';
var neuesZentrum = document.createElement('center');
neuesZentrum.appendChild(newStuff);
altesZentrum.parentNode.replaceChild(neuesZentrum, altesZentrum);
document.getElementById("zentrum").appendChild(altesZentrum);


// SpielerID zu Debugzwecken unten ausgeben
var spielertext = document.createElement('div');
spielertext.innerHTML = '<div><br/>' + spieler + '</div>';
document.getElementsByTagName('CENTER')[2].appendChild(spielertext);

if (document.getElementsByName('Einstellungen').length > 0) {
}

function createFormlink(leiste, seite, target) {
	if (seite == "|") { createTrenner(leiste); }
	else {
		var linkForm = document.createElement('form');
		linkForm.innerHTML = '<form method="post">' +
'<input type="hidden" name="name" value="' + session + '">' +
'<input type="hidden" name="passw" value="' + spieler + '">' +
'<input type="hidden" name="seite" value="' + seite + '">' +
'<input type="hidden" name="bereich" value="thronsaal">' +
'<input type="image" name="' + seiten[seite].name + '" ' +
'src="http://www.ritterburgwelt.de/rb/bild/buttons/b_' + seiten[seite].pic +
'.gif" border=0></form>';
		linkForm.method = "post";
		if(target) {
			linkForm.target = target;
			linkForm.style.border = "1px solid red";
		} else { linkForm.style.border = "1px solid black"; }

		document.getElementById('Leiste' + leiste).appendChild(linkForm);
	}
}
function createTrenner(leiste) {
	var newBR = document.createElement('br');
	document.getElementById('Leiste' + leiste).appendChild(newBR);
}
function createTwolink(seite) {
	createFormlink(1, seite, "");
	createFormlink(2, seite, "_blank");
}

//Hauptlinkleisten
if (spiel[spieler] && spiel[spieler].links) { var links = spiel[spieler].links }
else { var links = spiel["standard"].links }
for (var i = 0; i < links.length; i++) {
	createTwolink(links[i]);
}


// kskforum
var ksktag = document.createElement('img');
ksktag.src = "http://www.ritterburgwelt.de/rb/held/allym60.gif";
ksktag.style.border = "1px solid red";
var newlink = document.createElement('a');
newlink.href = "http://ksk.JonnyJD.net/";
newlink.target = "_blank";
newlink.appendChild(ksktag);
document.getElementById('Leiste4').appendChild(newlink);
createTrenner(4); createTrenner(4);

// Armeelinks
if (spiel[spieler] && spiel[spieler].armeen) {
for (var leiste = 3; leiste <= 4; leiste++) { 
	var temptext = '<form method="post">' +
'<input type="hidden" name="name" value="' + session + '">' +
'<input type="hidden" name="passw" value="' + spieler + '">' +
'<input type="hidden" name="seite" value="rbarmee">' +
'<input type="hidden" name="bereich" value="armee">';
	for (var i = 0; i < spiel[spieler].armeen.length-1; i += 2) {
		temptext += 
'<input type="image" name="armee[' + spiel[spieler].armeen[i] + ']" ' +
'src="http://www.ritterburgwelt.de/rb/held/' + spiel[spieler].armeen[i+1] +
'.gif" border=0><br/>';
	}
	temptext += '</form>';
	var linkForm = document.createElement('form');
	linkForm.innerHTML = temptext;
	linkForm.method = "post";
	if(leiste==4) {
		linkForm.target = "_blank";
		linkForm.style.border = "1px solid red";
	} else {
		linkForm.style.border = "1px solid black";
	}
	document.getElementById('Leiste' + leiste).appendChild(linkForm);
	createTrenner(leiste);
}
}

// Dorflinks
if (spiel[spieler] && spiel[spieler].dorf) {
for (var leiste = 3; leiste <= 4; leiste++) { 
	temptext = '<form method="post">' +
'<input type="hidden" name="name" value="' + session + '">' +
'<input type="hidden" name="passw" value="' + spieler + '">' +
'<input type="hidden" name="seite" value="rbkarte">' +
'<input type="hidden" name="bereich" value="dorf">';
	for (var i = 0; i < spiel[spieler].dorf.length; i ++) {
		temptext += 
'<input type="image" name="mfeld[' + spiel[spieler].dorf[i] + ']" ' +
'src="http://www.ritterburgwelt.de/rb/bild/buttons/b_map.gif" border=0><br/>';
	}
	temptext += '</form>';
	var linkForm = document.createElement('form');
	linkForm.innerHTML = temptext;
	linkForm.method = "post";
	if(leiste==4) {
		linkForm.target = "_blank";
		linkForm.style.border = "1px solid red";
	} else {
		linkForm.style.border = "1px solid black";
	}
	document.getElementById('Leiste' + leiste).appendChild(linkForm);
	createTrenner(leiste);
}
}

// HBlinks
if (spiel[spieler] && spiel[spieler].hb) {
// Ring
for (var leiste = 3; leiste <= 4; leiste++) { 
	var linkForm = document.createElement('form');
	linkForm.innerHTML = '<form method="post">' +
'<input type="hidden" name="name" value="' + session + '">' +
'<input type="hidden" name="passw" value="' + spieler + '">' +
'<input type="hidden" name="seite" value="3">' +
'<input type="hidden" name="bereich" value="dorf">' +
'<input type="hidden" name="modul" value="handel">' +
'<input type="hidden" name="mfeld" value="' + spiel[spieler].hb[0].mfeld + '">' +
'<input type="hidden" name="feld" value="' + spiel[spieler].hb[0].feld + '">' +
'<input type="image" name="Handelsring" src="http://www.ritterburgwelt.de/rb/bild/buttons/b_chronik.gif" border=0></form>';
	linkForm.method = "post";
	if(leiste==4) {
		linkForm.target = "_blank";
		linkForm.style.border = "1px solid red";
	} else {
		linkForm.style.border = "1px solid black";
	}
	document.getElementById('Leiste' + leiste).appendChild(linkForm);
	createTrenner(leiste);
}

// Allianz
for (var i = 0; i < spiel["standard"].hb.length; i++) {
	var j = 0;
	if (spieler == spiel["ab"]) { j = i; }
	for (var leiste = 3; leiste <= 4; leiste++) { 
		var linkForm = document.createElement('form');
		linkForm.innerHTML = '<form method="post">' +
'<input type="hidden" name="name" value="' + session + '">' +
'<input type="hidden" name="passw" value="' + spieler + '">' +
'<input type="hidden" name="seite" value="31">' +
'<input type="hidden" name="bereich" value="dorf">' +
'<input type="hidden" name="modul" value="handel">' +
'<input type="hidden" name="mfeld2" value="'+ spiel["standard"].hb[i].mfeld + '">' +
'<input type="hidden" name="mfeld" value="'+spiel[spieler].hb[j].mfeld+'">' +
'<input type="hidden" name="feld" value="' +spiel[spieler].hb[j].feld + '">' +
'<input type="image" name="Angebot" src="http://www.ritterburgwelt.de/rb/bild/buttons/b_map.gif" border=0></form>';
		linkForm.method = "post";
		if(leiste==4) {
			linkForm.target = "_blank";
			linkForm.style.border = "1px solid red";
		} else {
			linkForm.style.border = "1px solid black";
		}
		document.getElementById('Leiste' + leiste).appendChild(linkForm);
	}
}
}
createTrenner(3);
createTrenner(4);

// kskpreise
var ksktag = document.createElement('img');
ksktag.src = "http://www.ritterburgwelt.de/rb/held/allym60.gif";
ksktag.style.border = "1px solid red";
var newlink = document.createElement('a');
newlink.href = "http://ksk.JonnyJD.net/alirion/preise";
newlink.target = "_blank";
newlink.appendChild(ksktag);
document.getElementById('Leiste4').appendChild(newlink);

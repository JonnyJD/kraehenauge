// ==UserScript==
// @name           Kraehenauge
// @description    Dies ist bzw. wird das clientseitige KSK-Programm. Es unterstuetzt die Kraehen auf ihren Wegen in Alirion und gibt ihnen Ueberblick und schnelle Reaktionsmoeglichkeiten.
// @include        http://www.ritterburgwelt.de/rb/rbstart.php
// @author         JonnyJD
// @version        1.0.1
// ==/UserScript==

var version = 'Kr\xE4henauge 1.0.1';
var game = {
    standard: {
        links: new Array("rbstart",
                       // News
                       "|", "rbchronik1", "rbereignis", "rbnachr1", "rbquest",
                       // Mili
                       "|", "rbfturma", "rbmonster", "rbminfo0",
                       // Wirt
                       "|", "rbrinfo0", "rbrezept", "rbsanzeige2",
                       // Diplo
                       "|", "rbtop10", "rbreiche", "rbdiplo", "rbally1"),
        hb: new Array({ mfeld: "294270", feld: "55" },
                { mfeld: "292269", feld: "44" })
    },
    // Der Spieler, der die AB und EB kontrolliert
    ab: "rbspiel1728",
    // Jonerian
    rbspiel1728: {
        armeen: new Array("7666", "h7666h", "7511", "h7511h",
                        "6669", "521", "6695", "522"),
        dorf: new Array("297273", "294270", "292269", "293273", "292270"),
        hb: new Array({ mfeld: "294270", feld: "55" },
                { mfeld: "292269", feld: "44" })
    },
    // Rich
    rbspiel1802: {
        armeen: new Array("7692", "h7692h", "7687", "h7687h",
                        "90", "h2s7", "135", "h135h"),
        dorf: new Array("293267", "292267", "291267", "290267", "295268"),
        hb: new Array({ mfeld: "293267", feld: "44" })
    },
    // Boerni
    rbspiel1850: {
        armeen: new Array("7924", "h7924h", "7920", "h7920h",
                        "6723", "505", "4105", "516"),
        dorf: new Array("282270", "269265", "290268", "282269", "292268"),
        hb: new Array({ mfeld: "292268", feld: "62" })
    }
}

var pages = {
    rbstart:     {name: "Thronsaal",       pic: "start"},
    rbchronik1:  {name: "Chronik",         pic: "chronik"},
    rbereignis:  {name: "Ereignisse",      pic: "ereignisse"},
    rbnachr1:    {name: "nachricht",       pic: "name"},
    rbquest:     {name: "Quests",          pic: "quest"},
    rbfturma:    {name: "Allianzt\xFCrme", pic: "allianz"},
    rbmonster:   {name: "Monster",         pic: "monster"},
    rbminfo0:    {name: "Untertanen",      pic: "untertanen"},
    rbrinfo0:    {name: "Ressourcen",      pic: "ress0"},
    rbrezept:    {name: "Rezepte",         pic: "rezept"},
    rbsanzeige2: {name: "Gegenst\xE4nde",  pic: "sache"},
    rbtop10:     {name: "Top10",           pic: "top10"},
    rbreiche:    {name: "Reiche",          pic: "reiche"},
    rbdiplo:     {name: "Diplomatie",      pic: "diplomatie"},
    rbally1:     {name: "Allianzen",       pic: "allianz"}
}

// Kernvariablen
var wholePage = document.getElementsByTagName('HTML')[0].innerHTML;
var session = document.getElementsByName('name')[0].value;
var gameId = document.getElementsByName('passw')[0].value;

// Bereiche fuer die Linkleisten einfuegen
// Aufpassen, dass interne forms noch funktionieren
// test case: Waren zwischen Einheiten
var oldCenter = document.getElementsByTagName('CENTER')[0];
var newTable = document.createElement('table');
newTable.innerHTML = '<table><tr>' +
    '<td align="center" valign="top"><div id="Leiste3"></div></td>' +
    '<td align="center" valign="top"><div id="Leiste1"></div></td>' +
    '<td id="zentrum"></td>' +
    '<td align="center" valign="top"><div id="Leiste2"></div></td>' +
    '<td align="center" valign="top"><div id="Leiste4"></div></td>' +
    '</tr></table>';
var newCenter = document.createElement('center');
newCenter.appendChild(newTable);
oldCenter.parentNode.replaceChild(newCenter, oldCenter);
document.getElementById("zentrum").appendChild(oldCenter);


// Spiel-ID zu Debugzwecken unten ausgeben
var gameInfo = document.createElement('div');
gameInfo.innerHTML = '<div><br/>' + gameId + '</div>';
document.getElementsByTagName('CENTER')[2].appendChild(gameInfo);
// Versionsnummer unten ausgeben
var versionInfo = document.createElement('div');
versionInfo.innerHTML = '<br/>' + version;
document.getElementsByTagName('CENTER')[2].appendChild(versionInfo);


function createFormLink(listNumber, page, target)
{
    if (page == "|") {
        createSeparation(listNumber);
    } else {
        var linkForm = document.createElement('form');
        linkForm.innerHTML = '<form method="post">' +
            '<input type="hidden" name="name" value="' + session + '">' +
            '<input type="hidden" name="passw" value="' + gameId + '">' +
            '<input type="hidden" name="seite" value="' + page + '">' +
            '<input type="hidden" name="bereich" value="thronsaal">' +
            '<input type="image" name="' + pages[page].name + '" ' +
            'src="http://www.ritterburgwelt.de/rb/bild/buttons/b_' +
            pages[page].pic + '.gif" border=0></form>';
        linkForm.method = "post";
        if (target) {
            linkForm.target = target;
            linkForm.style.border = "1px solid red";
        } else {
            linkForm.style.border = "1px solid black";
        }

        document.getElementById('Leiste' + listNumber).appendChild(linkForm);
    }
}

function createSeparation(listNumber)
{
    var newBreak = document.createElement('br');
    document.getElementById('Leiste' + listNumber).appendChild(newBreak);
}

function createTwoLinks(page)
{
    createFormLink(1, page, "");
    createFormLink(2, page, "_blank");
}

// Hauptlinkleisten
if (game[gameId] && game[gameId].links) {
    var links = game[gameId].links;
} else {
    var links = game["standard"].links;
}
for (var i = 0; i < links.length; i++) {
    createTwoLinks(links[i]);
}


// kskforum
var kskTag = document.createElement('img');
kskTag.src = "http://www.ritterburgwelt.de/rb/held/allym60.gif";
kskTag.style.border = "1px solid red";
var newLink = document.createElement('a');
newLink.href = "http://ksk.JonnyJD.net/";
newLink.target = "_blank";
newLink.appendChild(kskTag);
document.getElementById('Leiste4').appendChild(newLink);
createSeparation(4); createSeparation(4);

// Armeelinks
if (game[gameId] && game[gameId].armeen) {
    for (var listNumber = 3; listNumber <= 4; listNumber++) { 
        var tempText = '<form method="post">' +
            '<input type="hidden" name="name" value="' + session + '">' +
            '<input type="hidden" name="passw" value="' + gameId + '">' +
            '<input type="hidden" name="seite" value="rbarmee">' +
            '<input type="hidden" name="bereich" value="armee">';
        for (var i = 0; i < game[gameId].armeen.length-1; i += 2) {
            tempText += 
                '<input type="image" name="armee[' +
                game[gameId].armeen[i] + ']" ' +
                'src="http://www.ritterburgwelt.de/rb/held/' +
                game[gameId].armeen[i+1] + '.gif" border=0><br/>';
        }
        tempText += '</form>';
        var linkForm = document.createElement('form');
        linkForm.innerHTML = tempText;
        linkForm.method = "post";
        if (listNumber == 4) {
            linkForm.target = "_blank";
            linkForm.style.border = "1px solid red";
        } else {
            linkForm.style.border = "1px solid black";
        }
        document.getElementById('Leiste' + listNumber).appendChild(linkForm);
        createSeparation(listNumber);
    }
}

// Dorflinks
if (game[gameId] && game[gameId].dorf) {
    for (var listNumber = 3; listNumber <= 4; listNumber++) { 
        var tempText = '<form method="post">' +
            '<input type="hidden" name="name" value="' + session + '">' +
            '<input type="hidden" name="passw" value="' + gameId + '">' +
            '<input type="hidden" name="seite" value="rbkarte">' +
            '<input type="hidden" name="bereich" value="dorf">';
        for (var i = 0; i < game[gameId].dorf.length; i ++) {
            tempText += 
                '<input type="image" name="mfeld[' +
                game[gameId].dorf[i] + ']" ' +
                'src="http://www.ritterburgwelt.de/rb/bild/buttons/b_map.gif"' +
                ' border=0><br/>';
        }
        tempText += '</form>';
        var linkForm = document.createElement('form');
        linkForm.innerHTML = tempText;
        linkForm.method = "post";
        if (listNumber == 4) {
            linkForm.target = "_blank";
            linkForm.style.border = "1px solid red";
        } else {
            linkForm.style.border = "1px solid black";
        }
        document.getElementById('Leiste' + listNumber).appendChild(linkForm);
        createSeparation(listNumber);
    }
}

// HBlinks
if (game[gameId] && game[gameId].hb) {
    // Ring
    for (var listNumber = 3; listNumber <= 4; listNumber++) { 
        var linkForm = document.createElement('form');
        linkForm.innerHTML = '<form method="post">' +
            '<input type="hidden" name="name" value="' + session + '">' +
            '<input type="hidden" name="passw" value="' + gameId + '">' +
            '<input type="hidden" name="seite" value="3">' +
            '<input type="hidden" name="bereich" value="dorf">' +
            '<input type="hidden" name="modul" value="handel">' +
            '<input type="hidden" name="mfeld" value="' +
            game[gameId].hb[0].mfeld + '">' +
            '<input type="hidden" name="feld" value="' +
            game[gameId].hb[0].feld + '">' +
            '<input type="image" name="Handelsring" ' +
            'src="http://www.ritterburgwelt.de/rb/bild/buttons/b_chronik.gif"' +
            ' border=0></form>';
        linkForm.method = "post";
        if (listNumber == 4) {
            linkForm.target = "_blank";
            linkForm.style.border = "1px solid red";
        } else {
            linkForm.style.border = "1px solid black";
        }
        document.getElementById('Leiste' + listNumber).appendChild(linkForm);
        createSeparation(listNumber);
    }

    // Allianz
    for (var i = 0; i < game["standard"].hb.length; i++) {
        var j = 0; // Die erste hb des Spielers greift auf die AB zu
        if (gameId == game["ab"]) {
            // Der Besitzer der Handelsbuden greift mit versch. Buden zu
            j = i;
        }
        for (var listNumber = 3; listNumber <= 4; listNumber++) { 
            var linkForm = document.createElement('form');
            linkForm.innerHTML = '<form method="post">' +
                '<input type="hidden" name="name" value="' + session + '">' +
                '<input type="hidden" name="passw" value="' + gameId + '">' +
                '<input type="hidden" name="seite" value="31">' +
                '<input type="hidden" name="bereich" value="dorf">' +
                '<input type="hidden" name="modul" value="handel">' +
                '<input type="hidden" name="mfeld2" value="' +
                game["standard"].hb[i].mfeld + '">' +
                '<input type="hidden" name="mfeld" value="' +
                game[gameId].hb[j].mfeld+'">' +
                '<input type="hidden" name="feld" value="' +
                game[gameId].hb[j].feld + '">' +
                '<input type="image" name="Angebot" ' +
                'src="http://www.ritterburgwelt.de/rb/bild/buttons/b_map.gif"' +
                ' border=0></form>';
            linkForm.method = "post";
            if (listNumber == 4) {
                linkForm.target = "_blank";
                linkForm.style.border = "1px solid red";
            } else {
                linkForm.style.border = "1px solid black";
            }
            document.getElementById('Leiste' + listNumber).appendChild(linkForm);
        }
    }
}
createSeparation(3);
createSeparation(4);

// kskpreise
var kskTag = document.createElement('img');
kskTag.src = "http://www.ritterburgwelt.de/rb/held/allym60.gif";
kskTag.style.border = "1px solid red";
var newLink = document.createElement('a');
newLink.href = "http://ksk.JonnyJD.net/alirion/preise";
newLink.target = "_blank";
newLink.appendChild(kskTag);
document.getElementById('Leiste4').appendChild(newLink);


//Antwort des Scanners vom Server
var newDiv = document.createElement('div');
newDiv.align = "center";
document.getElementsByTagName('BODY')[0].appendChild(newDiv);
var response = document.createElement('div');
response.id = "ServerAntwort";
response.style.fontFamily = "monospace";
response.style.whiteSpace = "pre";
response.style.backgroundColor = "black";
response.style.color = "green";
response.style.width = "auto";
response.style.maxWidth = "600px";
newDiv.appendChild(response);

GM_xmlhttpRequest({
    method: 'POST',
    url:    'http://ksk.JonnyJD.net/cgi-bin/kskscanner.cgi',
    //headers: { "Content-type" : "text/plain" },
    data:   wholePage,
    onload: function(responseDetails) {
        document.getElementById("ServerAntwort").innerHTML
            = responseDetails.responseText;
    },
    onerror: function(responseDetails) {
        document.getElementById("ServerAntwort").innerHTML
            = 'status: ' + responseDetails.status
            + '\n' + responseDetails.responseText;
    }
})

/* vim:set shiftwidth=4 expandtab smarttab: */

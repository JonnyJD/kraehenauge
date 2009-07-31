// ==UserScript==       {{{1
// @name           Kraehenauge
// @namespace      http://kraehen.org
// @description    Dies ist bzw. wird das clientseitige KSK-Programm. Es unterstuetzt die Kraehen auf ihren Wegen in Alirion und gibt ihnen Ueberblick und schnelle Reaktionsmoeglichkeiten.
// @include        http://www.ritterburgwelt.de/rb/rbstart.php
// @include        file:///home/jonnyjd/rbstart.php.html
// @author         JonnyJD
// @version        1.2.2.2
// ==/UserScript==      }}}1

var version = 'Kr\xE4henauge 1.2.3.1';

// Einstellungen        {{{1
var game = {
    standard: {
        links: new Array("rbstart",
                       // Neuigkeiten
                       "|", "rbchronik1", "rbereignis", "rbnachr1", "rbquest",
                       // Militaer
                       "|", "rbfturma", "rbmonster", "rbminfo0",
                       // Wirtschaft
                       "|", "rbrinfo0", "rbrezept", "rbsanzeige2",
                       // Diplomatie
                       "|", "rbtop10", "rbreiche", "rbdiplo", "rbally1"),
        hb: new Array({ mfeld: "294270", feld: "55" },
                { mfeld: "292269", feld: "44" })
    },
    // der Spieler, der die AB und EB kontrolliert
    ab: "rbspiel1728",
}

// Einstellungen Armeesortierung
// 17 = SL, 18 = ZDE, 31 = DR, 38 = P, 43 = d13K, 55 = KdS
// 59 = TW, 60 = KSK, 61 = UfR, 63 = BdS, 67 = RK, 70 = NW
// Trenner ist | (regExp ODER)
var friendlyAllies = "(60)";
var hostileAllies  = "()";

// Einstellungen Ressourcenauswertung und Zugauswertung
// Bei welcher anzahl verbleibender Tage welche Farbe benutzt wird:
tageRot = 5
tageGelb = 15
// 2 Zuege macht man taeglich mindestens
zuegeRot = 10
zuegeGelb = 30

//                       }}}1
var pages = {        // {{{1
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
                     // }}}1
// Kernvariablen        {{{1
var wholePage = document.getElementsByTagName('HTML')[0].innerHTML;
var session = document.getElementsByName('name')[0].value;
var gameId = document.getElementsByName('passw')[0].value;
var debugOut = "";
//                      }}}1

// Seitenerkennung      {{{1
var gamePage = '';
var fontTags = document.getElementsByTagName('font');
var pageTitle = '';
for (var i=0; i < fontTags.length; i++) {
    if (fontTags[i].face == "Diploma"
        && fontTags[i].firstChild.data
        && fontTags[i].firstChild.data.indexOf('\xA9') == -1
        && (fontTags[i].size == 5 || fontTags[i].size == 6)
    ) {
        pageTitle = fontTags[i].firstChild.data;
        break;
    } else if (fontTags[i].face == "Diploma"
        && fontTags[i].firstChild.nodeName == "CENTER"
        && (fontTags[i].size == 5 || fontTags[i].size == 6)
    ) {
        // rbzug macht nen extra center tag
        pageTitle = fontTags[i].firstChild.firstChild.data;
        break;
    }
}
// allgemeine Seiten    {{{2
if (pageTitle.indexOf('Thronsaal') == 0)
    gamePage = 'rbstart';
else if (pageTitle.indexOf('\xD6ffentliche Chronik') == 0)
    gamePage = 'rbchronik1';
else if (pageTitle.indexOf('die letzten Ereignisse') == 0)
    gamePage = 'rbereignis';
else if (pageTitle.indexOf('Nachrichten') == 0)
    gamePage = 'rbnachr1';
else if (pageTitle.indexOf('laufende Quests') == 0)
    gamePage = 'rbquest';
else if (pageTitle.indexOf('T\xFCrme der Allianz') == 0)
    gamePage = 'rbfturma';
else if (pageTitle.indexOf('vernichtete Monster und R\xE4uber') == 0)
    gamePage = 'rbmonster';
else if (pageTitle.indexOf('Aufteilung der verschiedenen Einheiten im Reich:') == 0)
    gamePage = 'rbminfo0';
else if (pageTitle.indexOf('Ressourcen im Reich ') == 0)
    gamePage = 'rbrinfo0';
else if (pageTitle.indexOf('bekannte Rezepte') == 0)
    gamePage = 'rbrezept';
else if (pageTitle.indexOf('bekannte Gegenst\xE4nde') == 0)
    gamePage = 'rbanzeige2';
else if (pageTitle.indexOf('eigene Punktzahl') == 0)
    gamePage = 'rbftop10';
else if (pageTitle.indexOf('Die besten Arbeiter') == 0)
    gamePage = 'rbtop10b';
else if (pageTitle.indexOf('TOP 10 der Bekanntheit') == 0)
    gamePage = 'rbtop10q';
else if (pageTitle.indexOf('\xDCbersicht der Reiche') == 0)
    gamePage = 'rbreiche';
else if (pageTitle.indexOf('Diplomatie') == 0)
    gamePage = 'rbdiplo';
else if (pageTitle.indexOf('Allianzen') == 0)
    gamePage = 'rbally1';
//                      }}}2
// Individualseiten     {{{2
else if (pageTitle.indexOf('Armee') == 0)
    gamePage = 'rbarmee';
else if (pageTitle.search(/Dorf (.*), Handelsbude/) == 0)
    gamePage = 'rbfhandel1';
else if (pageTitle.search(/Dorf (.*), Zugergebnisse/) == 0 )
    gamePage = 'rbzug';
else if (pageTitle.search(/Dorf (.*), Turmsicht\(2\)/) == 0)
    gamePage = 'rbfturm2';
else if (pageTitle.search(/Dorf (.*), Turmsicht/) == 0)
    gamePage = 'rbfturm1';
else if (pageTitle.indexOf('Ressourcen im Dorf ') == 0)
    gamePage = 'rbrinfo';
else if (pageTitle.indexOf('Allianz ') == 0)
    gamePage = 'rbally2';
//                      }}}2
//                      }}}1

// Bereiche fuer die Linkleisten einfuegen      {{{1
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
//                                              }}}1
// Spiel-ID zu Debugzwecken unten ausgeben      {{{1
var gameInfo = document.createElement('div');
gameInfo.innerHTML = '<div><br/>' + gameId + ' - ' + gamePage + '</div>';
document.getElementsByTagName('CENTER')[2].appendChild(gameInfo);
// Versionsnummer unten ausgeben
var versionInfo = document.createElement('div');
versionInfo.innerHTML = '<br/>' + version;
document.getElementsByTagName('CENTER')[2].appendChild(versionInfo);
//                                              }}}1
function createFormLink(listNumber, page, target)       // {{{1
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
            'title="' + pages[page].name + '" ' +
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
                                                        // }}}1                                                     
function createSeparation(listNumber)                   // {{{1
{
    var newBreak = document.createElement('br');
    document.getElementById('Leiste' + listNumber).appendChild(newBreak);
}
                                                        // }}}1
function createTwoLinks(page)                           // {{{1
{
    createFormLink(1, page, "");
    createFormLink(2, page, "_blank");
}                                                       // }}}1
// Hauptlinkleisten     {{{1
if (game[gameId] && game[gameId].links) {
    var links = game[gameId].links;
} else {
    var links = game["standard"].links;
}
for (var i = 0; i < links.length; i++) {
    createTwoLinks(links[i]);
}
//                      }}}1
// kskforum             {{{1
var kskTag = document.createElement('img');
kskTag.title = "KSK-Forum";
kskTag.src = "http://www.ritterburgwelt.de/rb/held/allym60.gif";
kskTag.style.border = "1px solid red";
var newLink = document.createElement('a');
newLink.href = "http://ksk.JonnyJD.net/";
newLink.target = "_blank";
newLink.appendChild(kskTag);
document.getElementById('Leiste4').appendChild(newLink);
createSeparation(4); createSeparation(4);
//                      }}}1

// Armeedaten lesen und markieren (Erinnerung)          {{{1
if( gamePage == "rbstart" ) {
    // Armeetabelle finden              {{{2
    var fontTags = document.getElementsByTagName('font');
    for (var i=0; i < fontTags.length; i++) {
        if (fontTags[i].face == "Diploma"
            && fontTags[i].firstChild.data
            && fontTags[i].firstChild.data.indexOf('Armeen') == 0
            && fontTags[i].size == 5
        ) {
            var armeeTabelle = fontTags[i].nextSibling;
            break;
        }
    }
    //                                  }}}2
    function farbTage(parentTag, tage, farbe) { // {{{2
    // fuer die spaetere Faerbung
        var dauerNode = parentTag.firstChild;
        if (dauerNode.nodeType != 3) return; // schon farbig
        var dauerArray = dauerNode.data.split("/");
        if (dauerArray[0] == tage) {
            var newDauer = document.createElement("span");
            newDauer.style.color = farbe;
            newDauer.style.fontSize = "1.5em";
            newDauer.appendChild(document.createTextNode(tage));
            parentTag.replaceChild(newDauer, dauerNode);
            var newText = document.createTextNode("/"+dauerArray[1]);
            parentTag.appendChild(newText);
        }
        
    }
    // faerben und einlesen             {{{2
    // Anmerkung: im DOM hat die Tabelle immer ein tbody tag
    var tote = 0;
    var armeeZeilen = armeeTabelle.firstChild.childNodes;
    for (var i = 0; i < armeeZeilen.length; i++) {
        var armeeFeld = armeeZeilen[i].firstChild;
        var armeeNodes = armeeFeld.childNodes;
        for (var j = 0; j < armeeNodes.length; j++) {
            if (armeeNodes[j].nodeType == 3 // Textknoten
                    && armeeNodes[j].data.indexOf('S\xF6ldner') == 0) {
                var bTag = armeeNodes[j].nextSibling;
                farbTage(bTag, "0", "red");
                farbTage(bTag, "1", "yellow");
            }
        }

        // Armeedaten einlesen
        var armeeForm = armeeZeilen[i].childNodes[1].firstChild;
        if (armeeForm) {
            var armeeImg = armeeForm.getElementsByTagName("input")[4];
            GM_setValue(gameId+".armee"+(i+1-tote),
                    armeeImg.name.match(/\[(.*)\]/)[1]);
            GM_setValue(gameId+".armee"+(i+1-tote)+".src",
                    armeeImg.src.match(/([^\/]*)\.gif/)[1]);
            GM_setValue(gameId+".armeen", i+1-tote);
        } else {
            // tote Armeen haben eine Zeile ohne Linkformular
            tote++;
        }
    }
    //                                  }}}2
} // Ende Armeedaten einlesen
//                                                      }}}1

// Dorfdaten lesen                                      {{{1
if( gamePage == "rbstart" ) {
    // Dorftabelle finden
    var fontTags = document.getElementsByTagName('font');
    for (var i=0; i < fontTags.length; i++) {
        if (fontTags[i].face == "Diploma"
            && fontTags[i].size == 5
            && fontTags[i].firstChild.data
            && fontTags[i].firstChild.data.indexOf('D\xF6rfer') == 0
        ) {
            var dorfTabelle = fontTags[i].parentNode
                .getElementsByTagName("table")[0];
            break;
        }
    }

    // Doerfer einlesen
    // Anmerkung: im DOM hat die Tabelle immer ein tbody tag
    var dorfZeilen = dorfTabelle.firstChild.childNodes;
    for (var i = 0; i < dorfZeilen.length; i++) {
        var dorfImg = dorfZeilen[i].getElementsByTagName("input")[0];
        GM_setValue(gameId+".dorf"+(i+1), dorfImg.name.match(/\[(.*)\]/)[1]);
        GM_setValue(gameId+".doerfer", i+1);
    }
} // Ende Dorfdaten einlesen
//                                                      }}}1

// Handelsbude einlesen aus einer Handelsdorfseite      {{{1
if( pageTitle.search(/Dorf (.*), Handelsd\xF6rfer/) == 0) {
    // nur formlinks im unveraenderten mittelteil suchen
    var zentrum = document.getElementById("zentrum");
    var formEins = zentrum.getElementsByTagName("form")[0];
    var inputs = formEins.getElementsByTagName("input");
    for (i = 0; i < inputs.length; i++) {
        if (inputs[i].name == "mfeld") {
            GM_setValue(gameId+".hb.mfeld", inputs[i].value);
            GM_setValue(gameId+".hb.feld", inputs[i+1].value);
            break;
        }
    }
}
//                                                      }}}1

// Armeelinks                   {{{1
if (GM_getValue(gameId+".armeen", 0)) {
    for (var listNumber = 3; listNumber <= 4; listNumber++) { 
        var tempText = '<form method="post">' +
            '<input type="hidden" name="name" value="' + session + '">' +
            '<input type="hidden" name="passw" value="' + gameId + '">' +
            '<input type="hidden" name="seite" value="rbarmee">' +
            '<input type="hidden" name="bereich" value="armee">';
        for (var i = 1; i <= GM_getValue(gameId+".armeen"); i++) {
            tempText += 
                '<input type="image" name="armee[' +
                GM_getValue(gameId+".armee"+i) + ']" ' +
                'title="' + GM_getValue(gameId+".armee"+i) + '" ' +
                'src="http://www.ritterburgwelt.de/rb/held/' +
                GM_getValue(gameId+".armee"+i+".src") + '.gif" border=0><br/>';
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
//                              }}}1
// Kraehenkarte                 {{{1
var kskKarte = document.createElement('img');
kskKarte.title = "Kr\xE4henkarte"
kskKarte.src = "http://www.ritterburgwelt.de/rb/held/allym60.gif";
kskKarte.style.border = "1px solid red";
var newLink = document.createElement('a');
newLink.href = "http://kraehen.org/karte/";
newLink.target = "_blank";
newLink.appendChild(kskKarte);
document.getElementById('Leiste4').appendChild(newLink);
createSeparation(4); createSeparation(4);
//                              }}}1
// Dorflinks                    {{{1
if (GM_getValue(gameId+".doerfer", 0)) {
    for (var listNumber = 3; listNumber <= 4; listNumber++) { 
        var tempText = '<form method="post">' +
            '<input type="hidden" name="name" value="' + session + '">' +
            '<input type="hidden" name="passw" value="' + gameId + '">' +
            '<input type="hidden" name="seite" value="rbkarte">' +
            '<input type="hidden" name="bereich" value="dorf">';
        for (var i = 1; i <= GM_getValue(gameId+".doerfer"); i ++) {
            tempText += 
                '<input type="image" name="mfeld[' +
                GM_getValue(gameId+".dorf"+i) + ']" ' +
                'title="' + GM_getValue(gameId+".dorf"+i) + '" ' +
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
//                              }}}1
// HBlinks                      {{{1
if (GM_getValue(gameId+".hb.mfeld")) {
    // Ring             {{{2
    for (var listNumber = 3; listNumber <= 4; listNumber++) { 
        var linkForm = document.createElement('form');
        linkForm.innerHTML = '<form method="post">' +
            '<input type="hidden" name="name" value="' + session + '">' +
            '<input type="hidden" name="passw" value="' + gameId + '">' +
            '<input type="hidden" name="seite" value="3">' +
            '<input type="hidden" name="bereich" value="dorf">' +
            '<input type="hidden" name="modul" value="handel">' +
            '<input type="hidden" name="mfeld" value="' +
            GM_getValue(gameId+".hb.mfeld") + '">' +
            '<input type="hidden" name="feld" value="' +
            GM_getValue(gameId+".hb.feld") + '">' +
            '<input type="image" name="Handelsring" ' +
            'title="Handelsring" ' +
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
    //                  }}}2
    // Allianz          {{{2
    var mfeld;
    var feld;
    for (var i = 0; i < game["standard"].hb.length; i++) {
        var j = 0; // Die erste hb des Spielers greift auf die AB zu
        if (gameId == game["ab"]) {
            mfeld = game["standard"].hb[i].mfeld;
            feld = game["standard"].hb[i].feld;
        } else {
            mfeld = GM_getValue(gameId+".hb.mfeld");
            feld = GM_getValue(gameId+".hb.feld");
        }
        for (var listNumber = 3; listNumber <= 4; listNumber++) { 
            var linkForm = document.createElement('form');
            var tempText = '<form method="post">' +
                '<input type="hidden" name="name" value="' + session + '">' +
                '<input type="hidden" name="passw" value="' + gameId + '">' +
                '<input type="hidden" name="seite" value="31">' +
                '<input type="hidden" name="bereich" value="dorf">' +
                '<input type="hidden" name="modul" value="handel">' +
                '<input type="hidden" name="mfeld2" value="' +
                game["standard"].hb[i].mfeld + '">' +
                '<input type="hidden" name="mfeld" value="' + mfeld + '">' +
                '<input type="hidden" name="feld" value="' + feld + '">' +
                '<input type="image" name="Angebot" ';
            if (i == 0) tempText += 'title="EB" ';
            if (i == 1) tempText += 'title="AB" ';
            tempText +=
                'src="http://www.ritterburgwelt.de/rb/bild/buttons/b_map.gif"' +
                ' border=0></form>';
            linkForm.innerHTML = tempText;
            linkForm.method = "post";
            if (listNumber == 4) {
                linkForm.target = "_blank";
                linkForm.style.border = "1px solid red";
            } else {
                linkForm.style.border = "1px solid black";
            }
            document.getElementById('Leiste' + listNumber).appendChild(linkForm);
        }
    }   //              }}}2
}
createSeparation(3);
createSeparation(4);
//                              }}}1
// kskpreise                    {{{1
var kskTag = document.createElement('img');
kskTag.title = "Preise";
kskTag.src = "http://www.ritterburgwelt.de/rb/held/allym60.gif";
kskTag.style.border = "1px solid red";
var newLink = document.createElement('a');
newLink.href = "http://kraehen.org/preise";
newLink.target = "_blank";
newLink.appendChild(kskTag);
document.getElementById('Leiste4').appendChild(newLink);
//                              }}}1

// Antwort des Scanners vom Server      {{{1
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

function sendToScanner() {      // {{{2
    GM_xmlhttpRequest({
        method: 'POST',
        url:    'http://kraehen.org/kskscanner',
        headers: { "Content-type" : "text/html" },
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
}                               // }}}2


function saveToServer() {      // {{{2
    GM_xmlhttpRequest({
        method: 'POST',
        url:    'http://kraehen.org/save?' + gamePage,
        headers: { "Content-type" : "text/html" },
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
}                               // }}}2

if (gamePage == "rbftop10"
        || gamePage == "rbtop10q"
        || gamePage == "rbfhandel1"
        || gamePage == "rbrinfo"
        || gamePage == "rbrinfo0") {
    sendToScanner();
    //saveToServer();
}
//                                      }}}1

function createOutputArea(id) { //      {{{1
    var newDiv = document.createElement('div');
    newDiv.align = "center";
    document.getElementsByTagName('BODY')[0].appendChild(newDiv);
    var response = document.createElement('div');
    response.id = id;
    response.style.backgroundColor = "#AF874E";
    response.style.width = "auto";
    response.style.maxWidth = "600px";
    newDiv.appendChild(response);
    newDiv.appendChild(document.createElement("br"));
    return response;
}
// }}}1

// Antwort der Datenbank                {{{1

function visibleText(htmlPage) {                                // {{{2
    var copyText = htmlPage;
    // "herauskopieren" des sichtbaren Texts
    copyText = copyText.replace(/<head>(.|\n)*<\/head>/gi, "");
    copyText = copyText.replace(/<script[^>]*>[^<]*<\/script>/gi, "");
    copyText = copyText.replace(/<br ?\/?>/gi, "\n");
    copyText = copyText.replace(/<\/tr>/gi, "\n");
    copyText = copyText.replace(/<\/td>/gi, "\t");
    copyText = copyText.replace(/<li>/gi, "\n    * ");
    copyText = copyText.replace(/<\/ul>/gi, "\n");
    copyText = copyText.replace(/<[^>]*>/g, "");
    copyText = copyText.replace(/&nbsp;/gi, " ");
    return copyText;
}                                               // }}}2

createOutputArea("DBAntwort");
copyText = visibleText(wholePage);
//document.getElementById("DBAntwort").innerHTML = "<pre>"+copyText+"</pre>";

function sendToHandler(handler, fieldName, content, answer) {    // {{{2
    GM_xmlhttpRequest({
        method: 'POST',
        url:    "http://kraehen.org/"+handler,
        headers: { "Content-type" : "application/x-www-form-urlencoded" },
        data:   fieldName+'='+encodeURIComponent(content),
        onload: function(responseDetails) {
            document.getElementById(answer).innerHTML
                = responseDetails.responseText;
        },
        onerror: function(responseDetails) {
            document.getElementById(answer).innerHTML
                = 'status: ' + responseDetails.status
                + '\n' + responseDetails.responseText;
        }
    })
}                                               // }}}2

if (gamePage == "rbarmee") {

    sendToHandler("/send/text/armee", "dorftext", copyText, "DBAntwort");
}

if (gamePage == "rbfturm1"
    || gamePage == "rbfturm2"
    || gamePage == "rbfturma") {

    sendToHandler("/send/text/turm", "text", copyText, "DBAntwort");
}

// datenpflegeseite kann momentan nicht von allen benutzt werden
if (gameId == 'rbspiel1728') {
    if (gamePage == 'rbftop10') {

        sendToHandler("/send/text/top10", "wahl=top10&textbereich",
                copyText, "DBAntwort");
    }

    if (gamePage == 'rbally2') {

        sendToHandler("/send/text/allianz", "wahl=alli&textbereich",
                copyText, "DBAntwort");
    }
}
//                                      }}}1

// Landschaftserfassung         {{{1
if (gamePage == "rbarmee") {
    var output = createOutputArea("Landschaft");
    var sendData = "";

    // Kartenmittelpunkt suchen
    // = erstes Auftreten eines Kartenbildes im Code
    var imgEntries = document.getElementsByTagName("img");
    i = 0;
    while (i < imgEntries.length
            && imgEntries[i].src.indexOf('/bild/karte/') == -1) { i++; }
    if (i == imgEntries.length) {
        var text = "Kartenmitte konnte nicht ermittelt werden.";
        output.appendChild(document.createTextNode(text));
        return;
    } else {
        // Koordinaten des Mittelpunkts
        var tdNode = imgEntries[i].parentNode.nextSibling;
        text = tdNode.childNodes[1].firstChild.nodeValue;
        var expr = /(Q|U[0-9])?,? ?([0-9]*),([0-9]*)/;
        fields = expr.exec(text);
        var floor = fields[1];
        var xval = parseInt(fields[2]);
        var yval = parseInt(fields[3]);
        if (fields[1] == undefined || fields[1] == "Q") {
            var floor = "N";
        }
        sendData += floor + " " + xval + " " + yval + " ";
        // Terrain
        sendData += imgEntries[i].src.replace(/.*\/([^\/]*)\.gif/, '$1');
        // Landschaftsname
        sendData += tdNode.firstChild.nodeValue.replace(/(.*) :/, '$1');
    }

    // Kartenausschnitt finden
    // gekennzeichnet durch "<td width=20>&nbpsp;></td><td valign=top>"
    // valign=top ist leider Standard, Suche nach width=20
    var tdEntries = document.getElementsByTagName("td");
    var i=0;
    while (i < tdEntries.length && tdEntries[i].width != 20) { i++; }
    if (i == tdEntries.length) {
        output.appendChild(document.createElement("br"));
        var text = "Kartenausschnitt nicht gefunden.";
        output.appendChild(document.createTextNode(text));
        return;
    } else {
        i++; // Wir suchen die darauffolgende Zelle
        var imgEntries = tdEntries[i].getElementsByTagName("img");
        terrain = new Array();
        for (var i=0; i < imgEntries.length; i++) {
            if (imgEntries[i].src.indexOf("buttons") == -1) {
                // Alles was kein Button ist, ist hier ein Feld
                var num = imgEntries[i].src.replace(/.*\/([^\/]*)\.gif/,'$1');
                terrain.push(num);
            }
        }
        var width = Math.sqrt(terrain.length);
        for (var i=0; i < terrain.length; i++) {
            x = xval + (i % width ) - Math.floor(width / 2);
            if (width == 3) {
                if (i < 3)             { y = yval - 1; }
                else if (i < 6)        { y = yval;     }
                else                   { y = yval + 1; };
            } else {    // width == 5, Entdecker ?
                if (i < 5)             { y = yval - 2; }
                else if (i < 10)       { y = yval - 1; }
                else if (i < 15)       { y = yval;     }
                else if (i < 20)       { y = yval + 1; }
                else                   { y = yval + 2; };
            }
            if (x != xval || y != yval) {
                // Das Zentrum braucht nicht doppelt uebertragen werden
                sendData += "\n";
                sendData += floor + " " + x + " " + y + " ";
                sendData += terrain[i];
            }

        }
        sendToHandler("/send/terrain", "data", sendData, "Landschaft");
    }
}
// }}}1

// Armeesortierung              {{{1
function allyArmee(imgEntry, allies) {  // {{{2
    var box = imgEntry.parentNode.parentNode;
    var pattern = new RegExp("http://www.ritterburgwelt.de/rb/held//allym"+
        allies+".gif","");
    if (box.innerHTML.indexOf("Menschentransfer")	== -1 // eigene Armee
        || box.innerHTML.indexOf("Dorf")		== -1
        || box.innerHTML.indexOf("Aussenposten")	== -1
       ) {
        return false;
    } else {
        return pattern.exec(imgEntry.src);
    }
}                                       // }}}2

if( gamePage == "rbarmee" 
    || gamePage == "rbfturm1"
    || gamePage == "rbfturm2"
) {
    var imgEntries = document.getElementsByTagName("img");
    var bundListe = new Array();
    var feindListe = new Array();

    // Armmen identifizieren    {{{2
    for( var i = 0; i < imgEntries.length; i++ ) {
        if (allyArmee(imgEntries[i], friendlyAllies)) {
            // Verbuendete Armee
            bundListe.push(imgEntries[i].parentNode.parentNode);
        } else {
            if(allyArmee(imgEntries[i], hostileAllies)) {
                // Feindliche Armee
                feindListe.push(
                        imgEntries[i].parentNode.parentNode);
                feind = true;
            }
        }
    }
    //                          }}}2
    // feindliche Armeen an den Anfang  {{{2
    for( var i = feindListe.length -1; i > -1; i-- ) {
        var parentNode = feindListe[i].parentNode;
        parentNode.removeChild(feindListe[i]);
        parentNode.insertBefore(feindListe[i], parentNode.firstChild);
    }
    //                                  }}}2
    // verbuendete Armeen ganz ans Ende {{{2
    for( var i = 0; i < bundListe.length; i++ ) {
        var parentNode = bundListe[i].parentNode;
        parentNode.removeChild(bundListe[i]);
        parentNode.appendChild(bundListe[i]);
    }
    //                                  }}}2
    // Zusammenfassung          {{{2
    for( var i = 0; i < imgEntries.length; i++ ) {
        if (imgEntries[i].src
                == "http://www.ritterburgwelt.de/rb/bild/gui/boxtrenn0.gif"
                && (feindListe.length + bundListe.length) > 0) {
            temp = document.createTextNode("Hier stehen " +
                    feindListe.length + " Feinde und " +
                    bundListe.length + " Verb\xFCndete.");
            imgEntries[i].parentNode.parentNode.parentNode.appendChild(temp);
            break;
        }
    }

    if (feindListe.length > 0) {
        document.body.background ="";
        document.bgColor = "#FF0000";
    }
    //                          }}}2
} // ende Armeesortierung
//                              }}}1

// Ressourcenauswertung         {{{1
if( gamePage == "rbrinfo0" ) {
    // Finde die Warentabelle           {{{2
    var gueterTabelle = "";
    var tabellen = document.getElementsByTagName("table");
    for (var i=0; i < tabellen.length; i++) {
        if (tabellen[i].getElementsByTagName("tr")[0]
                .firstChild.firstChild.data == "Gut") {
            gueterTabelle = tabellen[i];
            break;
        }
    }
    //                                  }}}2
    // Zaehle die Doerfer               {{{2
    var doerfer = 0;
    while (gueterTabelle.getElementsByTagName("tr")[0]
            .childNodes[doerfer+1].innerHTML.indexOf("Dorf") >= 0) {
        doerfer++;
    }
    var posten = 0;
    while (gueterTabelle.getElementsByTagName("tr")[0]
            .childNodes[doerfer+posten+1].innerHTML.indexOf("Aussenp.") >= 0) {
        posten++;
    }
    var gesamt = doerfer + posten + 1;
    //                                  }}}2
    // Zeile mit verbleibenden Tagen pro Dorf vorbereiten       {{{2
    var restTageZeile = document.createElement("tr");
    gueterTabelle.getElementsByTagName("tr")[0].parentNode.insertBefore(
            restTageZeile, gueterTabelle.getElementsByTagName("tr")[1]);
    for (var i=0; i < gueterTabelle.getElementsByTagName("tr")[0]
            .childNodes.length; i++) {
        restTageZeile.appendChild(document.createElement("td"));
    }
    var textNode = document.createTextNode("Tage verbleibend");
    restTageZeile.childNodes[0].appendChild(textNode);
    //                                                          }}}2
    // Funktion fuer die Ausgabe und Formatierung       {{{2
    function zellenInfo(info, tage, zelle) {
        if (zelle.childNodes >= 0) {
            zelle.appendChild(document.createElement("br"));
        }
        divTag = document.createElement("div");
        divTag.style.textAlign = "right";
        divTag.style.fontStyle = "italic";
        divTag.appendChild(document.createTextNode(info));
        zelle.appendChild(divTag);
        if (tage <= tageRot) {
            zelle.style.backgroundColor = "red";
        } else if (tage <= tageGelb) {
            zelle.style.backgroundColor = "yellow";
        }
    }
    //                                                  }}}2
    // jedes Dorf Betrachten                            {{{2
    for (var d = 1; d <= doerfer; d++) {
        restTageDorf = 99999;
        zuegeImDorf = gueterTabelle.getElementsByTagName("tr")[0]
            .childNodes[d].childNodes[8].nodeValue;
        // jedes Gut betrachten
        for (var i = 2; i < 25; i++) {
            var zelle = gueterTabelle.getElementsByTagName("tr")[i]
                .childNodes[d];
            var zellenText = zelle.firstChild;
            if (zellenText.firstChild) {
                var werte = zellenText.firstChild.nodeValue.split("(");
                var anzahl = werte[0];
                var veraenderung = werte[1].replace(")","");
                if (veraenderung < 0) {
                    var restZuege = Math.floor(anzahl / Math.abs(veraenderung));
                    var restTage = Math.floor(restZuege / zuegeImDorf);
                    if (restTage < restTageDorf) { restTageDorf = restTage; }
                    var info = restZuege + " | " + restTage;
                    zellenInfo(info, restTage, zelle);
                }	
                zelle.style.verticalAlign = "top";
            }
        }
        // verbleibende Tage fuer das Dorf
        if (restTageDorf == 99999) { restTageDorf = String.fromCharCode(8734); }
        zelle = gueterTabelle.getElementsByTagName("tr")[1].childNodes[d];
        zellenInfo(restTageDorf, restTageDorf, zelle);
    }
    //                                                  }}}2
    // fuer jedes Gut die Summenspalte betrachten       {{{2
    var restTageReich = 99999;
    for (var i = 2; i < 25; i++) {
        var zelle = gueterTabelle.getElementsByTagName("tr")[i]
            .childNodes[gesamt];
        var zellenText = zelle.firstChild;
        if (zellenText.firstChild) {
            var anzahl = zellenText.childNodes[0].firstChild.nodeValue;
            var veraenderung = zellenText.childNodes[1].nodeValue;
            veraenderung = veraenderung.replace(/\((.*)\)/,"$1");			
            if (veraenderung < 0) {
                var restTage = Math.floor(anzahl / Math.abs(veraenderung));
                if (restTage < restTageReich) { restTageReich = restTage; }
                zellenInfo(restTage, restTage, zelle);
            }
            zelle.style.verticalAlign = "top";
        }
    }
    // verbleibende Tage fuer das gesamte Reich
    if (restTageReich == 99999) { restTageReich = String.fromCharCode(8734); }
    zelle = restTageZeile.childNodes[gesamt];
    zellenInfo(restTageReich, restTageReich, zelle);
    //                                                  }}}2

} // ende Ressourcenauswertung
//                              }}}1

// Zugauswertung                {{{1
if (gamePage == "rbzug") {
    // finde die Gueterbilanz   {{{2
    var gueterTabelle = '';
    var fontTags = document.getElementsByTagName('font');
    for (var i=0; i < fontTags.length; i++) {
        if (fontTags[i].face == "Diploma"
            && fontTags[i].size == 5
            && fontTags[i].firstChild.data
            && fontTags[i].firstChild.data.indexOf('G\xFCterbilanz') == 0
        ) {
            // Diesmal ist der font noch in <i> tag
            gueterTabelle = fontTags[i].parentNode.nextSibling;
            if (!gueterTabelle) {
                GM_log("extra div vor Guetertabelle");
                // extra span wenn Runenforschung betrieben wird? 
                gueterTabelle = fontTags[i].parentNode.parentNode.nextSibling;
            }
            break;
        }
    }
    gueterZeilen = gueterTabelle.firstChild.childNodes; // beachte tbody
    //                          }}}2
    // Titelzeile               {{{2
    newTD = document.createElement("TD");
    newText = document.createTextNode("Z\xFCge");
    newTD.appendChild(newText);
    gueterZeilen[0].appendChild(newTD);
    //                          }}}2
    // betrachte alle Gueter    {{{2
    // Man beachte die Leerzeile nach der Titelzeile
    for (var gut = 2; gut < gueterZeilen.length; gut++) {
        var diff = gueterZeilen[gut].childNodes[2].firstChild.data;
        var danach = gueterZeilen[gut].childNodes[3].firstChild.data;
        if (diff < 0) {
            var restZuege = Math.floor(danach / Math.abs(diff))
            var newTD = document.createElement("TD");
            newTD.appendChild(document.createTextNode(restZuege));
            if (restZuege <= zuegeGelb) newTD.style.backgroundColor = "yellow";
            if (restZuege <= zuegeRot) newTD.style.backgroundColor = "red";
            gueterZeilen[gut].appendChild(newTD);
        } else {
            var infinite = document.createTextNode(String.fromCharCode(8734));
            var newTD = document.createElement("TD");
            newTD.appendChild(infinite);
            gueterZeilen[gut].appendChild(newTD);
        }
    }
    //                          }}}2
} // Ende Zugauswertung
//                              }}}1

// debugausgabe {{{1
if (debugOut != "") {
    gameInfo.appendChild(document.createTextNode(debugOut));
}       //      }}}1

/* vim:set shiftwidth=4 expandtab smarttab foldmethod=marker: */

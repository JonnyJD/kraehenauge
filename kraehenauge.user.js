// ==UserScript==       {{{1
// @name           Kraehenauge
// @namespace      http://kraehen.org
// @description    Dies ist das clientseitige KSK-Programm. Es unterstuetzt die Kraehen auf ihren Wegen in Alirion und gibt ihnen Ueberblick und schnelle Reaktionsmoeglichkeiten.
// @include        http://www.ritterburgwelt.de/rb/rbstart.php
// @include        http://www.ritterburgwelt.de/rb/ajax_backend.php
// @include        file://*/rbstart.php.html
// @include        file://*/ajax_backend.php
// @author         JonnyJD
// @version        1.4
// ==/UserScript==      }}}1
// Anmerkung: Opera versteht das @include nicht und laed immer!

// gemeinsam benutzte Funktionen        {{{1
if (document.title.indexOf("RB \xA9 - ") == 0
            || document.location
            == "http://www.ritterburgwelt.de/rb/ajax_backend.php") {
    function sendDataWrapper(handler, type, data, responseFunction) {{{2
    {
        var url = "http://kraehen.org/" + handler;
        if (typeof opera != "undefined") {
            var xmlhttp = new opera.XMLHttpRequest();
            xmlhttp.setRequestHeader("Content-type", type);
            xmlhttp.onload = function(){
                responseFunction(this.responseText);
            }
            xmlhttp.open('POST', url, true);
            xmlhttp.send(data);
        } else {
            GM_xmlhttpRequest({
                method: 'POST',
                url:    url,
                headers: { "Content-type" : type },
                data:   data,
                onload: function(responseDetails) {
                    responseFunction(responseDetails.responseText);
                },
            })
        }
    }                                                               }}}2
}                               //      }}}1

// RB-Spielseite
if (document.title.indexOf("RB \xA9 - ") == 0) {

var clientName = 'Kr\xE4henauge';
var clientVersion = '1.4';
var version = clientName + " " + clientVersion;
var DEBUG = false;

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
                { mfeld: "292270", feld: "30" })
    },
    // der Spieler, der die AB und EB kontrolliert
    ab: "rbspiel1728",
}

// Einstellungen Armeesortierung
// 17 = SL, 18 = ZDE, 31 = DR, 38 = P, 43 = d13K, 55 = KdS
// 59 = TW, 60 = KSK, 61 = UfR, 63 = BdS, 67 = RK, 70 = NW
// 32 = Raeuber
// Trenner ist | (regExp ODER)
var friendlyAllies = "(60|59)";
var hostileAllies  = "(32|38)";

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
var wholePage = document.getElementsByTagName('html')[0].innerHTML;
var session = document.getElementsByName('name')[0].value;
var gameId = document.getElementsByName('passw')[0].value;
var a="agent="+encodeURIComponent(version)+"&";
var pid="pid="+encodeURIComponent(gameId)+"&";
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
else if (pageTitle.indexOf('Armee - Schiffsturm') == 0)
    gamePage = 'rbfturms';
else if (pageTitle.indexOf('Armeekampf ') == 0)
    gamePage = 'rbarmeewar';
else if (pageTitle.indexOf('Armee') == 0)
    gamePage = 'rbarmee';
else if (pageTitle.search(/Dorf (.*), Handelsbude/) == 0)
    gamePage = 'rbfhandel1';
else if (pageTitle.search(/Dorf (.*), Handelsd\xF6rfer/) == 0)
    gamePage = 'rbfhandelb'; // kein offizieller Name!
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
var oldCenter = document.getElementsByTagName('center')[0];

// Neue Haupttabelle erstellen
var newTable = document.createElement('table');
var newTR = document.createElement('tr');
var newTD = document.createElement('td');
newTD.style.textAlign = "center"; newTD.style.verticalAlign = "top";
var newDiv = document.createElement('div');
newDiv.id = "Leiste3";
newTD.appendChild(newDiv); newTR.appendChild(newTD);
newTD = document.createElement('td');
newTD.style.textAlign = "center"; newTD.style.verticalAlign = "top";
newDiv = document.createElement('div');
newDiv.id = "Leiste1";
newTD.appendChild(newDiv); newTR.appendChild(newTD);
// Punkt um altes Zentrum einzuhaengen
newTD = document.createElement('td');
newTD.id = "zentrum";
newTR.appendChild(newTD);
newTD = document.createElement('td');
newTD.style.textAlign = "center"; newTD.style.verticalAlign = "top";
newDiv = document.createElement('div');
newDiv.id = "Leiste2";
newTD.appendChild(newDiv); newTR.appendChild(newTD);
newTD = document.createElement('td');
newTD.style.textAlign = "center"; newTD.style.verticalAlign = "top";
newDiv = document.createElement('div');
newDiv.id = "Leiste4";
newTD.appendChild(newDiv); newTR.appendChild(newTD);
newTable.appendChild(newTR);

var newCenter = document.createElement('center');
newCenter.appendChild(newTable);
oldCenter.parentNode.replaceChild(newCenter, oldCenter);
document.getElementById("zentrum").appendChild(oldCenter);
//                                              }}}1
// Spiel-ID zu Debugzwecken unten ausgeben      {{{1
var gameInfo = document.createElement('div');
gameInfo.innerHTML = '<div><br/>' + gameId + ' - ' + gamePage + '</div>';
document.getElementsByTagName('center')[2].appendChild(gameInfo);
// Versionsnummer unten ausgeben
var versionInfo = document.createElement('div');
versionInfo.innerHTML = '<br/>' + version;
document.getElementsByTagName('center')[2].appendChild(versionInfo);
//                                              }}}1
function createFormLink(bereich, page, linkImages, target)       // {{{1
{
    var linkForm = document.createElement('form');
    if (target) {
        linkForm.target = target;
        linkForm.style.border = "1px solid red";
    } else {
        linkForm.style.border = "1px solid black";
    }
    linkForm.method = "post";
    var newInput = document.createElement('input');
    newInput.type = "hidden";
    newInput.name = "name"; newInput.value = session;
    linkForm.appendChild(newInput);
    newInput = document.createElement('input');
    newInput.type = "hidden";
    newInput.name = "passw"; newInput.value = gameId;
    linkForm.appendChild(newInput);
    newInput = document.createElement('input');
    newInput.type = "hidden";
    newInput.name = "seite"; newInput.value = page;
    linkForm.appendChild(newInput);
    newInput = document.createElement('input');
    newInput.type = "hidden";
    newInput.name = "bereich"; newInput.value = bereich;
    linkForm.appendChild(newInput);
    for ( var i = 0; i < linkImages.length; i++ ) {
        linkForm.appendChild(linkImages[i]);
        linkForm.appendChild(document.createElement("br"));
    }
    
    return linkForm;
}
function appendMainLink(listNumber, page, target)       // {{{1
{
    if (page == "|") {
        createSeparation(listNumber);
    } else {
        var linkImage = document.createElement('input');
        linkImage.type = "image";
        linkImage.name = pages[page].name; linkImage.title = pages[page].name;
        linkImage.src = "http://www.ritterburgwelt.de/rb/bild/buttons/b_"
        + pages[page].pic + ".gif";
        var linkImages = new Array();
        linkImages.push(linkImage);
        var linkForm = createFormLink("thronsaal", page, linkImages, target);

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
function appendMainLinkBoth(page)                           // {{{1
{
    appendMainLink(1, page, "");
    appendMainLink(2, page, "_blank");
}                                                       // }}}1
// Hauptlinkleisten     {{{1
if (game[gameId] && game[gameId].links) {
    var links = game[gameId].links;
} else {
    var links = game["standard"].links;
}
for (var i = 0; i < links.length; i++) {
    appendMainLinkBoth(links[i]);
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
    function farbTage(parentTag, tage, farbe)   // {{{2
    {
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
        if (armeeZeilen[i].childNodes[1]) {
            var armeeForm = armeeZeilen[i].childNodes[1].firstChild;
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
        var linkImages = new Array();
        for (var i = 1; i <= GM_getValue(gameId+".armeen"); i++) {
            linkImage = document.createElement('input');
            linkImage.type = "image";
            linkImage.name = "armee[" + GM_getValue(gameId+".armee"+i) + "]";
            linkImage.title = GM_getValue(gameId+".armee"+i);
            linkImage.src = "http://www.ritterburgwelt.de/rb/held/"
                + GM_getValue(gameId+".armee"+i+".src") + ".gif";
            linkImages.push(linkImage);
        }
        if (listNumber == 4) {
            linkForm = createFormLink("armee", "rbarmee", linkImages, "_blank");
        } else {
            linkForm = createFormLink("armee", "rbarmee", linkImages, "");
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
newLink.href = "http://kraehen.org/show/karten";
newLink.target = "_blank";
newLink.appendChild(kskKarte);
document.getElementById('Leiste4').appendChild(newLink);
createSeparation(4); createSeparation(4);
//                              }}}1
// Dorflinks                    {{{1
if (GM_getValue(gameId+".doerfer", 0)) {
    for (var listNumber = 3; listNumber <= 4; listNumber++) { 
        var linkImages = new Array();
        for (var i = 1; i <= GM_getValue(gameId+".doerfer"); i ++) {
            linkImage = document.createElement('input');
            linkImage.type = "image";
            linkImage.name = "mfeld[" + GM_getValue(gameId+".dorf"+i) + "]";
            linkImage.title = GM_getValue(gameId+".dorf"+i);
            linkImage.src = "http://www.ritterburgwelt.de/rb/"
                + "bild/buttons/b_map.gif";
            linkImages.push(linkImage);
        }
        if (listNumber == 4) {
            linkForm = createFormLink("dorf", "rbkarte", linkImages, "_blank");
        } else {
            linkForm = createFormLink("dorf", "rbkarte", linkImages, "");
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
        var linkImages = new Array();
        var linkImage = document.createElement('input');
        linkImage.type = "image";
        linkImage.name = "Handelsring"; linkImage.title="Handelsring";
        linkImage.src = "http://www.ritterburgwelt.de/rb/"
            + "bild/buttons/b_chronik.gif";
        linkImages.push(linkImage);
        if (listNumber == 4) {
            linkForm = createFormLink("dorf", "3", linkImages, "_blank");
        } else {
            linkForm = createFormLink("dorf", "3", linkImages, "");
        }
        var newInput = document.createElement('input');
        newInput.type = "hidden";
        newInput.name = "modul"; newInput.value = "handel";
        linkForm.appendChild(newInput);
        newInput = document.createElement('input');
        newInput.type = "hidden"; newInput.name = "mfeld";
        newInput.value = GM_getValue(gameId+".hb.mfeld");
        linkForm.appendChild(newInput);
        newInput = document.createElement('input');
        newInput.type = "hidden"; newInput.name = "feld";
        newInput.value = GM_getValue(gameId+".hb.feld");
        linkForm.appendChild(newInput);
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
            var linkImages = new Array();
            var linkImage = document.createElement('input');
            linkImage.type = "image";
            linkImage.name = "Angebot";
            if (i == 0) { 
                linkImage.title="EB";
            } else {
                linkImage.title="AB";
            }
            linkImage.src = "http://www.ritterburgwelt.de/rb/"
                + "bild/buttons/b_handel.gif";
            linkImages.push(linkImage);
            if (listNumber == 4) {
                linkForm = createFormLink("dorf", "31", linkImages, "_blank");
            } else {
                linkForm = createFormLink("dorf", "31", linkImages, "");
            }
            var newInput = document.createElement('input');
            newInput.type = "hidden";
            newInput.name = "modul"; newInput.value = "handel";
            linkForm.appendChild(newInput);
            newInput = document.createElement('input');
            newInput.type = "hidden"; newInput.name = "mfeld2";
            newInput.value = game["standard"].hb[i].mfeld;
            linkForm.appendChild(newInput);
            newInput = document.createElement('input');
            newInput.type = "hidden";
            newInput.name = "mfeld"; newInput.value = mfeld;
            linkForm.appendChild(newInput);
            newInput = document.createElement('input');
            newInput.type = "hidden";
            newInput.name = "feld"; newInput.value = feld;
            linkForm.appendChild(newInput);
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
document.getElementsByTagName('body')[0].appendChild(newDiv);
var response = document.createElement('div');
response.id = "ServerAntwort";
response.style.fontFamily = "monospace";
response.style.whiteSpace = "pre";
response.style.backgroundColor = "black";
response.style.color = "green";
response.style.width = "auto";
response.style.maxWidth = "600px";
newDiv.appendChild(response);

function sendToScanner()        // {{{2
{
    var handler = "kskscanner";
    var type = "text/html";
    var data = wholePage;
    function responseFunction(text) {
        document.getElementById("ServerAntwort").innerHTML = text;
    }
    sendDataWrapper(handler, type, data, responseFunction);
}                               // }}}2

function saveToServer()        // {{{2
{
    var handler = "save?" + gamePage;
    var type = "text/html";
    var data = wholePage;
    function responseFunction(text) {
        document.getElementById("ServerAntwort").innerHTML = text;
    }
    sendDataWrapper(handler, type, data, responseFunction);
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

function createOutputArea(id)   //      {{{1
{
    var newDiv = document.createElement('div');
    newDiv.align = "center";
    document.getElementsByTagName('body')[0].appendChild(newDiv);
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

function sendToHandler(handler, fieldName, content, answer)      // {{{1
{
    var type = "application/x-www-form-urlencoded";
    var data = a+pid+fieldName+'='+encodeURIComponent(content);
    function responseFunction(text) {
        document.getElementById(answer).innerHTML = text;
    }
    sendDataWrapper(handler, type, data, responseFunction);
}                                                               // }}}1

createOutputArea("DBAntwort");
createOutputArea("ServerZusammenfassung");
createOutputArea("Fehlermeldungen");

function printError(message, e)                 // {{{1
{
    printWarning(message + e);
    if (DEBUG) {
        // Erzwinge Abbruch, aber auch Details in der Konsole
        printWarning("Details in der Fehlerkonsole");
        throw e;
    }
}                                               // }}}1
function printWarning(message)                    // {{{1
{
    var output = document.getElementById("Fehlermeldungen");
    output.appendChild(document.createTextNode(message));
    output.appendChild(document.createElement("br"));
}                                               // }}}1
// zu sendendes xml-Dokument vorbereiten                        // {{{1
var xmlDataDoc = document.implementation.createDocument("", "", null);
// root-Element
var dataElem = xmlDataDoc.createElement("data");

var augeElem = xmlDataDoc.createElement("auge");
var senderElem = xmlDataDoc.createElement("sender");
senderElem.setAttribute("r_id",gameId.substr(7));
augeElem.appendChild(senderElem);
var clientElem = xmlDataDoc.createElement("client");
clientElem.setAttribute("name",clientName);
clientElem.setAttribute("version",clientVersion);
augeElem.appendChild(clientElem);
var sichtElem = xmlDataDoc.createElement("sicht");
if(gamePage == "rbfturm1" || gamePage == "rbfturm2"
    || gamePage == "rbfturma" || gamePage == "rbfturms") {
    sichtElem.setAttribute("typ","turm");
} else if (gamePage == "rbarmee"
            && wholePage.indexOf("aus dem Dorf rausgehen") == -1
            && wholePage.indexOf("fliehen") == -1) {
    sichtElem.setAttribute("typ","armee");
} else {
    sichtElem.setAttribute("typ","keine");
}
augeElem.appendChild(sichtElem);
dataElem.appendChild(augeElem);

var dataGathered = false;

// hier kommen die gefundenen Spieldaten rein
var rbElem = xmlDataDoc.createElement("rb");                    // }}}1
function addDataSection(sectionElem)                            // {{{1
{
    rbElem.appendChild(sectionElem);
}                                                               // }}}1
function fillDataSection(section, content)                      // {{{1
{
    var elem = xmlDataDoc.createElement(section);
    elem.appendChild(xmlDataDoc.createTextNode(content));
    rbElem.appendChild(elem);
}                                                               // }}}1
function sendXMLData(handler, doc, answer)                      // {{{1
{
    if (dataGathered) {
        // fertiges rb-Element einhaengen
        dataElem.appendChild(rbElem);
        xmlDataDoc.appendChild(dataElem);
        var serializer = new XMLSerializer();
        if (typeof opera != "undefined") {
            var data =serializer.serializeToString(doc);
        } else {
            var data = XML(serializer.serializeToString(doc)).toXMLString();
        }
        function responseFunction(text) {
            document.getElementById(answer).innerHTML = text;
        }
        function responseFunction2(text) {
            document.getElementById("Fehlermeldungen").innerHTML = text;
        }
        sendDataWrapper(handler, "text/xml", data, responseFunction)
        //sendDataWrapper("save?xml", "text/xml", data, responseFunction2)
    } else {
        printWarning("Es wurden keine Armee- oder Terraindaten gefunden");
    }
}                                                               // }}}1

// Sende sichtbaren Text an den Server {{{1

function visibleText(htmlPage)                                  // {{{2
{
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
    // \xA0 ist die Entitaet fuer &nbsp; bei Opera
    copyText = copyText.replace(/\xA0/gi, " ");
    copyText = copyText.replace(/&nbsp;/gi, " ");
    return copyText;
}                                               // }}}2

copyText = visibleText(wholePage);

if (gamePage == "rbarmee") {

    if (wholePage.indexOf("fliehen") == -1) {
        sendToHandler("send/text/armee", "dorftext", copyText, "DBAntwort");
    }
}

if (gamePage == "rbfturm1"
    || gamePage == "rbfturm2"
    || gamePage == "rbfturma"
    || gamePage == "rbfturms"
    || gamePage == "rbfhandelb") {

    sendToHandler("send/text/turm", "text", copyText, "DBAntwort");
}

// datenpflegeseite kann momentan nicht von allen benutzt werden
if (gameId == 'rbspiel1728') {
    if (gamePage == 'rbftop10') {

        sendToHandler("send/text/top10", "wahl=top10&textbereich",
                copyText, "DBAntwort");
    }

    if (gamePage == 'rbally2') {

        sendToHandler("send/text/allianz", "wahl=alli&textbereich",
                copyText, "DBAntwort");
    }
}
//                                      }}}1

// Landschaftserfassung         {{{1
try {
var felderElem = xmlDataDoc.createElement("felder");
function addTerrain(floor, x, y, terrain, name)         // {{{2
{
    var feldElem = xmlDataDoc.createElement("feld");
    feldElem.setAttribute("level", floor);
    feldElem.setAttribute("x", x); feldElem.setAttribute("y", y);
    var terrainElem = xmlDataDoc.createElement("terrain");
    terrainElem.appendChild(xmlDataDoc.createTextNode(terrain));
    feldElem.appendChild(terrainElem);
    if (typeof name != "undefined") {
        var nameElem = xmlDataDoc.createElement("feldname");
        nameElem.appendChild(xmlDataDoc.createTextNode(name));
        feldElem.appendChild(nameElem);
    }
    felderElem.appendChild(feldElem);
    dataGathered = true;
}                                                       // }}}2
function listTerrain(terrain, floor, x, y, width, center)   //      {{{2
{
    if (!center) {
        // Zentrum aus linker oberer Ecke berechnen
        var xval = x + Math.floor(width/2);
        var yval = y + Math.floor(width/2);
    } else {
        // das Zentrum wurde gegeben
        var xval = x;
        var yval = y;
    }
    for (var i=0; i < terrain.length; i++) {
        x = xval + (i % width ) - Math.floor(width / 2);
        if (width == 3) {
            if (i < 3)             { y = yval - 1; }
            else if (i < 6)        { y = yval;     }
            else                   { y = yval + 1; };
        } else {    // width == 5, Weitsichtturm, Entdecker ?
            if (i < 5)             { y = yval - 2; }
            else if (i < 10)       { y = yval - 1; }
            else if (i < 15)       { y = yval;     }
            else if (i < 20)       { y = yval + 1; }
            else                   { y = yval + 2; };
        }
        if (!center || x != xval || y != yval) {
            // Das Zentrum braucht nicht doppelt uebertragen werden
            // wenn es schon vorher bekannt war
            // (Wurde schon zusammen mit dem Namen und Untertyp gesendet)
            addTerrain(floor, x, y, terrain[i]);
        }

    }
}                                                               //      }}}2

// Erfassung in der Armee               {{{2
if (gamePage == "rbarmee") {
    // Kartenmittelpunkt suchen
    // = erstes Auftreten eines Kartenbildes im Code
    var imgEntries = document.getElementsByTagName("img");
    i = 0;
    while (i < imgEntries.length
            && imgEntries[i].src.indexOf('/bild/karte/') == -1) { i++; }
    if (i == imgEntries.length) {
        printWarning("Kartenmitte konnte nicht ermittelt werden.");
    } else {
        // Koordinaten des Mittelpunkts
        var tdNode = imgEntries[i].parentNode.nextSibling;
        text = tdNode.childNodes[1].firstChild.nodeValue;
        var expr = /(Q|U[0-9])?,? ?([0-9]*),([0-9]*)/;
        fields = expr.exec(text);
        var floor = fields[1];
        var x = parseInt(fields[2], 10);
        var y = parseInt(fields[3], 10);
        if (fields[1] == undefined || fields[1] == "Q") {
            var floor = "N";
        }
        if (fields[1] != "Q") {
            var terrain = imgEntries[i].src.replace(/.*\/([^\/]*)\.gif/, '$1');
            var name = tdNode.firstChild.nodeValue.replace(/(.*) :/, '$1');
            addTerrain(floor, x, y, terrain, name);


            // Kartenausschnitt finden
            // gekennzeichnet durch "<td width=20>&nbpsp;></td><td valign=top>"
            // valign=top ist leider Standard, Suche nach width=20
            var tdEntries = document.getElementsByTagName("td");
            var i=0;
            while (i < tdEntries.length && tdEntries[i].width != 20) { i++; }
            if (i == tdEntries.length) {
                printWarning("Kartenausschnitt nicht gefunden.");
            } else {
                i++; // Wir suchen die darauffolgende Zelle
                var imgEntries = tdEntries[i].getElementsByTagName("img");
                terrain = new Array();
                for (var i=0; i < imgEntries.length; i++) {
                    if (imgEntries[i].src.indexOf("buttons") == -1) {
                        // Alles was kein Button ist, ist hier ein Feld
                        var num = imgEntries[i].src
                            .replace(/.*\/([^\/]*)\.gif/,'$1');
                        terrain.push(num);
                    }
                }
                var width = Math.sqrt(terrain.length);
                // x, y sind schon gesendete Zentrumskoordinaten -> true
                listTerrain(terrain, floor, x, y, width, true);

                addDataSection(felderElem);
            }
        }
    }

}                                                       //      }}}2

// Erfassung im Turm                    {{{2
if (gamePage == "rbfturm1"
        || gamePage == "rbfturm2"
        || gamePage == "rbfturma"
        || gamePage == "rbfturms") {
    // Karte suchen
    // = erstes Auftreten eines Kartenbildes im Code
    var imgEntries = document.getElementsByTagName("img");
    i = 0;
    while (i < imgEntries.length
            && imgEntries[i].src.indexOf('/bild/karte/') == -1) { i++; }
    if (i == imgEntries.length) {
        printWarning("Karte konnte nicht gefunden werden.");
    } else {
        var tableNode = imgEntries[i].parentNode.parentNode.parentNode;

        // Terrain auslesen
        var imgEntries = tableNode.getElementsByTagName("img");
        terrain = new Array();
        for (var i=0; i < imgEntries.length; i++) {
            if (imgEntries[i].src.indexOf("buttons") == -1) {
                // Alles was kein Button ist, ist hier ein Feld
                var num = imgEntries[i].src.replace(/.*\/([^\/]*)\.gif/,'$1');
                terrain.push(num);
            }
        }

        // sichtbare Koordinaten auslesen
        coordList = new Array();
        for (var j=0; j < tableNode.childNodes.length; j++) {
            var trNode = tableNode.childNodes[j];
            var currNode = trNode.firstChild;
            for (var i=0; i < trNode.childNodes.length; i++) {
                var currNode = trNode.childNodes[i];
                // nodeType == 3 -> text node
                if (currNode.firstChild.nodeType == "3"
                        && currNode.innerHTML != "&nbsp;&nbsp;"
                        && currNode.innerHTML != "&nbsp;") {
                    var text = currNode.firstChild.nodeValue;
                    var expr = /([0-9]*),([0-9]*)/;
                    coords = expr.exec(text);
                    coordList.push(coords);
                }
            }
        }
        for (var i=0; i < coordList.length; i++) {
            var x = parseInt(coordList[i][1], 10);
            var y = parseInt(coordList[i][2], 10);
            addTerrain("N", x, y, terrain[i]);
        }

        addDataSection(felderElem);
    }
}                                                       //      }}}2

} catch (e) {
    printError("Fehler in der Landschaftserfassung: ", e);
}
// }}}1

// Armeesortierung und Aktualisierung   {{{1
try {
function isShip(imgEntry)    // {{{2
{
    var pattern = new RegExp("http://www.ritterburgwelt.de/rb/bild/icons/bew4.gif","");
    if (imgEntry.src == "http://www.ritterburgwelt.de/rb/bild/icons/bew4.gif") {
        return true;
    } else {
        return false;
    }
}                                       // }}}2
function isOwn(imgEntry)    // {{{2
// Ist keine eigene Armee, Dorf oder Aussenposten
{
    var box = imgEntry.parentNode.parentNode;
    if (box.innerHTML.indexOf("Menschentransfer")	!= -1) {
        return true;
    } else {
        return false;
    }
}                                       // }}}2
function isArmee(imgEntry)    // {{{2
// Ist kein Dorf oder Aussenposten
{
    var box = imgEntry.parentNode.parentNode;
    if (box.innerHTML.indexOf("Dorf")		        != -1
        || box.innerHTML.indexOf("Aussenposten")	!= -1
       ) {
        return false;
    } else {
        return true;
    }
}                                       // }}}2
function isArmeeHandle(imgEntry)        // {{{2
// Das Heldenbild der Armee, womit die Armee eindeutig ist
{
    var pattern = new RegExp("http://www.ritterburgwelt.de/rb/held/"
            + "(h[^/.]+|[0-9]+)","");
    var match = pattern.exec(imgEntry.src);
    if (isArmee(imgEntry)  && match) {
        return match;
    } else {
        return false;
    }
}                                       // }}}2
function isAllyArmee(imgEntry, allies)    // {{{2
// Das Allianztag einer der Allianzen in allies
{
    var pattern = new RegExp("http://www.ritterburgwelt.de/rb/held//allym"+
        allies+".gif","");
    if (!isArmee(imgEntry) || isOwn(imgEntry)) {
        return false;
    } else {
        return pattern.exec(imgEntry.src);
    }
}                                       // }}}2

if( gamePage == "rbarmee" 
    || gamePage == "rbfturm1"
    || gamePage == "rbfturm2"
    || gamePage == "rbfturma"
    || gamePage == "rbfturms"
) {
    var imgEntries = document.getElementsByTagName("img");
    var bundListe = new Array();
    var feindListe = new Array();
    var lastAction = 0;

    // Armeen identifizieren    {{{2
    for( var i = 0; i < imgEntries.length; i++ ) {
        if (isAllyArmee(imgEntries[i], friendlyAllies)) {
            // Verbuendete Armee
            bundListe.push(imgEntries[i].parentNode.parentNode);
            lastAction = "bund";
        } else {
            if(isAllyArmee(imgEntries[i], hostileAllies)) {
                // Feindliche Armee
                feindListe.push(
                        imgEntries[i].parentNode.parentNode);
                lastAction = "feind";
                feind = true;
            } else if (isShip(imgEntries[i])) {
                if (lastAction == "bund") {
                    bundListe.push(imgEntries[i].parentNode.parentNode);
                } else if (lastAction == "feind") {
                    feindListe.push(imgEntries[i].parentNode.parentNode);
                }
            } else {
                lastAction == "none";
            }
        }
    }
    //                          }}}2

    // Armeeaktualisierung      {{{2
    var armeeData = ""
    var armeenElem = xmlDataDoc.createElement("armeen");
    function addArmee(pos, id, img, name, owner, size, strength,        // {{{3
            ruf, bp, maxBP, ap, maxAP)
    {
        var armeeElem = xmlDataDoc.createElement("armee");
        if (id !== null) {
            armeeElem.setAttribute("h_id", id);
        }
        var posElem = xmlDataDoc.createElement("position");
        var expr = /(N|Q|U[0-9])?,? ?([0-9]+),([0-9]+)/;
        fields = expr.exec(pos);
        if (typeof fields[1] == "undefined") {
            level = "N";
        } else {
            level = fields[1];
        }
        if (level != "Q") {
            posElem.setAttribute("level", level);
            posElem.setAttribute("x", fields[2]);
            posElem.setAttribute("y", fields[3]);
            armeeElem.appendChild(posElem);
            var bildElem = xmlDataDoc.createElement("bild");
            bildElem.appendChild(xmlDataDoc.createTextNode(img));
            armeeElem.appendChild(bildElem);
            var nameElem = xmlDataDoc.createElement("held");
            nameElem.appendChild(xmlDataDoc.createTextNode(name));
            armeeElem.appendChild(nameElem);
            var ritterElem = xmlDataDoc.createElement("ritter");
            if (owner === null) {
                ritterElem.setAttribute("r_id", gameId.substr(7));
            } else {
                ritterElem.appendChild(xmlDataDoc.createTextNode(owner));
            }
            armeeElem.appendChild(ritterElem);
            if (typeof size != "undefined") {
                var sizeElem = xmlDataDoc.createElement("size");
                sizeElem.setAttribute("now", size);
                if (typeof ruf != "undefined") {
                    sizeElem.setAttribute("max", ruf);
                }
                armeeElem.appendChild(sizeElem);
            }
            if (typeof strength != "undefined") {
                var strengthElem = xmlDataDoc.createElement("strength");
                strengthElem.setAttribute("now", strength);
                armeeElem.appendChild(strengthElem);
            }
            if (typeof bp != "undefined") {
                var bpElem = xmlDataDoc.createElement("bp");
                bpElem.setAttribute("now", bp);
                if (typeof maxBP != "undefined") {
                    bpElem.setAttribute("max", maxBP);
                }
                armeeElem.appendChild(bpElem);
            }
            if (typeof ap != "undefined") {
                var apElem = xmlDataDoc.createElement("ap");
                apElem.setAttribute("now", ap);
                if (typeof maxAP != "undefined") {
                    apElem.setAttribute("max", maxAP);
                }
                armeeElem.appendChild(apElem);
            }
            armeenElem.appendChild(armeeElem);
            dataGathered = true;
        }
    }                                                           // }}}3

    // eigene Armeen in Armeesicht (Bilder als input-img name=Armee)    {{{3
    var inputs = document.getElementsByTagName("input");
    for( var i = 0; i < inputs.length; i++ ) {
        if (inputs[i].type == "image" && inputs[i].name == "Armee") {
            var match = isArmeeHandle(inputs[i]);
            if (!match) { break; }
            var form = inputs[i].parentNode.parentNode
                .parentNode.parentNode.parentNode;
            var id = form.childNodes[3].value;
            var outerTD = form.parentNode;
            var name = outerTD.previousSibling.childNodes[0].firstChild.data;
            if (name != "Held:") {
                // gesichtetete Armee
                var pos = currentPos; // von aktueller Armee
                var size = outerTD.previousSibling.childNodes[2]
                    .data.split(" ")[1];
                var strength = outerTD.previousSibling.childNodes[4]
                    .data.split(" ")[1];
                var owner = outerTD.nextSibling.childNodes[1].firstChild.data;

                addArmee(pos, id, match[1], name, owner, size, strength);
            } else {
                // laufende/aktuelle Armee
                var name = outerTD.nextSibling.firstChild.data;
                var statTD = outerTD.nextSibling.nextSibling.nextSibling;
                var bp = statTD.childNodes[2].firstChild.data.split(" ")[0];
                var maxBP = bp.split("/")[1];
                var bp = bp.split("/")[0];
                var ap = statTD.childNodes[4].data.split(" ")[0];
                var maxAP = ap.split("/")[1];
                var ap = ap.split("/")[0];
                var bewImg = form.nextSibling.src;
                if (bewImg.indexOf("bew4.gif") == -1) {
                    // laufender Held
                    var unitTD = outerTD.parentNode.nextSibling.childNodes[2];
                    var terrainTR = outerTD.parentNode.nextSibling.nextSibling;
                } else {
                    // Schiff
                    var unitTD = outerTD.parentNode.nextSibling
                        .nextSibling.nextSibling.childNodes[2];
                    var terrainTR = outerTD.parentNode.nextSibling.nextSibling
                        .nextSibling.nextSibling;
                }
                var soldaten = unitTD.firstChild.data.split(" ")[0];
                var siedler = unitTD.firstChild.data.split(" ")[3];
                var size = parseInt(soldaten, 10) + parseInt(siedler, 10);
                var ruf = unitTD.firstChild.data.split(" ")[6];
                var strength = unitTD.childNodes[2].data.split(" ")[1];
                var pos = terrainTR.childNodes[2].childNodes[1].firstChild.data;
                // aktuelle Position, wird spaeter von anderen genutzt !!!
                var currentPos = pos;
                var owner = null;

                addArmee(pos, id, match[1], name, owner,
                        size, strength, ruf, bp, maxBP, ap, maxAP);
            }
        }
    }                                                           //      }}}3

    // eigene Armeen in Turmsicht (Bilder input-img name=ok)   {{{3
    var inputs = document.getElementsByTagName("input");
    for( var i = 0; i < inputs.length; i++ ) {
        if (inputs[i].type == "image" && inputs[i].name == "ok") {
            var match = isArmeeHandle(inputs[i]);
            if (!match) { break; }
            var form = inputs[i].parentNode.parentNode
                .parentNode.parentNode.parentNode;
            var id = form.childNodes[4].value;
            var outerTD = form.parentNode;
            var name = outerTD.previousSibling.firstChild.data;
            var pos = outerTD.previousSibling.previousSibling
                    .firstChild.data;
            var owner = outerTD.nextSibling.childNodes[2].firstChild.data;

            addArmee(pos, id, match[1], name, owner);
        }
    }                                                   // }}}3

    // fremde Armeen (normale img)              {{{3
    var imgEntries = document.getElementsByTagName("img");
    for( var i = 0; i < imgEntries.length; i++ ) {
        var match = isArmeeHandle(imgEntries[i]);
        if (match) {
            var img = match[1];
            if (gamePage == "rbarmee") {
                // Position aus der Landschaftsaktualisierung
                var pos = currentPos; // von aktueller Armee
                var outerTD = imgEntries[i].parentNode.parentNode
                    .parentNode.parentNode.parentNode;
                var name = outerTD.previousSibling.firstChild.firstChild.data;
                var size = outerTD.previousSibling.childNodes[2].data;
                size = size.split(" ")[1];
                var strength = outerTD.previousSibling.childNodes[4].data;
                strength = strength.split(" ")[1];
                var owner = outerTD.nextSibling.childNodes[1].firstChild.data;
                var secondForm = outerTD.nextSibling.nextSibling.firstChild;
                // ID nur wenn angreifbar hier per Form (kein Schutz)
                if (secondForm.getElementsByTagName) {
                    var inputs = secondForm.getElementsByTagName("input");
                    for (var j = 0; j < inputs.length; j++) {
                        if (inputs[j].name == "armee2") {
                            var id = inputs[j].value;
                            break;
                        }
                    }
                } else {
                    var id = null;      // keine ID zu bekommen
                }

                addArmee(pos, id, img, name, owner, size, strength);
            } else {
                // in einer Turmsicht
                var outerTD = imgEntries[i].parentNode.parentNode
                    .parentNode.parentNode.parentNode;
                var pos = outerTD.previousSibling.previousSibling
                    .firstChild.data;
                var name = outerTD.previousSibling.firstChild.data;
                var id = outerTD.nextSibling.childNodes[0].value;
                var owner = outerTD.nextSibling.childNodes[2].firstChild.data;

               addArmee(pos, id, img, name, owner);
            }
        }
    }                                           // }}}3

    addDataSection(armeenElem);

    // Ende Armeeaktualisierung }}}2

    // Armeesortierung          {{{2
    // feindliche Armeen an den Anfang  {{{3
    for( var i = feindListe.length -1; i > -1; i-- ) {
        var parentNode = feindListe[i].parentNode;
        parentNode.removeChild(feindListe[i]);
        parentNode.insertBefore(feindListe[i], parentNode.firstChild);
    }
    //                                  }}}3
    // verbuendete Armeen ganz ans Ende {{{3
    for( var i = 0; i < bundListe.length; i++ ) {
        var parentNode = bundListe[i].parentNode;
        parentNode.removeChild(bundListe[i]);
        parentNode.appendChild(bundListe[i]);
    }
    //                                  }}}3
    // Zusammenfassung          {{{3
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
    //                          }}}3
    // Ende Armeesortierung     }}}2

} // ende Armeebearbeitung
} catch (e) {
    printError("Fehler in der Armeeerfassung: ", e);
}
//                              }}}1

if (gamePage == "rbarmee"
        || gamePage == "rbfturm1"
        || gamePage == "rbfturm2"
        || gamePage == "rbfturma"
        || gamePage == "rbfturms") {
    sendXMLData("send/data", xmlDataDoc, "ServerZusammenfassung")
}

// Ressourcenauswertung         {{{1
try {
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
    function zellenInfo(info, tage, zelle)  
    {
        if (zelle.childNodes >= 0) {
            zelle.appendChild(document.createElement("br"));
        }
        var divTag = document.createElement("div");
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
} catch (e) {
    printWarning("Fehler in der Ressourcenauswertung: " + e);
}
//                              }}}1

// Zugauswertung                {{{1
try {
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
    newTD = document.createElement("td");
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
            var newTD = document.createElement("td");
            newTD.appendChild(document.createTextNode(restZuege));
            if (restZuege <= zuegeGelb) newTD.style.backgroundColor = "yellow";
            if (restZuege <= zuegeRot) newTD.style.backgroundColor = "red";
            gueterZeilen[gut].appendChild(newTD);
        } else {
            var infinite = document.createTextNode(String.fromCharCode(8734));
            var newTD = document.createElement("td");
            newTD.appendChild(infinite);
            gueterZeilen[gut].appendChild(newTD);
        }
    }
    //                          }}}2
} // Ende Zugauswertung
} catch (e) {
    printWarning("Fehler in der Zugauswertung: " + e);
}
//                              }}}1

// debugausgabe {{{1
if (debugOut != "") {
    gameInfo.appendChild(document.createTextNode(debugOut));
}       //      }}}1

}

// Reichs-IDs vom Server                                {{{1
if (document.location == "http://www.ritterburgwelt.de/rb/ajax_backend.php") {
    responses = document.getElementsByTagName("response");
    if (responses.length > 0) {
        var doc = responses[0];
        var serializer = new XMLSerializer();
        if (typeof opera != "undefined") {
            var xml =serializer.serializeToString(doc);
        } else {
            var xml = XML(serializer.serializeToString(doc)).toXMLString();
        }
        var type = "application/x-www-form-urlencoded";
        var data = a+pid+'source='+encodeURIComponent(xml);
        function responseFunction(text) {
            if (text.length > 1) { alert(text); }
        }
        sendDataWrapper("send/response", "text/xml", xml, responseFunction)
    }
}                                               //      }}}1

/* vim:set shiftwidth=4 expandtab smarttab foldmethod=marker: */

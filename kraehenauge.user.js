// ==UserScript==       {{{1
// @name           Kraehenauge
// @namespace      http://kraehen.org
// @description    Dies ist das clientseitige KSK-Programm. Es unterstuetzt die Kraehen auf ihren Wegen in Alirion und gibt ihnen Ueberblick und schnelle Reaktionsmoeglichkeiten.
// @include        http://www.ritterburgwelt.de/rb/rbstart.php
// @include        http://www.ritterburgwelt.de/rb/ajax_backend.php
// @include        file://*/rbstart.php.html
// @include        file://*/ajax_backend.php
// @author         JonnyJD
// @version        1.4.3
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
var clientVersion = '1.4.3 [trunk]';
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
var hostileAllies  = "(32)";

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
function getPageName()
{
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
    gamePage = 'rbnachr1'; // rbnachr2 faellt hier auch drunter
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
else if (pageTitle.indexOf('Armee - Spionage') == 0)
    gamePage = 'rbspiona1';
else if (pageTitle.indexOf('Armee - Siedlertransport') == 0)
    gamePage = 'rbmtransport2';
else if (pageTitle.indexOf('Armeekampf ') == 0)
    gamePage = 'rbarmeewar';
else if (pageTitle.search(/Armee von (.*), Infos/) == 0)
    gamePage = 'rbarmeei';
else if (pageTitle.search(/Armee von (.*), Ausr\xFCsten/) == 0)
    gamePage = 'rbarmeeruest';
else if (pageTitle.search(/Armee von (.*), Tr\xE4nke einnehmen/) == 0)
    gamePage = 'rbarmeetrank';
else if (pageTitle.indexOf('G\xFCtertransfer zwischen Armeen') == 0)
    gamePage = 'rbarmeegtr2';
else if (pageTitle.indexOf('Menschentransfer zwischen Armeen') == 0)
    gamePage = 'rbarmeemtr2';
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
else if (pageTitle.indexOf('Dorf ') == 0)
    gamePage = 'rbkarte';
else if (pageTitle.indexOf('Ressourcen im Dorf ') == 0)
    gamePage = 'rbrinfo';
else if (pageTitle.search('Taverne im Dorf (.*), Söldner-Helden anheuern') == 0)
    gamePage = 'rbtavernesold'; // kein offizieller Name
else if (pageTitle.indexOf('Allianz ') == 0)
    gamePage = 'rbally2';
//                      }}}2
    return gamePage
}
gamePage = getPageName();
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
newTD.style.textAlign = "center"; newTD.style.verticalAlign = "top";
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
        
    }                                           // }}}2
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
if(gamePage == "rbfhandelb") {
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
kskKarte.title = "Kr\xE4hendatenbank"
kskKarte.src = "http://www.ritterburgwelt.de/rb/held/allym60.gif";
kskKarte.style.border = "1px solid red";
var newLink = document.createElement('a');
newLink.href = "http://kraehen.org/show";
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
    // umgehe FF Mac http auth Problem
    if (navigator.platform.indexOf("Mac") != 0
            || navigator.appName != "Netscape") {
        sendDataWrapper(handler, type, data, responseFunction);
    }
}                               // }}}2

function saveToServer()        // {{{2
{
    var handler = "save?" + gamePage;
    var type = "text/html";
    var data = wholePage;
    function responseFunction(text) {
        document.getElementById("ServerAntwort").innerHTML = text;
    }
    // umgehe FF Mac http auth Problem
    if (navigator.platform.indexOf("Mac") != 0
            || navigator.appName != "Netscape") {
        sendDataWrapper(handler, type, data, responseFunction);
    }
}                               // }}}2

if (gamePage == "rbftop10"
        || gamePage == "rbtop10q"
        || gamePage == "rbfhandel1"
        || gamePage == "rbrinfo"
        || gamePage == "rbrinfo0") {

    /* rbfhandel1 hat eine Unterseite zum hinzufuegen von Warentypen
     * diese soll nicht geschickt werden, weil der kskscanner
     * diese falsch parst und die preisdatei korrumpiert
     */
    var mark_all = false;
    var inputs = document.getElementsByTagName("input");
    for( var i = 0; i < inputs.length; i++ ) {
        if (inputs[i].type == "checkbox" && inputs[i].name == "mark_all") {
            mark_all = true;
            break;
        }
    }
    if (!mark_all) {
        sendToScanner();
    }
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
} else if (gamePage == "rbftop10") {
    sichtElem.setAttribute("typ","top10");
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
        printWarning("Es wurden keine zu sendenden Daten gefunden");
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
        var expr = /(Q)?(U[0-9])?,? ?([0-9]*),([0-9]*)/;
        fields = expr.exec(text);
        var floor = fields[2];
        var x = parseInt(fields[3], 10); var y = parseInt(fields[4], 10);
        if (floor == undefined) { var floor = "N"; }
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
        var terrainPos = 0;
        for (var i=0; i < coordList.length; i++) {
            if (coordList[i] !== null) {
                var x = parseInt(coordList[i][1], 10);
                var y = parseInt(coordList[i][2], 10);
                addTerrain("N", x, y, terrain[terrainPos]);
                terrainPos++;
            }
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
            + "(h[^/.]+|[0-9]+|e_[^/.]+|transport[^/.]*)","");
    var match = pattern.exec(imgEntry.src);
    if (match && isArmee(imgEntry)) {
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
    match = pattern.exec(imgEntry.src);
    var box = imgEntry.parentNode.parentNode;
    if (match && isArmee(imgEntry) && !isOwn(imgEntry)
            && box.innerHTML.indexOf("Held:")   == -1
            && box.innerHTML.indexOf("Bei:")    == -1
       ) {
        // den laufenden Held, den Transporterkapitaen, Eigene
        // und natuerlich Nicht-Armeen nicht verschieben
        // Ausnahme fuer Schiffe kommt spaeter
        return match;
    }
}                                       // }}}2
function getShip(imgEntry)            // {{{2
{
    var thisTable = imgEntry.parentNode.parentNode.parentNode.parentNode;
    var nextTR = thisTable.parentNode.parentNode.nextSibling;
    if (nextTR && nextTR.firstChild.nextSibling
            && nextTR.firstChild.nextSibling.childNodes.length > 2
            && isShip(nextTR.firstChild.nextSibling.childNodes[2]) ) {
        schiff = new Object();
        schiff.name = nextTR.firstChild.firstChild.firstChild.data;
        schiff.typ =  nextTR.firstChild.childNodes[2].data
            .replace(/\((.*)\)/,"$1");
        schiff.img = nextTR.firstChild.nextSibling.firstChild.src
            .replace(/.*\/(.*).gif/,"$1");
        return schiff;
    } else {
        return null;
    }
}                                       // }}}2

function armeeObjekt(id, img, name) {                   // {{{2
    this.id = id;
    this.img = img;
    this.name = name;
    this.add = addArmee;
}
function addArmee()
{
    var armeeElem = xmlDataDoc.createElement("armee");
    if (this.id !== null) {
        armeeElem.setAttribute("h_id", this.id);
    }
    var posElem = xmlDataDoc.createElement("position");
    if (this.pos !== null) {
        var expr = /(Q)?(N|U[0-9])?,? ?([0-9]+),([0-9]+)/;
        fields = expr.exec(this.pos);
        if (typeof fields[2] == "undefined") {
            level = "N";
        } else {
            level = fields[2];
        }
    } else {
        // spaeter noch Tempel moeglich
        posElem.appendChild(xmlDataDoc.createTextNode("taverne"));
    }
    if (this.pos === null || fields[1] != "Q") {
        if (this.pos != null) {
            posElem.setAttribute("level", level);
            posElem.setAttribute("x", fields[3]);
            posElem.setAttribute("y", fields[4]);
        }
        armeeElem.appendChild(posElem);
        var bildElem = xmlDataDoc.createElement("bild");
        bildElem.appendChild(xmlDataDoc.createTextNode(this.img));
        armeeElem.appendChild(bildElem);
        var nameElem = xmlDataDoc.createElement("held");
        nameElem.appendChild(xmlDataDoc.createTextNode(this.name));
        armeeElem.appendChild(nameElem);
        if (this.owner) {
            var ritterElem = xmlDataDoc.createElement("ritter");
            if (this.owner == "[self]") {
                ritterElem.setAttribute("r_id", gameId.substr(7));
            } else {
                ritterElem.appendChild(xmlDataDoc.createTextNode(this.owner));
            }
            armeeElem.appendChild(ritterElem);
        }
        if (this.size != "undefined" || typeof this.ruf != "undefined") {
            var sizeElem = xmlDataDoc.createElement("size");
            if (typeof this.size !== "undefined") {
                sizeElem.setAttribute("now", this.size);
            }
            if (typeof this.ruf != "undefined") {
                sizeElem.setAttribute("max", this.ruf);
            }
            armeeElem.appendChild(sizeElem);
        }
        if (typeof this.strength != "undefined" && this.strength !== null) {
            var strengthElem = xmlDataDoc.createElement("strength");
            strengthElem.setAttribute("now", this.strength);
            armeeElem.appendChild(strengthElem);
        }
        if (typeof this.bp != "undefined" || typeof this.maxBP != "undefined") {
            var bpElem = xmlDataDoc.createElement("bp");
            if (typeof this.bp != "undefined") {
                bpElem.setAttribute("now", this.bp);
            }
            if (typeof this.maxBP != "undefined") {
                bpElem.setAttribute("max", this.maxBP);
            }
            armeeElem.appendChild(bpElem);
        }
        if (typeof this.ap != "undefined" || typeof maxAP != "undefined") {
            var apElem = xmlDataDoc.createElement("ap");
            if (typeof this.ap != "undefined") {
                apElem.setAttribute("now", this.ap);
            }
            if (typeof this.maxAP != "undefined") {
                apElem.setAttribute("max", this.maxAP);
            }
            armeeElem.appendChild(apElem);
        }
        if (this.schiff !== null) {
            var schiffElem = xmlDataDoc.createElement("schiff");
            schiffElem.setAttribute("typ", this.schiff.typ);
            armeeElem.appendChild(schiffElem);
        }
        if (typeof this.dauer != "undefined" || typeof this.maxDauer != "undefined") {
            var dauerElem = xmlDataDoc.createElement("dauer");
            if (typeof this.dauer != "undefined") {
                dauerElem.setAttribute("now", this.dauer);
            }
            if (typeof this.maxDauer != "undefined") {
                dauerElem.setAttribute("max", this.maxDauer);
            }
            armeeElem.appendChild(dauerElem);
        }
        armeenElem.appendChild(armeeElem);
        dataGathered = true;
    }
}                                                           // }}}2

if( gamePage == "rbarmee" 
    || gamePage == "rbfturm1"
    || gamePage == "rbfturm2"
    || gamePage == "rbfturma"
    || gamePage == "rbfturms"
) {
    var imgEntries = document.getElementsByTagName("img");
    var bundListe = new Array(); // von TRs
    var feindListe = new Array(); // von TRs
    var lastAction = "none";
    var bundNum = 0; // in Bundliste sind auch Schiffe
    var feindNum = 0; // in Feindliste sind auch Schiffe

    // Armeen identifizieren    {{{2
    function identifyArmies()
    {
        for( var i = 0; i < imgEntries.length; i++ ) {
            if (isAllyArmee(imgEntries[i], friendlyAllies)) {
                // Verbuendete Armee
                bundListe.push(imgEntries[i].parentNode.parentNode);
                lastAction = "bund";
                bundNum++;
                // Schiffszugehoerigkeit mitnehmen
                var nextTR = bundListe[bundListe.length-1].nextSibling;
                if (nextTR && nextTR.childNodes[0].colSpan == 3) {
                    bundListe.push(nextTR);
                }
            } else if(isAllyArmee(imgEntries[i], hostileAllies)) {
                // Feindliche Armee
                feindListe.push(imgEntries[i].parentNode.parentNode);
                lastAction = "feind";
                feindNum++;
                // Schiffszugehoerigkeit mitnehmen
                var nextTR = feindListe[feindListe.length-1].nextSibling;
                if (nextTR && nextTR.childNodes[0].colSpan == 3) {
                    feindListe.push(nextTR);
                }
                feind = true;
            } else if (isShip(imgEntries[i])) {
                if (lastAction == "bund") {
                    bundListe.push(imgEntries[i].parentNode.parentNode);
                } else if (lastAction == "feind") {
                    feindListe.push(imgEntries[i].parentNode.parentNode);
                }
            } else if (isArmeeHandle(imgEntries[i])) {
                lastAction = "none";
            }
        }
    }
    identifyArmies();
    //                          }}}2

    // Armeeaktualisierung      {{{2
    var armeenElem = xmlDataDoc.createElement("armeen");

    // eigene Armeen in Armeesicht (Bilder als input-img name=Armee)    {{{3
    var inputs = document.getElementsByTagName("input");
    function ownArmiesInArmyView()
    {
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
                var armee = new armeeObjekt(id, match[1], name);
                armee.pos = currentPos; // von aktueller Armee
                armee.size = outerTD.previousSibling.childNodes[2]
                    .data.split(" ")[1];
                armee.strength = outerTD.previousSibling.childNodes[4]
                    .data.split(" ")[1];
                armee.owner = outerTD.nextSibling.childNodes[1].firstChild.data;
                // hier hoeher gehen wegen FORM tag
                armee.schiff = getShip(inputs[i].parentNode);

                armee.add();
            } else {
                // laufende/aktuelle Armee
                var name = outerTD.nextSibling.firstChild.data
                // hier ist ein Leerzeichen im HTML-code vor dem Armeenamen
                    .replace(/^\s+/,'');
                var armee = new armeeObjekt(id, match[1], name);
                var statTD = outerTD.nextSibling.nextSibling.nextSibling;
                var bp = statTD.childNodes[2].firstChild.data.split(" ")[0];
                armee.bp = bp.split("/")[0];
                armee.maxBP = bp.split("/")[1];
                var ap = statTD.childNodes[4].data.split(" ")[0];
                armee.ap = ap.split("/")[0];
                armee.maxAP = ap.split("/")[1];
                var bewImg = form.nextSibling.src;
                if (bewImg.indexOf("bew4.gif") == -1) {
                    // laufender Held
                    var unitTD = outerTD.parentNode.nextSibling.childNodes[2];
                    var terrainTR = outerTD.parentNode.nextSibling.nextSibling;
                    if (unitTD.firstChild.data.split(" ")[1] != "Soldaten") {
                        // Ist Fahrgast in einem Transporter
                        var unitTD = outerTD.parentNode.nextSibling
                            .nextSibling.nextSibling.childNodes[2];
                        var terrainTR = outerTD.parentNode.nextSibling
                            .nextSibling.nextSibling.nextSibling;
                    }
                    armee.schiff = null;
                } else {
                    // Schiff
                    var unitTD = outerTD.parentNode.nextSibling
                        .nextSibling.nextSibling.childNodes[2];
                    var terrainTR = outerTD.parentNode.nextSibling.nextSibling
                        .nextSibling.nextSibling;
                    var schiffTR = outerTD.parentNode.nextSibling;
                    armee.schiff = new Object();
                    armee.schiff.name = schiffTR.childNodes[2].firstChild.data;
                    armee.schiff.img = schiffTR.childNodes[1].firstChild.src
                        .replace(/.*\/(.*).gif/,"$1");
                    armee.schiff.typ = armee.schiff.img; // nur Bild vorhanden

                    // Reichweitenfaerbung
                    var weiteTD = schiffTR.childNodes[3];
                    var rw = weiteTD.childNodes[2].firstChild.data;
                    var maxRW = weiteTD.childNodes[3].data.split("/")[1];
                    if (rw <= Math.ceil(maxRW/2)) {
                        var weiteSpan = weiteTD.childNodes[2];
                        if (rw <= Math.ceil(maxRW/4)) {
                            weiteSpan.style.fontSize = "1.5em";
                            weiteSpan.style.color = "red";
                        } else {
                            weiteSpan.style.fontSize = "1.3em";
                            weiteSpan.style.color = "yellow";
                        }
                    }
                }
                var soldaten = unitTD.firstChild.data.split(" ")[0];
                var siedler = unitTD.firstChild.data.split(" ")[3];
                armee.size = parseInt(soldaten, 10) + parseInt(siedler, 10);
                armee.ruf = unitTD.firstChild.data.split(" ")[6];
                armee.strength = unitTD.childNodes[2].data.split(" ")[1];
                armee.pos = terrainTR.childNodes[2].childNodes[1]
                    .firstChild.data;
                // aktuelle Position, wird spaeter von anderen genutzt !!!
                currentPos = armee.pos;
                armee.owner = "[self]";

                armee.add()
            }
        }
    }
    }                                                           //      }}}3
    ownArmiesInArmyView();

    // eigene Armeen in Turmsicht (Bilder input-img name=ok)   {{{3
    var inputs = document.getElementsByTagName("input");
    function ownArmiesInTower()
    {
        for( var i = 0; i < inputs.length; i++ ) {
            if (inputs[i].type == "image" && inputs[i].name == "ok") {
                var match = isArmeeHandle(inputs[i]);
                if (!match) { break; }
                var form = inputs[i].parentNode.parentNode
                    .parentNode.parentNode.parentNode;
                var id = form.childNodes[4].value;
                var outerTD = form.parentNode;
                var name = outerTD.previousSibling.firstChild.data;
                var armee = new armeeObjekt(id, match[1], name);
                armee.pos = outerTD.previousSibling.previousSibling
                        .firstChild.data;
                armee.owner = outerTD.nextSibling.childNodes[2].firstChild.data;
                // hier hoeher gehen wegen FORM tag
                armee.schiff = getShip(inputs[i].parentNode);

                armee.add();
            }
        }
    }                                                   // }}}3
    ownArmiesInTower();

    // fremde Armeen (normale img)              {{{3
    var imgEntries = document.getElementsByTagName("img");
    function foreignArmies ()
    {
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
                if(name != "Bei:") {
                    /* "Bei:" -> Kapitaen des Schiffs auf dem man ist
                     * dieser wird spaeter auch weiter unten nochmal gezeigt,
                     * also hier erstmal ignoriert
                     */
                    var armee = new armeeObjekt(null, img, name);
                    armee.pos = pos;
                    var size = outerTD.previousSibling.childNodes[2].data;
                    armee.size = size.split(" ")[1];
                    var strength = outerTD.previousSibling.childNodes[4].data;
                    armee.strength = strength.split(" ")[1];
                    armee.owner = outerTD.nextSibling.childNodes[1]
                        .firstChild.data;
                    var secondForm = outerTD.nextSibling.nextSibling.firstChild;
                    // ID nur wenn angreifbar hier per Form (kein Schutz)
                    if (secondForm.getElementsByTagName) {
                        var inputs = secondForm.getElementsByTagName("input");
                        for (var j = 0; j < inputs.length; j++) {
                            if (inputs[j].name == "armee2") {
                                armee.id = inputs[j].value;
                                break;
                            }
                        }
                    }
                    armee.schiff = getShip(imgEntries[i]);

                    armee.add();
                }
            } else {
                // in einer Turmsicht
                var outerTD = imgEntries[i].parentNode.parentNode
                    .parentNode.parentNode.parentNode;
                var id = outerTD.nextSibling.childNodes[0].value;
                var name = outerTD.previousSibling.firstChild.data;
                var armee = new armeeObjekt(id, img, name);
                armee.pos = outerTD.previousSibling.previousSibling
                    .firstChild.data;
                armee.owner = outerTD.nextSibling.childNodes[2].firstChild.data;
                armee.schiff = getShip(imgEntries[i]);

                armee.add();
            }
        }
    }
    }                                           // }}}3
    foreignArmies();

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
    if (feindNum + bundNum > 0) {
        for( var i = 0; i < imgEntries.length; i++ ) {
            if (imgEntries[i].src
                    == "http://www.ritterburgwelt.de/rb/bild/gui/boxtrenn0.gif"
                ) {
                temp = document.createTextNode("Hier stehen " +
                        feindNum + " Feinde und " +
                        bundNum + " Verb\xFCndete.");
                imgEntries[i].parentNode.parentNode.parentNode
                    .appendChild(temp);
                break;
            }
        }
    }

    if (feindListe.length > 0) {
        document.body.background ="";
        document.bgColor = "#FF0000";
    }
    //                          }}}3
    // Ende Armeesortierung     }}}2

} // ende Armeebearbeitung

if(gamePage == "rbtavernesold") { //    {{{2
    var armeenElem = xmlDataDoc.createElement("armeen");

    var imgEntries = document.getElementsByTagName("img");
    for( var i = 0; i < imgEntries.length; i++ ) {
        var match = isArmeeHandle(imgEntries[i]);
        if (match) {
            var img = match[1];
            var outerTD = imgEntries[i].parentNode;
            var name = outerTD.previousSibling.firstChild.data;
            var armee = new armeeObjekt(null, img, name);
            armee.pos = null;
            armee.schiff = null;
            armee.owner = null;
            var bpTD = outerTD.nextSibling.nextSibling.nextSibling
                .nextSibling.nextSibling.nextSibling;
            armee.maxBP = bpTD.firstChild.data;
            armee.maxAP = bpTD.nextSibling.firstChild.data;
            armee.ruf = bpTD.nextSibling.nextSibling.firstChild.data;
            armee.maxDauer = bpTD.nextSibling.nextSibling.nextSibling
                .firstChild.data.split(" ")[0];
            var id = bpTD.nextSibling.nextSibling.nextSibling
                .nextSibling.nextSibling.firstChild.name;
            if (id) {
                armee.id = id.replace(/(armee|soeldner)\[(.+)\]/, '$2');
            }

            armee.add();
        }
    }

    addDataSection(armeenElem);
} // ende Tavernensoeldner              }}}2

} catch (e) {
    printError("Fehler in der Armeeerfassung: ", e);
}
//                              }}}1

// Reichserfassung              {{{1
try {

function reichObjekt() {                   // {{{2
    this.add = addReich;
    this.getAlly = reichGetAlly;
}

function addReich()
{
    var reichElem = xmlDataDoc.createElement("reich");

    // Attribute
    if (typeof this.name != "undefined") {
        reichElem.setAttribute("name", this.name);
    }
    if (typeof this.level != "undefined") {
        reichElem.setAttribute("level", this.level);
    }
    if (typeof this.top10 != "undefined") {
        reichElem.setAttribute("top10", this.top10);
    }
    if (typeof this.status != "undefined") {
        if (this.status !== null) {
            reichElem.setAttribute("status", this.status);
        } else {
            reichElem.setAttribute("status", "");
        }
    }
    if (typeof this.last_turn != "undefined") {
        reichElem.setAttribute("last_turn", this.last_turn);
    }

    // Ritter
    var ritterElem = xmlDataDoc.createElement("ritter");
    if (typeof this.r_id != "undefined") {
        ritterElem.setAttribute("r_id", this.r_id);
    }
    // name wird hier als Inhalt des Elements uebergeben
    ritterElem.appendChild(xmlDataDoc.createTextNode(this.rittername));
    reichElem.appendChild(ritterElem);

    // Allianz (nicht unter Ritter moeglich leider)
    if (typeof this.a_id != "undefined" || typeof this.a_tag != "undefined") {
        var allianzElem = xmlDataDoc.createElement("allianz");
        if (typeof this.a_id != "undefined") {
            if (this.a_id !== null) {
                allianzElem.setAttribute("a_id", this.a_id);
            } else {
                allianzElem.setAttribute("a_id", 0);
            }
        } else {
            allianzElem.setAttribute("tag", this.a_tag);
        }
        reichElem.appendChild(allianzElem);
    }

    // fertiges Produkt einhaengen
    reicheElem.appendChild(reichElem);
    dataGathered = true;
}

function reichGetAlly(imgEntries, bTag) {
        if (imgEntries.length > 0) {
            exp = new RegExp("http://www.ritterburgwelt.de/rb/held//allym"+
                    "([0-9]+).gif","");
            match = imgEntries[0].src.match(exp);
            if (match) {
                this.a_id = match[1];
            }
        } else if (bTags.length >= 2) {
            this.a_tag = bTags[1].firstChild.data.match(/\[(.*)\]/)[1];
        } else {
            this.a_id = null;
        }
}                                                           // }}}2

if( gamePage == "rbreiche" ) {  // {{{2
    var reicheElem = xmlDataDoc.createElement("reiche");

    var trEntries = document.getElementsByTagName("tr");
    for( var i = 0; i < trEntries.length; i++ ) {
        if (trEntries[i].id.search(/zeile_[0-9]+_tabelle_/) == 0) {
            var cells = trEntries[i].getElementsByTagName("td");
            reich = new reichObjekt();

            bTags = cells[0].getElementsByTagName("b")
            reich.rittername = bTags[0].firstChild.data;
            var imgEntries = cells[0].getElementsByTagName("img");
            reich.getAlly(imgEntries, bTags);
            iTags = cells[0].getElementsByTagName("i")
            if (iTags.length > 0) {
                reich.status = iTags[0].firstChild.data;
            } else {
                reich.status = null;
            }
            reich.name = cells[1].firstChild.data.replace(/^\s*/,"");
            reich.level = cells[2].firstChild.data.replace(/^\s*/,"");
            reich.last_turn = cells[4].firstChild.data.replace(/^\s*/,"");
            var inputs = trEntries[i].getElementsByTagName("input");
            for (var j = 0; j < inputs.length; j++) {
                if (inputs[j].name == "sid2") {
                    reich.r_id = inputs[j].value;
                    break;
                }
            }

            // "fertiges" Reich hinzufuegen
            reich.add();
        }
    }

    addDataSection(reicheElem);
} // ende rbreiche                      }}}2

if( gamePage == "rbnachr1" ) {  // {{{2
    var reicheElem = xmlDataDoc.createElement("reiche");
    var reich = new reichObjekt();
    reich.status = null; // wird moeglicherweise spaeter ueberschrieben

    var listEntries = document.getElementsByTagName("li");
    for(var i = 0; i < listEntries.length; i++ ) {
        var item = listEntries[i];

        if (typeof item.firstChild.data != "undefined") {
            if (item.firstChild.data == "Herrscher ") {
                var bTags = item.getElementsByTagName("b");
                reich.rittername = bTags[0].firstChild.data;
                var imgs = item.getElementsByTagName("img");
                reich.getAlly(imgs, bTags);
            }
            if (item.firstChild.data == "Reich ") {
                reich.name = item.childNodes[1].firstChild.firstChild.data;
            }
            if (item.firstChild.data.search("Level ") == 0) {
                reich.level = item.firstChild.data.match(/Level ([0-9]+)/)[1];
            }
            if (item.firstChild.data.search("Letzter Zug ") == 0) {
                reich.last_turn = item.firstChild.data
                    .match(/Letzter Zug (.*)/)[1];
            }
        } else if (item.firstChild.firstChild.firstChild
                && item.firstChild.firstChild.firstChild.data) {
            inaktivString = "Das Reich befindet sich auf der Inaktivenliste";
            if (item.firstChild.firstChild.firstChild.data
                    .search(inaktivString) == 0) {
                reich.status = "Inaktiv";
            }
            schutzString = "Das Reich befindet sich auf der Schutzliste";
            if (item.firstChild.firstChild.firstChild.data
                    .search(schutzString) == 0) {
                reich.status = "Schutzliste";
            }
        }
    }

    var inputs = document.getElementsByTagName("input");
    for (var j = 0; j < inputs.length; j++) {
        if (inputs[j].name == "sid2") {
            reich.r_id = inputs[j].value;
            break;
        }
    }

    if (typeof reich.name != "undefined") {
        // fertiges Reich hinzufuegen
        reich.add();
        addDataSection(reicheElem);
    }
} // ende rbnachr1                      }}}2


if( gamePage == "rbftop10" ) {  // {{{2
    var reicheElem = xmlDataDoc.createElement("reiche");
    var trEntries = document.getElementsByTagName("tr");
    for (var i = 0; i < trEntries.length; i++) {
        var row = trEntries[i];
        if (row.firstChild.firstChild &&
                row.firstChild.firstChild.firstChild &&
                row.firstChild.firstChild.firstChild.data &&
                row.firstChild.firstChild.firstChild.data.match(/[0-9]+\./)) {
            reich = new reichObjekt();
            reich.top10 = row.firstChild.firstChild.firstChild.data
                .match(/([0-9]+)\./)[1];
            bTags = row.childNodes[1].getElementsByTagName("b");
            reich.rittername = bTags[0].firstChild.data;
            imgs = row.childNodes[1].getElementsByTagName("img");
            reich.getAlly(imgs, bTags);

            reich.add();
        }
    }

    addDataSection(reicheElem);
} // ende rbftop10                      }}}2

} catch (e) {
    printWarning("Fehler in der Reichserfassung: " + e);
}
//                              }}}1

if (gamePage == "rbarmee"
        || gamePage == "rbfturm1"
        || gamePage == "rbfturm2"
        || gamePage == "rbfturma"
        || gamePage == "rbfturms"
        || gamePage == "rbreiche"
        || gamePage == "rbnachr1"
        || gamePage == "rbftop10"
        || gamePage == "rbtavernesold") {
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

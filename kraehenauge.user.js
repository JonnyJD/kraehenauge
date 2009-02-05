// ==UserScript==
// @name           Kraehenauge
// @namespace      http://kraehen.org
// @description    Dies ist bzw. wird das clientseitige KSK-Programm. Es unterstuetzt die Kraehen auf ihren Wegen in Alirion und gibt ihnen Ueberblick und schnelle Reaktionsmoeglichkeiten.
// @include        http://www.ritterburgwelt.de/rb/rbstart.php
// @include        file:///home/jonnyjd/rbstart.php.html
// @author         JonnyJD
// @version        1.2.2.1
// ==/UserScript==

var version = 'Kr\xE4henauge 1.2.2.1';
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
var debugOut = "";

// Seitenerkennung
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
// allgemeine Seiten
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
// Individualseiten
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
gameInfo.innerHTML = '<div><br/>' + gameId + ' - ' + gamePage + '</div>';
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


// Armeedaten lesen und markieren (Erinnerung)
if( gamePage == "rbstart" ) {
    // Armeetabelle finden
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

    // fuer die spaetere Faerbung
    function farbTage(parentTag, tage, farbe) {
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
} // Ende Armeedaten einlesen


// Dorfdaten lesen
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


// Handelsbude einlesen aus einer Handelsdorfseite
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


// Armeelinks
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

// Kraehenkarte
var kskKarte = document.createElement('img');
kskKarte.src = "http://www.ritterburgwelt.de/rb/held/allym60.gif";
kskKarte.style.border = "1px solid red";
var newLink = document.createElement('a');
newLink.href = "http://kraehen.org/karte/";
newLink.target = "_blank";
newLink.appendChild(kskKarte);
document.getElementById('Leiste4').appendChild(newLink);
createSeparation(4); createSeparation(4);

// Dorflinks
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
if (GM_getValue(gameId+".hb.mfeld")) {
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
            GM_getValue(gameId+".hb.mfeld") + '">' +
            '<input type="hidden" name="feld" value="' +
            GM_getValue(gameId+".hb.feld") + '">' +
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
            linkForm.innerHTML = '<form method="post">' +
                '<input type="hidden" name="name" value="' + session + '">' +
                '<input type="hidden" name="passw" value="' + gameId + '">' +
                '<input type="hidden" name="seite" value="31">' +
                '<input type="hidden" name="bereich" value="dorf">' +
                '<input type="hidden" name="modul" value="handel">' +
                '<input type="hidden" name="mfeld2" value="' +
                game["standard"].hb[i].mfeld + '">' +
                '<input type="hidden" name="mfeld" value="' + mfeld + '">' +
                '<input type="hidden" name="feld" value="' + feld + '">' +
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
newLink.href = "http://kraehen.org/preise";
newLink.target = "_blank";
newLink.appendChild(kskTag);
document.getElementById('Leiste4').appendChild(newLink);


// Antwort des Scanners vom Server
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

function sendToScanner() {
    GM_xmlhttpRequest({
        method: 'POST',
        url:    'http://kraehen.org/cgi-bin/kskscanner',
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
}

if (gamePage == "rbftop10"
        || gamePage == "rbtop10q"
        || gamePage == "rbfhandel1"
        || gamePage == "rbrinfo"
        || gamePage == "rbrinfo0") {
    sendToScanner();
}


// Antwort der Datenbank
var newDiv = document.createElement('div');
newDiv.align = "center";
document.getElementsByTagName('BODY')[0].appendChild(newDiv);
var response = document.createElement('div');
response.id = "DBAntwort";
response.style.backgroundColor = "#AF874E";
response.style.width = "auto";
response.style.maxWidth = "600px";
newDiv.appendChild(response);
var copyText = wholePage;
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
//document.getElementById("DBAntwort").innerHTML = "<pre>"+copyText+"</pre>";


function sendToHandler(handler, fieldName) {
    GM_xmlhttpRequest({
        method: 'POST',
        url:    "http://kraehen.org/karte/"+handler,
        headers: { "Content-type" : "application/x-www-form-urlencoded" },
        data:   fieldName+'='+encodeURIComponent(copyText),
        onload: function(responseDetails) {
            document.getElementById("DBAntwort").innerHTML
                = responseDetails.responseText;
        },
        onerror: function(responseDetails) {
            document.getElementById("DBAntwort").innerHTML
                = 'status: ' + responseDetails.status
                + '\n' + responseDetails.responseText;
        }
    })
}

if (gamePage == "rbarmee") sendToHandler("k-armee.php", "dorftext");
if (gamePage == "rbfturm1"
    || gamePage == "rbfturm2"
    || gamePage == "rbfturma") sendToHandler("k-turm.php", "text");
// datenpflegeseite kann momentan nicht von allen benutzt werden
if (gameId == 'rbspiel1728') {
    if (gamePage == 'rbftop10') sendToHandler("datenpflege.php",
            "wahl=top10&textbereich");
    if (gamePage == 'rbally2') sendToHandler("datenpflege.php",
            "wahl=alli&textbereich");
}


// Armeesortierung
function allyArmee(imgEntry, allies) {
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
}

if( gamePage == "rbarmee" 
    || gamePage == "rbfturm1"
    || gamePage == "rbfturm2"
) {
    var imgEntries = document.getElementsByTagName("img");
    var bundListe = new Array();
    var feindListe = new Array();

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

    // feindliche Armeen an den Anfang
    for( var i = feindListe.length -1; i > -1; i-- ) {
        var parentNode = feindListe[i].parentNode;
        parentNode.removeChild(feindListe[i]);
        parentNode.insertBefore(feindListe[i], parentNode.firstChild);
    }
    // verbuendete Armeen ganz ans Ende
    for( var i = 0; i < bundListe.length; i++ ) {
        var parentNode = bundListe[i].parentNode;
        parentNode.removeChild(bundListe[i]);
        parentNode.appendChild(bundListe[i]);
    }

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
} // ende Armeesortierung


// Ressourcenauswertung
if( gamePage == "rbrinfo0" ) {
    // Finde die Warentabelle
    var gueterTabelle = "";
    var tabellen = document.getElementsByTagName("table");
    for (var i=0; i < tabellen.length; i++) {
        if (tabellen[i].getElementsByTagName("tr")[0]
                .firstChild.firstChild.data == "Gut") {
            gueterTabelle = tabellen[i];
            break;
        }
    }

    // Zaehle die Doerfer
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

    // Zeile mit verbleibenden Tagen pro Dorf vorbereiten
    var restTageZeile = document.createElement("tr");
    gueterTabelle.getElementsByTagName("tr")[0].parentNode.insertBefore(
            restTageZeile, gueterTabelle.getElementsByTagName("tr")[1]);
    for (var i=0; i < gueterTabelle.getElementsByTagName("tr")[0]
            .childNodes.length; i++) {
        restTageZeile.appendChild(document.createElement("td"));
    }
    var textNode = document.createTextNode("Tage verbleibend");
    restTageZeile.childNodes[0].appendChild(textNode);

    // Funktion fuer die Ausgabe und Formatierung
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

    // jedes Dorf Betrachten
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

    // fuer jedes Gut die Summenspalte betrachten
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


} // ende Ressourcenauswertung


// Zugauswertung
if (gamePage == "rbzug") {
    // finde die Gueterbilanz
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

    // Titelzeile
    newTD = document.createElement("TD");
    newText = document.createTextNode("Z\xFCge");
    newTD.appendChild(newText);
    gueterZeilen[0].appendChild(newTD);

    // betrachte alle Gueter
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
} // Ende Zugauswertung


// debugausgabe
if (debugOut != "") {
    gameInfo.appendChild(document.createTextNode(debugOut));
}

/* vim:set shiftwidth=4 expandtab smarttab: */

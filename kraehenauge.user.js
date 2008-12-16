// ==UserScript==
// @name           Kraehenauge
// @namespace      http://kraehen.org
// @description    Dies ist bzw. wird das clientseitige KSK-Programm. Es unterstuetzt die Kraehen auf ihren Wegen in Alirion und gibt ihnen Ueberblick und schnelle Reaktionsmoeglichkeiten.
// @include        http://www.ritterburgwelt.de/rb/rbstart.php
// @author         JonnyJD
// @version        1.2.1
// ==/UserScript==

var version = 'Kr\xE4henauge 1.2.1';
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
    // Jonerian
    rbspiel1728: {
        armeen: new Array("7666", "h7666h", "7511", "h7511h",
                        "201", "h201h", "6695", "522"),
        dorf: new Array("297273", "294270", "292269", "293273", "292270"),
        hb: new Array({ mfeld: "294270", feld: "55" },
                      { mfeld: "292269", feld: "44" })
    },
    // Rich
    rbspiel1802: {
        armeen: new Array("7692", "h7692h", "7687", "h7687h",
                        "90", "h2s7", "193", "h193h"),
        dorf: new Array("293267", "292267", "291267", "290267", "295268"),
        hb: new Array({ mfeld: "293267", feld: "44" })
    },
    // Stolze
    rbspiel1803: {
        armeen: new Array("7719", "520", "7708", "507",
                        "147", "h147h", "214", "h214h"),
        dorf: new Array("289270", "291271", "290271", "290272"),
        hb: new Array({ mfeld: "290270", feld: "23" })
    },
    // Huebi
    rbspiel1808: {
        armeen: new Array("7729", "520", "7697", "511",
                        "104", "h104h", "39", "hs6"),
        dorf: new Array("300269", "286269", "284271", "285270", "286271"),
        hb: new Array({ mfeld: "300269", feld: "55" })
    },
    // Boerni
    rbspiel1850: {
        armeen: new Array("7924", "h7924h", "7920", "h7920h"),
        dorf: new Array("282270", "269265", "290268", "282269", "292268"),
        hb: new Array({ mfeld: "292268", feld: "62" })
    },
    // Windson
    rbspiel3037: {
        armeen: new Array("2914905", "521", "2915115", "515",
                          "8281", "512", "4142", "509"),
        dorf: new Array("291265", "295263", "295266", "296267", "300271"),
        hb: new Array({ mfeld: "295266", feld: "8" },
                      { mfeld: "300271", feld: "20"})
    },
    // Ubigaz
    rbspiel3068: {
        armeen: new Array("2948578", "517", "2948579", "508"),
        dorf: new Array("306250")
    }
}

// Einstellungen Armeesortierung
// 17 = SL, 18 = ZDE, 31 = DR, 38 = P, 43 = d13K, 55 = KdS
// 59 = TW, 60 = KSK, 61 = UfR, 63 = BdS, 67 = RK, 70 = NW
// Trenner ist | (regExp ODER)
var friendlyAllies = "(60)";
var hostileAllies  = "()";

// Einstellungen Ressourcenauswertung
// Bei welcher anzahl verbleibender Tage welche Farbe benutzt wird:
tageRot = 5
tageGelb = 15


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
    }
}
// allgemeine Seiten
if (pageTitle.search(/Thronsaal(.*)/) >= 0)
    gamePage = 'rbstart';
else if (pageTitle.indexOf('\xD6ffentliche Chronik') >= 0)
    gamePage = 'rbchronik1';
else if (pageTitle.indexOf('die letzten Ereignisse') >= 0)
    gamePage = 'rbereignis';
else if (pageTitle.indexOf('Nachrichten') >= 0)
    gamePage = 'rbnachr1';
else if (pageTitle.indexOf('laufende Quests') >= 0)
    gamePage = 'rbquest';
else if (pageTitle.search(/T\xFCrme der Allianz(.*)/) >= 0)
    gamePage = 'rbfturma';
else if (pageTitle.indexOf('vernichtete Monster und R\xE4uber') >= 0)
    gamePage = 'rbmonster';
else if (pageTitle.indexOf('Aufteilung der verschiedenen Einheiten im Reich:') >= 0)
    gamePage = 'rbminfo0';
else if (pageTitle.search(/Ressourcen im Reich (.*)/) >= 0)
    gamePage = 'rbrinfo0';
else if (pageTitle.indexOf('bekannte Rezepte') >= 0)
    gamePage = 'rbrezept';
else if (pageTitle.indexOf('bekannte Gegenst\xE4nde') >= 0)
    gamePage = 'rbanzeige2';
else if (pageTitle.indexOf('eigene Punktzahl') >= 0)
    gamePage = 'rbftop10';
else if (pageTitle.indexOf('Die besten Arbeiter') >= 0)
    gamePage = 'rbtop10b';
else if (pageTitle.indexOf('TOP 10 der Bekanntheit') >= 0)
    gamePage = 'rbtop10q';
else if (pageTitle.indexOf('\xDCbersicht der Reiche') >= 0)
    gamePage = 'rbreiche';
else if (pageTitle.indexOf('Diplomatie') >= 0)
    gamePage = 'rbdiplo';
else if (pageTitle.indexOf('Allianzen') >= 0)
    gamePage = 'rbally1';
// Individualseiten
else if (pageTitle.indexOf('Armee') >= 0)
    gamePage = 'rbarmee';
else if (pageTitle.search(/Dorf (.*), Handelsbude/) >= 0)
    gamePage = 'rbfhandel1';
else if (pageTitle.search(/Dorf (.*), Turmsicht\(2\)/) >= 0)
    gamePage = 'rbfturm2';
else if (pageTitle.search(/Dorf (.*), Turmsicht/) >= 0)
    gamePage = 'rbfturm1';
else if (pageTitle.search(/Ressourcen im Dorf (.*)/) >= 0)
    gamePage = 'rbrinfo';


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
    || gamePage == "rbfturm2") sendToHandler("k-turm.php", "text");
// Allianztuerme sichten
if (gamePage == "rbfturma") sendToHandler("k-turm.php", "text");


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
    while (gueterTabelle.getElementsByTagName("tr")[0].childNodes[doerfer+1]
                    .innerHTML.indexOf("Dorf") >= 0) {
        doerfer++;
    }
    var gesamt = doerfer + 1;

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

// debugausgabe
if (debugOut != "") {
    gameInfo.appendChild(document.createTextNode(debugOut));
}

/* vim:set shiftwidth=4 expandtab smarttab: */

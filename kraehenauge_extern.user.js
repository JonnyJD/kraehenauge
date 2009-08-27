// ==UserScript==       {{{1
// @name           Kraehenauge: Extern
// @namespace      http://kraehen.org
// @description    Dies ist das clientseitige KSK-Programm. Es unterstuetzt die Kraehen und ihre Verbuendeten auf ihren Wegen in Alirion und gibt ihnen Ueberblick und schnelle Reaktionsmoeglichkeiten.
// @include        http://www.ritterburgwelt.de/rb/rbstart.php
// @include        file:///home/jonnyjd/rbstart.php.html
// @author         JonnyJD
// @version        0.5
// ==/UserScript==      }}}1

var version = 'Kr\xE4henauge: externe Edition 0.5';

// Einstellungen        {{{1
// 17 = SL, 18 = ZDE, 31 = DR, 38 = P, 43 = d13K, 55 = KdS
// 59 = TW, 60 = KSK, 61 = UfR, 63 = BdS, 67 = RK, 70 = NW
// Trenner ist | (regExp ODER)
var friendlyAllies = "(60|59)";
var hostileAllies  = "()";
//                       }}}1

// Kernvariablen        {{{1
var wholePage = document.getElementsByTagName('HTML')[0].innerHTML;
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
else if (pageTitle.indexOf('T\xFCrme der Allianz') == 0)
    gamePage = 'rbfturma';
//                      }}}2
// Individualseiten     {{{2
else if (pageTitle.indexOf('Armee') == 0)
    gamePage = 'rbarmee';
else if (pageTitle.search(/Dorf (.*), Turmsicht\(2\)/) == 0)
    gamePage = 'rbfturm2';
else if (pageTitle.search(/Dorf (.*), Turmsicht/) == 0)
    gamePage = 'rbfturm1';
//                      }}}2
//                      }}}1

// Spiel-ID zu Debugzwecken unten ausgeben      {{{1
var gameInfo = document.createElement('div');
gameInfo.innerHTML = '<div><br/>' + gameId + ' - ' + gamePage + '</div>';
//document.getElementsByTagName('CENTER')[1].appendChild(gameInfo);
// Versionsnummer unten ausgeben
var versionInfo = document.createElement('div');
versionInfo.innerHTML = '<br/>' + version;
document.getElementsByTagName('CENTER')[1].appendChild(versionInfo);
//                                              }}}1

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

function sendToHandler(handler, fieldName, content, answer) {    // {{{2
    GM_xmlhttpRequest({
        method: 'POST',
        url:    "http://kraehen.org/ext/"+handler,
        headers: { "Content-type" : "application/x-www-form-urlencoded" },
        data:   a+pid+fieldName+'='+encodeURIComponent(content),
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

    sendToHandler("send/text/armee", "dorftext", copyText, "DBAntwort");
}

if (gamePage == "rbfturm1"
    || gamePage == "rbfturm2"
    || gamePage == "rbfturma") {

    sendToHandler("send/text/turm", "text", copyText, "DBAntwort");
}
//                                      }}}1

// Landschaftserfassung         {{{1

function listTerrain(terrain, floor, x, y, width, center, list) { //      {{{2
    if (!center) {
        // Zentrum aus linker oberer Ecke berechnen
        xval = x + Math.floor(width/2);
        yval = y + Math.floor(width/2);
    } else {
        // das Zentrum wurde gegeben
        xval = x;
        yval = y;
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
            list += floor + " " + x + " " + y + " ";
            list += terrain[i];
            list += "\n";
        }

    }
    return list;
}                                                               //      }}}2

// Erfassung in der Armee               {{{2
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
        var x = parseInt(fields[2]);
        var y = parseInt(fields[3]);
        if (fields[1] == undefined || fields[1] == "Q") {
            var floor = "N";
        }
        sendData += floor + " " + x + " " + y + " ";
        // Terrain
        sendData += imgEntries[i].src.replace(/.*\/([^\/]*)\.gif/, '$1');
        // Landschaftsname
        sendData += tdNode.firstChild.nodeValue.replace(/(.*) :/, '$1');
        sendData += "\n";
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
        // x, y sind schon gesendete Zentrumskoordinaten -> true
        sendData = listTerrain(terrain, floor, x, y, width, true, sendData);

        sendToHandler("send/terrain", "data", sendData, "Landschaft");
    }
}                                                       //      }}}2

// Erfassung im Turm                    {{{2
if (gamePage == "rbfturm1"
        || gamePage == "rbfturm2"
        || gamePage == "rbfturma") {
    var output = createOutputArea("Landschaft");
    var sendData = "";

    // Kartenanfang suchen
    // = erstes Auftreten eines Kartenbildes im Code
    var imgEntries = document.getElementsByTagName("img");
    i = 0;
    while (i < imgEntries.length
            && imgEntries[i].src.indexOf('/bild/karte/') == -1) { i++; }
    if (i == imgEntries.length) {
        var text = "Karten konnte nicht gefunden werden.";
        output.appendChild(document.createTextNode(text));
        return;
    } else {
        // zur linken oberen Koordinatenangabe gehen
        // also die erste Zelle mit Text statt eines Bildes
        var trNode = imgEntries[i].parentNode.parentNode;
        var width = 0;
        // nodeType == 3 -> text node
        while (trNode.childNodes[width].firstChild.nodeType != "3") { width++; }
        var text = trNode.childNodes[width].firstChild.nodeValue;
        var expr = /([0-9]*),([0-9]*)/;
        coords = expr.exec(text);
        // Koordinaten der linken oberen Ecke
        var x = parseInt(coords[1]);
        var y = parseInt(coords[2]);

        // Terrain auslesen
        var imgEntries = trNode.parentNode.getElementsByTagName("img");
        terrain = new Array();
        for (var i=0; i < imgEntries.length; i++) {
            if (imgEntries[i].src.indexOf("buttons") == -1) {
                // Alles was kein Button ist, ist hier ein Feld
                var num = imgEntries[i].src.replace(/.*\/([^\/]*)\.gif/,'$1');
                terrain.push(num);
            }
        }
        // listTerrain bekommt keinen fertigen Kartenmittelpunkt -> false
        sendData = listTerrain(terrain, "N", x, y, width, false, sendData);

        sendToHandler("send/terrain", "data", sendData, "Landschaft");
    }
}                                                       //      }}}2

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

// debugausgabe {{{1
if (debugOut != "") {
    gameInfo.appendChild(document.createTextNode(debugOut));
}       //      }}}1

/* vim:set shiftwidth=4 expandtab smarttab foldmethod=marker: */

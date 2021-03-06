#!/bin/sh

# Hier soll das Auge getestet werden.
# Dazu wird immer eine rbstart.php.html geschrieben
# und dann gewartet bis der User diese mit dem Auge aufgerufen
# und geprueft hat.
# Das ist eine Art Regressionstest da die Testseiten meist gleich bleiben,
# wobei die Ergebnisse aber manuell uberprueft werden muessen.

# Bei Zielaenderungen bitte auch die Kommentare anpassen!
ziel="../rbstart.php.html"
if [ -e $ziel ]; then
	echo "sichere $ziel"
	mv "$ziel" .
fi

echo
echo "Bitte rufen sie die Datei 'rbstart.php.html' mit dem Browser auf"
echo
for testfile in *.html; do
	if [ "$testfile" != "`basename $ziel`" ]; then
		echo $testfile " -> " $ziel
		cp "$testfile" "$ziel"
		echo "  (bitte 'rbstart.php.html' testen)  "
		# warte auf Eingabe
		read KEY
	fi
done
echo "bitte auch 'regress/ajax_backend.php' testen"
rm $ziel

if [ -e `basename $ziel` ]; then
	echo "schreibe $ziel zuerueck"
	mv "`basename $ziel`" "`dirname $ziel`"
fi

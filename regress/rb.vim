" vim Skript
" fuegt ein paar Newlines in RB-Dateien ein.
" benutzen mit :source rb.vim bzw. :so rb.vim
%s/<table/\r<table/gi
%s/<\/table>/<\/table>\r/gi
%s/<tr/\r<tr/gi
%s/<td/\r<td/gi
%s/<form/\r<form/gi
%s/<\/form>/<\/form>\r/gi
" Markierungen entfernen
nohlsearch

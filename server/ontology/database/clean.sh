rapper -i rdfxml -o ntriples jamendo.rdf > jamendo.nt
python cleaner.py > clean_jamendo.nt
rm db.nt
cat clean_jamendo.nt >> db.nt
cat lastfm.nt >> db.nt

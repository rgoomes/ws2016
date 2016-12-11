rapper -i rdfxml -o ntriples jamendo.rdf > jamendo.nt
python cleaner.py > clean_jamendo.nt
rapper -i ntriples -o turtle clean_jamendo.nt > clean_jamendo.ttl
rapper -i turtle -o rdfxml clean_jamendo.ttl > clean_jamendo.rdf

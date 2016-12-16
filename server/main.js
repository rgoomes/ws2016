import { Meteor } from 'meteor/meteor';

Meteor.methods({
	'test': function(){
		// simulate long search
		Meteor._sleepForMs(1000);
		return 5;
	},

	//TODO: Replace "asd" with lowercase(input)
	'semantic_search': function(){
		var query = "select distinct ?p where {\
					?p <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://dbpedia.org/ontology/MusicGenre> . \
					?p <http://www.w3.org/2000/01/rdf-schema#label> ?g . \
					FILTER((LANG(?g) = \"\" || LANGMATCHES(LANG(?g), \"en\")) && (lcase(str(?g)) = \"" + "asd" + "\"))\
					}";
    	var res = HTTP.call("GET", "http://dbpedia.org/sparql", {
			params: {
				'query': query,
				'format': "json"
			}
		});
		try {
			console.log(JSON.parse(res.content).results.bindings[0].p.value);
			return "genre";
		} catch (err) {
			console.log("No results found for genre!");
		}

		var query = "select distinct ?p where {\
					?p ?o <http://dbpedia.org/ontology/Album> . \
					?p <http://www.w3.org/2000/01/rdf-schema#label> ?n . \
					FILTER((LANG(?n) = \"\" || LANGMATCHES(LANG(?n), \"en\")) && (lcase(str(?n)) = \"" + "asdasdasd" + "\"))\
					}";
		var res = HTTP.call("GET", "http://dbpedia.org/sparql", {
			params: {
				'query': query,
				'format': "json"
			}
		});
		try {
			console.log(JSON.parse(res.content).results.bindings[0].p.value);
			return "record";
		} catch (err) {
			console.log("No results found for records!");
		}

		var query = "select distinct ?p where {\
				?p ?o <http://dbpedia.org/ontology/Band> . \
				?p <http://www.w3.org/2000/01/rdf-schema#label> ?n . \
				FILTER((LANG(?n) = \"\" || LANGMATCHES(LANG(?n), \"en\")) && (lcase(str(?n)) = \"asdasda\"))\
				}";
		var res = HTTP.call("GET", "http://dbpedia.org/sparql", {
			params: {
				'query': query,
				'format': "json"
			}
		});
		try {
			console.log(JSON.parse(res.content).results.bindings[0].p.value);
		} catch (err) {
			var query_ = "select distinct ?p where {\
						?p ?o <http://dbpedia.org/ontology/MusicalArtist> . \
						?p <http://www.w3.org/2000/01/rdf-schema#label> ?n . \
						FILTER((LANG(?n) = \"\" || LANGMATCHES(LANG(?n), \"en\")) && (lcase(str(?n)) = \"asdasda\"))\
						}";
			var res_ = HTTP.call("GET", "http://dbpedia.org/sparql", {
				params: {
					'query': query_,
					'format': "json"
				}
			});
			try {
				console.log(JSON.parse(res_.content).results.bindings[0].p.value);
				return "artist";
			} catch (err_) {
				console.log("No results found for artists!");
			}
		}

		var query="select distinct ?p where {\
				?p ?o <http://dbpedia.org/ontology/Song> . \
				?p <http://www.w3.org/2000/01/rdf-schema#label> ?n . \
				FILTER((LANG(?n) = \"\" || LANGMATCHES(LANG(?n), \"en\")) && (lcase(str(?n)) = \"asdasd\"))\
				}";
		var res = HTTP.call("GET", "http://dbpedia.org/sparql", {
			params: {
				'query': query,
				'format': "json"
			}
		});
		try {
			console.log(JSON.parse(res.content).results.bindings[0].p.value);
			return "track";
		} catch (err) {
			console.log("No results found for songs!");
		}
	},
});

Meteor.startup(() => {
	// code to run on server at startup
});

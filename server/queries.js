function quote(str){
	return "\"" + str + "\"";
}

function tag(str){
	return "<" + str + ">";
}

entityQuery = function(keyword){
	return "SELECT * " + "WHERE { " + tag(keyword) + " ?p ?o } ";
}

recordsRecommendationQuery = function(record_uri, limit){
	return "SELECT DISTINCT ?recommended_record " +
		"WHERE {" +
			tag(record_uri) + " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Record> . " +
			tag(record_uri) + " <http://xmlns.com/foaf/0.1/maker> ?artist . " +
			"?artist <http://xmlns.com/foaf/0.1/made> ?recommended_record FILTER(?recommended_record != " + tag(record_uri) + " ) . " +
		"} " + ((limit == "inf") ? "" : "LIMIT " + limit);
}

tracksRecommendationQuery = function(track_uri, limit){
	return "SELECT DISTINCT ?recommended_track " +
		"WHERE {" +
			tag(track_uri) + " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Track> . " +
			"?record <http://purl.org/ontology/mo/track> " + tag(track_uri) + " . " +
			"?record <http://purl.org/ontology/mo/track> ?recommended_track FILTER(?recommended_track != " + tag(track_uri) + " ) . " +
		"} " + ((limit == "inf") ? "" : "LIMIT " + limit);
}

artistsRecommendationQuery = function(artist_uri, limit){
	return "SELECT DISTINCT ?recommended_artist " +
		"WHERE {" +
			tag(artist_uri) + " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/MusicArtist> . " +
			tag(artist_uri) + " <http://xmlns.com/foaf/0.1/made> ?record1 . " +
			"?record1 <http://www.holygoat.co.uk/owl/redwood/0.1/tags/taggedWithTag> ?tag1 . " +
			"?tag1 <http://www.holygoat.co.uk/owl/redwood/0.1/tags/tagName> ?tag_name1 . " +
			"?record2 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Record> . " +
			"?record2 <http://www.holygoat.co.uk/owl/redwood/0.1/tags/taggedWithTag> ?tag2 . " +
			"?tag2 <http://www.holygoat.co.uk/owl/redwood/0.1/tags/tagName> ?tag_name1 . " +
			"?record2 <http://xmlns.com/foaf/0.1/maker> ?recommended_artist FILTER(?recommended_artist != " + tag(artist_uri) + " ) . " +
		"} " + ((limit == "inf") ? "" : "LIMIT " + limit);
}

getTrackLyrics = function(track_uri){
	var sparql_query = "SELECT ?text " +
		"WHERE { " +
			"?performance <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Performance> . " +
			"?performance <http://purl.org/NET/c4dm/event.owl#factor> ?lyrics . " +
			"?lyrics <http://purl.org/ontology/mo/text> ?text . " +
			"?performance <http://purl.org/ontology/mo/recorded_as> ?signal . " +
			"?signal <http://purl.org/ontology/mo/published_as> " + tag(track_uri) + " . " +
		"} ";

	var results = getQueryResults(sparql_query);
	if(results == null || results.length == 0)
		return "No Lyrics available";

	return results[0].text.value;
}

tracksQuery = function(keyword, limit){
	return "SELECT DISTINCT ?track " +
		"WHERE {{ " +
			"?track <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Track> . " +
			"?track <http://purl.org/dc/elements/1.1/title> ?title FILTER regex(LCASE(str(?title)), " + quote(keyword) + ") . " +
		"} " +
		"UNION { " +
			"?artist <http://xmlns.com/foaf/0.1/name> " + quote(keyword) + " . " +
			"?artist <http://xmlns.com/foaf/0.1/made> ?record . " +
			"?record <http://purl.org/ontology/mo/track> ?track . " +
		"} " +
		"UNION { " +
			"?performance <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Performance> . " +
			"?performance <http://purl.org/NET/c4dm/event.owl#factor> ?lyrics . " +
			"?lyrics <http://purl.org/ontology/mo/text> ?text FILTER regex(LCASE(str(?text)), " + quote(keyword) + ") . " +
			"?performance <http://purl.org/ontology/mo/recorded_as> ?signal . " +
			"?signal <http://purl.org/ontology/mo/published_as> ?track . " +
		"}} " +
		((limit == "inf") ? "" : "LIMIT " + limit);
}

recordsQuery = function(keyword, limit){
	return "SELECT DISTINCT ?record " +
		"WHERE {{ " +
			"?record <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Record> . " +
			"?record <http://purl.org/dc/elements/1.1/title> ?title FILTER regex(LCASE(str(?title)), " + quote(keyword) + ") . " +
		"} " +
		"UNION { " +
			"?record <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Record> . " +
			"?record <http://www.holygoat.co.uk/owl/redwood/0.1/tags/taggedWithTag> ?tag . " +
			"?tag <http://www.holygoat.co.uk/owl/redwood/0.1/tags/tagName> " + quote(keyword) + " . " +
		"} " +
		"UNION { " +
			"?record <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Record> . " +
			"?record <http://purl.org/ontology/mo/track> ?track . " +
			"?track <http://purl.org/dc/elements/1.1/title> ?title FILTER regex(LCASE(str(?title)), " + quote(keyword) + ") . " +
		"} " +
		"UNION { " +
			"?record <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Record> . " +
			"?record <http://xmlns.com/foaf/0.1/maker> ?artist . " +
			"?artist <http://xmlns.com/foaf/0.1/name> ?name FILTER regex(LCASE(str(?name)), " + quote(keyword) + ") . " +
		"}} " +
		((limit == "inf") ? "" : "LIMIT " + limit);
}

genresQuery = function(keyword, limit) {
	return "SELECT DISTINCT ?record " +
		"WHERE { " +
			"?record <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Record> . " +
			"?record <http://www.holygoat.co.uk/owl/redwood/0.1/tags/taggedWithTag> ?tag . " +
			"?tag <http://www.holygoat.co.uk/owl/redwood/0.1/tags/tagName> " + quote(keyword) + " . " +
		"} " +
		((limit == "inf") ? "" : "LIMIT " + limit);
}

artistsQuery = function(keyword, limit) {
	var query = "SELECT DISTINCT ?artist " +
		"WHERE {{ " +
			"?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/MusicArtist> . " +
			"?artist <http://xmlns.com/foaf/0.1/name> ?name FILTER regex(LCASE(str(?name)), " + quote(keyword) + ") . " +
		"} ";

	// check for whitespaces
	if((/\s/g.test(keyword)) == false){
		query += "UNION { " +
			"?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/MusicArtist> . " +
			"?artist <http://xmlns.com/foaf/0.1/homepage> " + tag(keyword) + " . " +
		"} ";
	}

	query += "UNION { " +
			"?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/MusicArtist> . " +
			"?artist <http://xmlns.com/foaf/0.1/made> ?record . " +
			"?record <http://purl.org/ontology/mo/track> ?track . " +
			"?track  <http://purl.org/dc/elements/1.1/title> ?title FILTER regex(LCASE(str(?title)), " + quote(keyword) + ") . " +
		"} " +
		"UNION { " +
			"?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/MusicArtist> . " +
			"?artist <http://purl.org/ontology/mo/biography> ?biography FILTER regex(LCASE(str(?biography)), " + quote(keyword) + ") . " +
		"}} " +
		((limit == "inf") ? "" : "LIMIT " + limit);

	return query;
}

getArtistName = function(artist_uri){
	var sparql_query = "SELECT ?name " +
		"WHERE { " +
			tag(artist_uri) + " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/MusicArtist> . " +
			tag(artist_uri) + " <http://xmlns.com/foaf/0.1/name> ?name . " +
		"} ";

	var results = getQueryResults(sparql_query);
	if(results == null || results.length == 0)
		return "";

	return results[0].name.value;
}

getTrackTitle = function(track_uri){
	var sparql_query = "SELECT ?title " +
		"WHERE { " +
			tag(track_uri) + "<http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Track> . " +
			tag(track_uri) + "<http://purl.org/dc/elements/1.1/title> ?title . " +
		"} ";

	var results = getQueryResults(sparql_query);
	if(results == null || results.length == 0)
		return "";

	return results[0].title.value;
}

getTrackArtistURI = function(track_uri){
	var sparql_query = "SELECT ?artist_uri " +
		"WHERE { " +
			"?record <http://purl.org/ontology/mo/track> " + tag(track_uri) + " . " +
			"?record <http://xmlns.com/foaf/0.1/maker> ?artist_uri . " +
		"} ";

	var results = getQueryResults(sparql_query);
	if(results == null || results.length == 0)
		return "";

	return results[0].artist_uri.value;
}

getRecordTitle = function(record_uri){
	var sparql_query = "SELECT ?title " +
		"WHERE { " +
			tag(record_uri) + " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Record> . " +
			tag(record_uri) + " <http://purl.org/dc/elements/1.1/title> ?title . " +
		"} ";

	var results = getQueryResults(sparql_query);
	if(results == null || results.length == 0)
		return "";

	return results[0].title.value;
}

getTrackRecordURI = function(track_uri){
	var sparql_query = "SELECT ?record_uri " +
		"WHERE { " +
			"?record_uri <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Record> . " +
			"?record_uri <http://purl.org/ontology/mo/track> " + tag(track_uri) + " . " +
		"} ";

	var results = getQueryResults(sparql_query);
	if(results == null || results.length == 0)
		return "";

	return results[0].record_uri.value;
}

runQuery = function(sparql_query){
	try {
		return HTTP.call("GET", "http://localhost:3030/ds/query", {
			params: {
				query: sparql_query,
				format: "json"
			}
		});
	} catch(exception){
		console.log("runQuery exception: ", exception);
		return null;
	}
}

getQueryResults = function(sparql_query){
	var sparql_results = runQuery(sparql_query);
	if(sparql_results == null)
		return null;

	return JSON.parse(sparql_results.content).results.bindings;
}

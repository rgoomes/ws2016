import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

function quote(str){
	return "\"" + str + "\"";
}

function tag(str){
	return "<" + str + ">";
}

function brace(str){
	return "{" + str + "}";
}

function union(str){
	return "UNION " + brace(str);
}

function entityQuery(keyword){
	return "SELECT * " + "WHERE { " + tag(keyword) + " ?p ?o } ";
}

function getID(str){
	return str.replace(/\D/g, '');
}

function getTrackLyrics(track_uri){
	var sparql_query = "SELECT ?text " +
		"WHERE { " +
			"?performance <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Performance> . " +
			"?performance <http://purl.org/NET/c4dm/event.owl#factor> ?lyrics . " +
			"?lyrics <http://purl.org/ontology/mo/text> ?text . " +
			"?performance <http://purl.org/ontology/mo/recorded_as> ?signal . " +
			"?signal <http://purl.org/ontology/mo/published_as> " + tag(track_uri) + " . " +
		"} ";

	var sparql_results = runQuery(sparql_query);
	if(sparql_results == null)
		return "No Lyrics available";

	var results = JSON.parse(sparql_results.content).results.bindings;
	if(results == null || results.length == 0)
		return "No Lyrics available";

	return results[0].text.value;
}

function tracksQuery(keyword, limit){
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

function recordsQuery(keyword, limit){
	return "SELECT DISTINCT ?record " +
		"WHERE {{ " +
			"?record <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Record> . " +
			"?record <http://purl.org/dc/elements/1.1/title> ?title FILTER regex(LCASE(str(?tile)), " + quote(keyword) + ") . " +
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

function genresQuery(keyword, limit) {
	return "SELECT DISTINCT ?record " +
		"WHERE { " +
			"?record <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Record> . " +
			"?record <http://www.holygoat.co.uk/owl/redwood/0.1/tags/taggedWithTag> ?tag . " +
			"?tag <http://www.holygoat.co.uk/owl/redwood/0.1/tags/tagName> " + quote(keyword) + " . " +
		"} " +
		((limit == "inf") ? "" : "LIMIT " + limit);
}

function artistsQuery(keyword, limit) {
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
			"?artist <http://purl.org/ontology/mo/biography> ?biography FILTER regex(str(?biography), " + quote(keyword) + ") . " +
		"}} " +
		((limit == "inf") ? "" : "LIMIT " + limit);

	return query;
}

function getArtistName(artist_uri){
	var sparql_query = "SELECT ?name " +
		"WHERE { " +
			tag(artist_uri) + " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/MusicArtist> . " +
			tag(artist_uri) + " <http://xmlns.com/foaf/0.1/name> ?name . " +
		"} ";
	var sparql_results = runQuery(sparql_query);
	if(sparql_results == null)
		return "";

	var results = JSON.parse(sparql_results.content).results.bindings;
	if(results == null || results.length == 0)
		return "";

	return results[0].name.value;
}

function getTrackArtistURI(track_uri){
	var sparql_query = "SELECT ?artist_uri " +
		"WHERE { " +
			"?record <http://purl.org/ontology/mo/track> " + tag(track_uri) + " . " +
			"?record <http://xmlns.com/foaf/0.1/maker> ?artist_uri . " +
		"} ";
	var sparql_results = runQuery(sparql_query);
	if(sparql_results == null)
		return "";

	var results = JSON.parse(sparql_results.content).results.bindings;
	if(results == null || results.length == 0)
		return "";

	return results[0].artist_uri.value;
}

function getRecordTitle(record_uri){
	var sparql_query = "SELECT ?title " +
		"WHERE { " +
			tag(record_uri) + " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Record> . " +
			tag(record_uri) + " <http://purl.org/dc/elements/1.1/title> ?title . " +
		"} ";
	var sparql_results = runQuery(sparql_query);
	if(sparql_results == null)
		return "";

	var results = JSON.parse(sparql_results.content).results.bindings;
	if(results == null || results.length == 0)
		return "";

	return results[0].title.value;
}

function getTrackRecordURI(track_uri){
	var sparql_query = "SELECT ?record_uri " +
		"WHERE { " +
			"?record_uri <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Record> . " +
			"?record_uri <http://purl.org/ontology/mo/track> " + tag(track_uri) + " . " +
		"} ";
	var sparql_results = runQuery(sparql_query);
	if(sparql_results == null)
		return "";

	var results = JSON.parse(sparql_results.content).results.bindings;
	if(results == null || results.length == 0)
		return "";

	return results[0].record_uri.value;
}

function getTrack(track_uri, load_record){
	var sparql_query = entityQuery(track_uri);
	var sparql_results = runQuery(sparql_query);
	if(sparql_results == null)
		return null;

	var results = JSON.parse(sparql_results.content).results.bindings;
	if(results == null || results.length == 0)
		return null;

	var track = {
		track_id: getID(track_uri),
		number: "", /* Track number */
		lyrics: "No Lyrics available",
		license: "No License",
		artist: "", /* Artist name */
		artist_id: "",
		record: "", /* Record title */
		record_id: "",
	};

	for(var i = 0; i < results.length; i++){
		var pred = results[i].p.value;
		var obj  = results[i].o.value;

		if(pred == "http://purl.org/dc/elements/1.1/title" )
			track.title = obj;
		if(pred == "http://purl.org/ontology/mo/track_number" )
			track.number = obj;
		if(pred == "http://purl.org/ontology/mo/license" )
			track.license = obj;
	}

	// optimize discography loading
	if(load_record == true){
		var record_uri = getTrackRecordURI(track_uri);
		track.record = getRecordTitle(record_uri);
		track.record_id = getID(record_uri);
	}

	var artist_uri = getTrackArtistURI(track_uri);
	track.artist = getArtistName(artist_uri);
	track.artist_id = getID(artist_uri);

	track.lyrics = getTrackLyrics(track_uri);

	return track;
}

function getRecord(record_uri, load_tracks){
	var sparql_query = entityQuery(record_uri);
	var sparql_results = runQuery(sparql_query);
	if(sparql_results == null)
		return null;

	var results = JSON.parse(sparql_results.content).results.bindings;
	if(results == null || results.length == 0)
		return null;

	var record = {
		record_id: getID(record_uri),
		img: "http://placehold.it/150x150?text=No%20Image%0Aavailable",
		title: "",
		type: "", /* Album or Single */
		ntracks: 0, /* Number of tracks */
		tags: [],
		description: "No Description available",
		tracks: [],
		artist: "", /* Artist name */
		artist_id: "",
	};

	var artist_uri = null;

	for(var i = 0; i < results.length; i++){
		var pred = results[i].p.value;
		var obj  = results[i].o.value;

		if(pred == "http://purl.org/dc/elements/1.1/title" )
			record.title = obj;
		if(pred == "http://purl.org/dc/elements/1.1/description" )
			record.description = obj;
		if(pred == "http://xmlns.com/foaf/0.1/maker" )
			artist_uri = obj;
		if(pred == "http://purl.org/ontology/mo/image" ){
			// TODO: load image with the highest resolution
			record.img = obj;
		}
		if(pred == "http://www.holygoat.co.uk/owl/redwood/0.1/tags/taggedWithTag"){
			var parts = obj.split("/");
			var tag = parts[parts.length - 1];
			record.tags.push(tag);
		}
		if(pred == "http://purl.org/ontology/mo/track" ){
			// count tracks
			record.ntracks += 1;

			if(load_tracks == true)
				record.tracks.push(getTrack(obj, false));
		}
	}

	if(artist_uri){
		record.artist = getArtistName(artist_uri);
		record.artist_id = getID(artist_uri);
	}

	record.type = record.ntracks > 1 ? "Album" : "Single";

	return record;
}

function getArtist(artist_uri, load_records){
	var sparql_query = entityQuery(artist_uri);
	var sparql_results = runQuery(sparql_query);
	if(sparql_results == null)
		return null;

	var results = JSON.parse(sparql_results.content).results.bindings;
	if(results == null || results.length == 0)
		return null;

	var artist = {
		artist_id: getID(artist_uri),
		img: "http://placehold.it/150x150?text=No%20Image%0Aavailable",
		name: "",
		homepage: "",
		area: "",
		records: [],
		nrecords: 0, /* Number of records produced */
		biography: "No Biography available",
	};

	for(var i = 0; i < results.length; i++){
		var pred = results[i].p.value;
		var obj  = results[i].o.value;

		if(pred == "http://xmlns.com/foaf/0.1/name" )
			artist.name = obj;
		if(pred == "http://xmlns.com/foaf/0.1/homepage" )
			artist.homepage = obj;
		if(pred == "http://xmlns.com/foaf/0.1/based_near" )
			artist.area = obj;
		if(pred == "http://purl.org/ontology/mo/biography" )
			artist.biography = obj;
		if(pred == "http://purl.org/ontology/mo/image" ){
			// TODO: load image with the highest resolution
			artist.img = obj;
		}
		if(pred == "http://xmlns.com/foaf/0.1/made" ){
			// count records
			artist.nrecords += 1;

			if(load_records == true)
				artist.records.push(getRecord(obj, false));
		}
	}

	// remove invalid jamendo homepages
	if(artist.homepage == "http://no_web" || artist.homepage == "http://www.no-web.com" )
		artist.homepage = "";

	return artist;
}

function parseArtistResults(results){
	var results = JSON.parse(results.content).results.bindings;

	var artists = [];
	for(var i = 0; i < results.length; i++){
		artist_uri = results[i].artist.value;
		artists.push(getArtist(artist_uri, false));
	}

	return artists;
}

function parseRecordResults(results){
	var results = JSON.parse(results.content).results.bindings;

	var records = [];
	for(var i = 0; i < results.length; i++){
		record_uri = results[i].record.value;
		records.push(getRecord(record_uri, false));
	}

	return records;
}

function parseTrackResults(results){
	var results = JSON.parse(results.content).results.bindings;

	var tracks = [];
	for(var i = 0; i < results.length; i++){
		track_uri = results[i].track.value;
		tracks.push(getTrack(track_uri, true));
	}

	return tracks;
}

function parseResults(class_type, results){
	switch(class_type){
		case 'artist':
			return parseArtistResults(results);
		case 'record':
			return parseRecordResults(results);
		case 'track':
			return parseTrackResults(results);
	}
}

function getQuery(keyword, type){
	switch(type){
		case 'artist':
			return artistsQuery(keyword, "inf");
		case 'record':
			return recordsQuery(keyword, "inf");
		case 'track':
			return tracksQuery(keyword, "inf");
		case 'genre':
			return genresQuery(keyword, "inf");
		case 'tag':
			return genresQuery(keyword, "inf");
		default:
			return null;
	}
}

function runQuery(sparql_query){
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

Meteor.methods({
	'search': function(keyword, type, class_type){
		var sparql_query = getQuery(keyword, type);
		if(sparql_query == null)
			return null;

		var results = runQuery(sparql_query);
		if(results == null)
			return null;

		return parseResults(class_type, results);
	},
	'lookup': function(id, class_type){
		var result = null;

		switch(class_type){
			case 'artist':
				return getArtist("http://dbtune.org/jamendo/artist/" + id, true);
			case 'record':
				return getRecord("http://dbtune.org/jamendo/record/" + id, true);
			case 'track':
				return getTrack("http://dbtune.org/jamendo/track/" + id, true);
			default:
				return null;
		}
	},
	'recommendation': function(list, class_type){
		// TODO: integrate recommendation queries
	}
});

Meteor.startup(() => {
	// code to run on server at startup
});

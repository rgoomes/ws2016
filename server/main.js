import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

var no_image = "https://placeholdit.imgix.net/~text?txtsize=20&txt=No+Image%0Aavailable&w=150&h=150&txttrack=0";

function brace(str){
	return "{" + str + "}";
}

function union(str){
	return "UNION " + brace(str);
}

function getID(str){
	return str.replace(/\D/g, '');
}

function getTrack(track_uri, load_record, load_lyrics, load_artist){
	var sparql_query = entityQuery(track_uri);
	var results = getQueryResults(sparql_query);
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

	// don't load the artist when loading track records.
	// records have their artist associated
	if(load_artist == true){
		var artist_uri = getTrackArtistURI(track_uri);
		track.artist = getArtistName(artist_uri);
		track.artist_id = getID(artist_uri);
	}

	// don't load lyrics when searching for tracks and
	// when loading track records
	if(load_lyrics == true)
		track.lyrics = getTrackLyrics(track_uri);

	return track;
}

function getRecord(record_uri, load_tracks){
	var sparql_query = entityQuery(record_uri);
	var results = getQueryResults(sparql_query);
	if(results == null || results.length == 0)
		return null;

	var record = {
		record_id: getID(record_uri),
		img: no_image,
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
		if(pred == "http://purl.org/ontology/mo/image" )
			record.img = obj;
		if(pred == "http://www.holygoat.co.uk/owl/redwood/0.1/tags/taggedWithTag"){
			var parts = obj.split("/");
			var tag = parts[parts.length - 1];
			record.tags.push(tag);
		}
		if(pred == "http://purl.org/ontology/mo/track" ){
			// count tracks
			record.ntracks += 1;

			if(load_tracks == true)
				record.tracks.push(getTrack(obj, false, false, false));
		}
	}

	if(artist_uri){
		record.artist = getArtistName(artist_uri);
		record.artist_id = getID(artist_uri);
	}

	record.type = record.ntracks == 1 ? "Single" : "Album";

	return record;
}

function getArtist(artist_uri, load_records){
	var sparql_query = entityQuery(artist_uri);
	var results = getQueryResults(sparql_query);
	if(results == null || results.length == 0)
		return null;

	var artist = {
		artist_id: getID(artist_uri),
		img: no_image,
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
		if(pred == "http://xmlns.com/foaf/0.1/img" )
			artist.img = obj;
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

function getSearchResults(keyword, type, class_type){
	var sparql_query = getSearchQuery(keyword, type);
	if(sparql_query == null)
		return null;

	var results = getQueryResults(sparql_query);
	if(results == null)
		return null;

	var search_results = [];
	for(var i = 0; i < results.length; i++){
		if(class_type == "artist"){
			var artist_uri = results[i].artist.value;
			search_results.push(getArtist(artist_uri, false));
		}
		else if(class_type == "record"){
			var record_uri = results[i].record.value;
			search_results.push(getRecord(record_uri, false));
		}
		else if(class_type == "track"){
			var track_uri = results[i].track.value;
			search_results.push(getTrack(track_uri, true, false, true));
		}
	}

	return search_results;
}

function getRecordTags(record_uri) {
	var sparql_query = getRecordTagsQuery(record_uri);
	var results = getQueryResults(sparql_query);
	var tags = [];
	for (var i = 0; i < results.length; i++) {
		tags.push(results[i].tag.value)
	}
	return tags;
}

function getArtistTags(artist_uri) {
	var sparql_query = getAllArtistTagsQuery(artist_uri);
	var results = getQueryResults(sparql_query);
	var tags = [];
	for (var i = 0; i < results.length; i++) {
		tags.push(results[i].tag.value)
	}
	return tags;
}

function getAdvancedRecommendationResults(entity_uri, class_type) {
	if (class_type === "record" || class_type === "track") {
		var sparql_query = getAllRecordsQuery()
		if(sparql_query == null)
			return null;

		var results = getQueryResults(sparql_query);
		if(results == null)
			return null;
	}
	else if (class_type === "artist") {
		var sparql_query = getAllArtistsQuery()
		if(sparql_query == null)
			return null;

		var results = getQueryResults(sparql_query);
		if(results == null)
			return null;
	}

	if (class_type === "record")
		var s_tags = getRecordTags(entity_uri);
	else if (class_type === "track") {
		var r = getTrackRecordURI(entity_uri);
		var s_tags = getRecordTags(r);
	}
	else if (class_type === "artist") {
		var s_tags = getArtistTags(entity_uri);
	}

	if (s_tags == null || s_tags.length == 0)
		return getRecommendationResults(entity_uri, class_type);

	var recommendations = []
	var aux = []
	for(var i = 0; i < results.length; i++){
		var rec = {name: "", ref: "", score: 0};

		if(class_type === "artist"){
			var artist_uri = results[i].artist_uri.value;
			if (artist_uri == entity_uri)
				continue;
			var rec_tags = getArtistTags(artist_uri);
			rec.name = getArtistName(artist_uri);
			rec.ref = "/artist/" + getID(artist_uri);
		}
		else if(class_type === "record"){
			var record_uri = results[i].record_uri.value;
			if (record_uri == entity_uri)
				continue;
			var rec_tags = getRecordTags(record_uri);
			rec.name = getRecordTitle(record_uri);
			rec.ref = "/record/" + getID(record_uri);
		}
		else if(class_type === "track"){
			var record_uri = results[i].record_uri.value;
			var rec_tags = getRecordTags(record_uri);
			rec.name = record_uri;
			rec.ref = "/record/" + getID(record_uri);
		}

		var similarity = 0.0;

		for (var j = 0; j < s_tags.length; j++) {
			for(var k = 0; k < rec_tags.length; k++) {
				if (s_tags[j] == rec_tags[k]) {
					similarity += 1;
					break;
				}
			}
		}
		
		rec.score = Math.floor(similarity / s_tags.length * 100);
		if (class_type === "artist" || class_type === "record") {
			recommendations.push(rec);
		}
		else if (class_type === "track") {
			aux.push(rec);
		}
	}

	recommendations.sort(function(a, b){
		return parseFloat(b.score) - parseFloat(a.score);
	});

	if(class_type === "track") {
		aux.sort(function(a, b){
			return parseFloat(b.score) - parseFloat(a.score);
		});
		for (var k = 0; k < 5; k++) {
			var tracks = getQueryResults(getRecordTracksQuery(aux[k].name));
			for (var n = 0; n < tracks.length; n++) {
				var rec = {name: "", ref: "", score: 0};
				rec.name = getTrackTitle(tracks[n].track_uri.value);
				rec.ref = "/track/" + getID(tracks[n].track_uri.value);
				rec.score = aux[k].score;
				if (tracks[n].track_uri.value != entity_uri)
					recommendations.push(rec);
			}
		}
		return recommendations;
	}
	return recommendations.slice(0, 10);
}

function getRecommendationResults(entity_uri, class_type){
	var sparql_query = getRecommendationQuery(entity_uri, class_type);
	if(sparql_query == null)
		return null;

	var results = getQueryResults(sparql_query);
	if(results == null)
		return null;

	var recommendations = []
	for(var i = 0; i < results.length; i++){
		var rec = {name: "", ref: "", score: 0};

		if(class_type === "artist"){
			var artist_uri = results[i].recommended_artist.value;
			rec.name = getArtistName(artist_uri);
			rec.ref = "/artist/" + getID(artist_uri);
		}
		else if(class_type === "record"){
			var record_uri = results[i].recommended_record.value;
			rec.name = getRecordTitle(record_uri);
			rec.ref = "/record/" + getID(record_uri);
		}
		else if(class_type === "track"){
			var track_uri = results[i].recommended_track.value;
			rec.name = getTrackTitle(track_uri);
			rec.ref = "/track/" + getID(track_uri);
		}

		// generating a random number to test sort
		rec.score = Math.floor(Math.random() * 100);

		recommendations.push(rec);
	}

	recommendations.sort(function(a, b){
		return parseFloat(b.score) - parseFloat(a.score);
	});

	// return the top ten recommendations
	return recommendations.slice(0, 10);
}

function getSearchQuery(keyword, type){
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

function getRecommendationQuery(entity_uri, type){
	// increasing this value will result later in a better
	// recommendation system, but will also greatly decrease
	// the performance and responsiveness
	var limit = "100";

	switch(type){
		case 'artist':
			return artistsRecommendationQuery(entity_uri, limit);
		case 'record':
			return recordsRecommendationQuery(entity_uri, limit);
		case 'track':
			return tracksRecommendationQuery(entity_uri, limit);
		default:
			return null;
	}
}

function runDBpediaQuery(query){
	try {
		return HTTP.call("GET", "http://dbpedia.org/sparql", {
			params: {
				query: query,
				format: "json"
			}
		});
	} catch(exception){
		console.log("runDBpediaQuery exception: ", exception);
		return null;
	}
}

function getAboutDBpediaQuery(keyword, values){
	var query = "select distinct ?p where {";

	for(var i = 0; i < values.length; i++){
		var match = "?p ?o <http://dbpedia.org/ontology/" + values[i] + "> . " +
			"?p <http://www.w3.org/2000/01/rdf-schema#label> ?g . " +
			"FILTER((LANG(?g) = \"\" || LANGMATCHES(LANG(?g), \"en\")) && (lcase(str(?g)) = \"" + keyword + "\" || lcase(str(?g)) = \"" + keyword + " (" + values[i].toLowerCase() + ")\"))";

		if(i == 0)
			query += brace(match);
		else
			query += union(match);
	}

	query += "} LIMIT 1";
	return query;
}

function getSemanticType(keyword, class_type){
	if(class_type === "record"){
		console.log("Searching DBpedia for genres..");
		var query = "select distinct ?p where {" +
			"?p <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://dbpedia.org/ontology/MusicGenre> . " +
			"?p <http://www.w3.org/2000/01/rdf-schema#label> ?g . " +
			"FILTER((LANG(?g) = \"\" || LANGMATCHES(LANG(?g), \"en\")) && (lcase(str(?g)) = \"" + keyword + "\" || lcase(str(?g)) = \"" + keyword + " music\"))" +
		"} LIMIT 1";
		var res = runDBpediaQuery(query);
		if(JSON.parse(res.content).results.bindings.length){
			console.log("genre", JSON.parse(res.content).results.bindings[0].p.value);
			return "genre";
		} else {
			console.log("No results found for genre!");
		}

		console.log("Searching DBpedia for records..");
		var query = getAboutDBpediaQuery(keyword, ["Album", "Single"]);
		var res = runDBpediaQuery(query);
		if(JSON.parse(res.content).results.bindings.length){
			console.log("record", JSON.parse(res.content).results.bindings[0].p.value);
			return "record";
		} else {
			console.log("No results found for records!");
			return null;
		}
	}

	if(class_type === "artist"){
		console.log("Searching DBpedia for artists..");
		var query = getAboutDBpediaQuery(keyword, ["Band", "MusicalArtist"]);
		var res = runDBpediaQuery(query);
		if(JSON.parse(res.content).results.bindings.length){
			console.log("artist", JSON.parse(res.content).results.bindings[0].p.value);
			return "artist";
		} else {
			console.log("No results found for artists!");
			return null;
		}
	}

	if(class_type === "track"){
		console.log("Searching DBpedia for tracks..");
		var query = getAboutDBpediaQuery(keyword, ["Song", "Work"]);
		var res = runDBpediaQuery(query);
		if(JSON.parse(res.content).results.bindings.length){
			console.log("track", JSON.parse(res.content).results.bindings[0].p.value);
			return "track";
		} else {
			console.log("No results found for songs!");
			return null;
		}
	}

	return null;
}

Meteor.methods({
	'search': function(keyword, type, class_type){
		this.unblock();
		return getSearchResults(keyword, type, class_type);
	},
	'recommendation': function(entity_uri, class_type){
		return getAdvancedRecommendationResults(entity_uri, class_type);
	},
	'lookup': function(uri, class_type){
		this.unblock();
		switch(class_type){
			case 'artist':
				return getArtist(uri, true);
			case 'record':
				return getRecord(uri, true);
			case 'track':
				return getTrack(uri, true, true, true);
			default:
				return null;
		}
	},
	'semantic_search': function(keyword, class_type){
		this.unblock();
		return getSemanticType(keyword, class_type);
	},
});

Meteor.startup(() => {
	// code to run on server at startup
});

import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

var no_image = "https://placeholdit.imgix.net/~text?txtsize=20&txt=No+Image%0Aavailable&w=150&h=150&txttrack=0";

function getID(str){
	return str.replace(/\D/g, '');
}

function getTrack(track_uri, load_record){
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

	var artist_uri = getTrackArtistURI(track_uri);
	track.artist = getArtistName(artist_uri);
	track.artist_id = getID(artist_uri);

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
			search_results.push(getTrack(track_uri, true));
		}
	}

	return search_results;
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

		// TODO: advanced recommendation
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
	switch(type){
		case 'artist':
			return artistsRecommendationQuery(entity_uri, "100");
		case 'record':
			return recordsRecommendationQuery(entity_uri, "100");
		case 'track':
			return tracksRecommendationQuery(entity_uri, "100");
		default:
			return null;
	}
}

Meteor.methods({
	'search': function(keyword, type, class_type){
		console.log("********")
		console.log(type)
		console.log(class_type)
		console.log(keyword)
		return getSearchResults(keyword, type, class_type);
	},
	'recommendation': function(entity_uri, class_type){
		return getRecommendationResults(entity_uri, class_type);
	},
	'lookup': function(uri, class_type){
		switch(class_type){
			case 'artist':
				return getArtist(uri, true);
			case 'record':
				return getRecord(uri, true);
			case 'track':
				return getTrack(uri, true);
			default:
				return null;
		}
	},
	'semantic_search': function(keyword){
		console.log(keyword)
		var query = "select distinct ?p where {\
					?p <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://dbpedia.org/ontology/MusicGenre> . \
					?p <http://www.w3.org/2000/01/rdf-schema#label> ?g . \
					FILTER((LANG(?g) = \"\" || LANGMATCHES(LANG(?g), \"en\")) && (lcase(str(?g)) = \"" + keyword.toLowerCase() + "\"))\
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
					FILTER((LANG(?g) = \"\" || LANGMATCHES(LANG(?g), \"en\")) && (lcase(str(?g)) = \"" + keyword.toLowerCase() + "\"))\
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
				FILTER((LANG(?n) = \"\" || LANGMATCHES(LANG(?n), \"en\")) && (lcase(str(?n)) = \"" + keyword.toLowerCase() + "\"))\
				}";
		var res = HTTP.call("GET", "http://dbpedia.org/sparql", {
			params: {
				'query': query,
				'format': "json"
			}
		});
		try {
			console.log(JSON.parse(res.content).results.bindings[0].p.value);
			return "artist";
		} catch (err) {
			var query_ = "select distinct ?p where {\
						?p ?o <http://dbpedia.org/ontology/MusicalArtist> . \
						?p <http://www.w3.org/2000/01/rdf-schema#label> ?n . \
						FILTER((LANG(?n) = \"\" || LANGMATCHES(LANG(?n), \"en\")) && (lcase(str(?n)) = \"" + keyword.toLowerCase() + "\"))\
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
				FILTER((LANG(?n) = \"\" || LANGMATCHES(LANG(?n), \"en\")) && (lcase(str(?n)) = \"" + keyword.toLowerCase() + "\"))\
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
			return null;
		}
	},
});

Meteor.startup(() => {
	// code to run on server at startup
});

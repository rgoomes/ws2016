
public class QueryGenerator {
	
	public static String quote(String str){
		return "\"" + str + "\"";
	}
	
	public static String tracksQuery(String keyword, String limit) {
		return
			"SELECT ?track " +
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
				"?description <http://purl.org/NET/c4dm/event.owl#factor> ?lyrics . " +
				"?lyrics <http://purl.org/ontology/mo/text> ?text FILTER regex(LCASE(str(?text)), " + quote(keyword) + ") . " +
				"?description <http://purl.org/ontology/mo/recorded_as> ?signal . " +
				"?signal <http://purl.org/ontology/mo/published_as> ?track . " +
			"}} " + 
			(limit.equals("inf") ? "" : "LIMIT " + limit);
	}
	
	public static String recordsQuery(String keyword, String limit) {
		return
			"SELECT DISTINCT ?record " + 
			"WHERE {{ " +
				"?record <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Record> . " +
				"?record <http://purl.org/dc/elements/1.1/title> ?title FILTER regex(LCASE(str(?tile)), " + quote(keyword) + ") . " +
			"} " +
			"UNION { " + 
				"?record <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Record> . " +
				"?record <http://www.holygoat.co.uk/owl/redwood/0.1/tags/taggedWithTag> " + "<http://dbtune.org/jamendo/tag/" + keyword + "> . " +
			"} " +
			"UNION { " +
				"?record <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Record> . " +
				"?record <http://xmlns.com/foaf/0.1/maker> ?artist . " +
				"?artist <http://xmlns.com/foaf/0.1/name> ?name FILTER regex(LCASE(str(?name)), " + quote(keyword) + ") . " +
			"}} " +
			(limit.equals("inf") ? "" : "LIMIT " + limit);
	}
	
	public static String genresQuery(String keyword, String limit) {
		return
			"SELECT DISTINCT ?record " +
			"WHERE { " +
				"?record <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Record> . " +
				"?record <http://www.holygoat.co.uk/owl/redwood/0.1/tags/taggedWithTag> <http://dbtune.org/jamendo/tag/" + keyword + "> . " +
			"} " + 
			(limit.equals("inf") ? "" : "LIMIT " + limit);
	}
	
	public static String artistsQuery(String keyword, String limit) {
		return
			"SELECT DISTINCT ?artist " + 
			"WHERE {{ " +
				"?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/MusicArtist> . " +
				"?artist <http://xmlns.com/foaf/0.1/name> " + quote(keyword) + " . " + 
			"} " + 
			"UNION { " + 
				"?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/MusicArtist> . " + 
				"?artist <http://xmlns.com/foaf/0.1/homepage> <" + keyword +  "> . " +
			"} " +
			"UNION { " + 
				"?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/MusicArtist> . " +
				"?artist <http://purl.org/ontology/mo/biography> ?biography FILTER regex(str(?biography), " + quote(keyword) + ") . " +
			"}} " +
			(limit.equals("inf") ? "" : "LIMIT " + limit);
	}
	
}

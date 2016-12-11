import java.util.regex.*;

public class QueryGenerator {

	public static String quote(String str){
		return "\"" + str + "\"";
	}

	public static String tag(String str){
		return "<" + str + ">";
	}

	public static String brace(String str){
		return "{" + str + "}";
	}

	public static String union(String str){
		return "UNION " + brace(str);
	}

	public static String getEntity(String keyword){
		return "SELECT * " + "WHERE { " + tag(keyword) + " ?predicate ?object } ";
	}

	public static String recordsRecommendationQuery(String [] records, String limit) {
		String query =
			"SELECT DISTINCT ?recommended_record " +
			"WHERE {";

		for(int i = 0; i < records.length; i++){
			String match =
				tag(records[i]) + " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Record> . " +
				tag(records[i]) + " <http://xmlns.com/foaf/0.1/maker> ?artist" + Integer.toString(i+1) +  " . " +
				"?artist" + Integer.toString(i+1) + " <http://xmlns.com/foaf/0.1/made> ?recommended_record FILTER(?recommended_record != " + tag(records[i]) + " ) . ";

			if(i == 0)
				query += " " + brace(match) + " ";
			else
				query += " " + union(match) + " ";
		}

		query += "} " + (limit.equals("inf") ? "" : "LIMIT " + limit);
		return query;
	}

	public static String tracksRecommendationQuery(String [] tracks, String limit) {
		String query =
			"SELECT DISTINCT ?recommended_track " +
			"WHERE {";

		for(int i = 0; i < tracks.length; i++){
			String match =
				tag(tracks[i]) + " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Track> . " +
				"?record" + Integer.toString(i+1) + " <http://purl.org/ontology/mo/track> " + tag(tracks[i]) + " . " +
				"?record" + Integer.toString(i+1) + " <http://purl.org/ontology/mo/track> ?recommended_track FILTER(?recommended_track != " + tag(tracks[i]) + " ) . ";

			if(i == 0)
				query += " " + brace(match) + " ";
			else
				query += " " + union(match) + " ";
		}

		query += "} " + (limit.equals("inf") ? "" : "LIMIT " + limit);
		return query;
	}

	public static String artistsRecommendationQuery(String [] artists, String limit) {
		// TODO
		return null;
	}

	public static String tracksQuery(String keyword, String limit) {
		return
			"SELECT DISTINCT ?track " +
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
			(limit.equals("inf") ? "" : "LIMIT " + limit);
	}

	public static String genresQuery(String keyword, String limit) {
		return
			"SELECT DISTINCT ?record " +
			"WHERE { " +
				"?record <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Record> . " +
				"?record <http://www.holygoat.co.uk/owl/redwood/0.1/tags/taggedWithTag> ?tag . " +
				"?tag <http://www.holygoat.co.uk/owl/redwood/0.1/tags/tagName> " + quote(keyword) + " . " +
			"} " +
			(limit.equals("inf") ? "" : "LIMIT " + limit);
	}

	public static String lyricsQuery(String keyword){
		return
			"SELECT ?text " +
			"WHERE { " +
				"?performance <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Performance> . " +
				"?performance <http://purl.org/NET/c4dm/event.owl#factor> ?lyrics . " +
				"?lyrics <http://purl.org/ontology/mo/text> ?text . " +
				"?performance <http://purl.org/ontology/mo/recorded_as> ?signal . " +
				"?signal <http://purl.org/ontology/mo/published_as> " + tag(keyword) + " . " +
			"} ";
	}

	public static String artistsQuery(String keyword, String limit) {
		String query =
			"SELECT DISTINCT ?artist " +
			"WHERE {{ " +
				"?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/MusicArtist> . " +
				"?artist <http://xmlns.com/foaf/0.1/name> ?name FILTER regex(LCASE(str(?name)), " + quote(keyword) + ") . " +
			"} ";

		Pattern pattern = Pattern.compile("\\s");
		Matcher matcher = pattern.matcher(keyword);
		boolean whitespacesFound = matcher.find();

		// whitespaces are not valid in fields that are not of the type string
		// without this sparql complains and returns an exception
		if(!whitespacesFound){
			query +=
				"UNION { " +
					"?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/MusicArtist> . " +
					"?artist <http://xmlns.com/foaf/0.1/homepage> " + tag(keyword) + " . " +
				"} ";
		}

		query +=
			"UNION { " +
				"?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/MusicArtist> . " +
				"?artist <http://xmlns.com/foaf/0.1/made> ?record . " +
				"?record <http://purl.org/ontology/mo/track> ?track . " +
				"?track  <http://purl.org/dc/elements/1.1/title> ?title FILTER regex(LCASE(str(?title)), " + quote(keyword) + ") . " +
			"} " +
			"UNION { " +
				"?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/MusicArtist> . " +
				"?artist <http://purl.org/ontology/mo/biography> ?biography FILTER regex(str(?biography), " + quote(keyword) + ") . " +
			"}} " +
			(limit.equals("inf") ? "" : "LIMIT " + limit);

		return query;
	}

}

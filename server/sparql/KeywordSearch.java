import java.util.Scanner;
import java.util.Arrays;
import java.util.stream.Collectors;

import org.apache.jena.query.Query;
import org.apache.jena.query.QueryExecution;
import org.apache.jena.query.QueryExecutionFactory;
import org.apache.jena.query.QueryFactory;
import org.apache.jena.query.QuerySolution;
import org.apache.jena.query.ResultSet;
import org.apache.jena.rdf.model.*;

public class KeywordSearch extends Object {

	static Scanner sc = new Scanner(System.in);
	static Model model = ModelFactory.createDefaultModel();

	public static void run_query(String query, String[] columns){
		if(query == null)
			return;

		Query qry = QueryFactory.create(query);
		QueryExecution qe = QueryExecutionFactory.create(qry, model);
		ResultSet rs = qe.execSelect();
		int nresults = 0;

		while(rs.hasNext()) {
			nresults++;
			QuerySolution sol = rs.nextSolution();

			for(String col : columns){
				RDFNode node = sol.get(col);
				System.out.print(node.toString() + "\t");
			}

			System.out.println("");
		}

		System.out.println("jena: search got " + nresults + " results");
	}

	public static void parse_input(String[] keywords) {
		if(keywords.length < 2)
			return;

		String limit = keywords[keywords.length - 1];
		String[] slice = Arrays.copyOfRange(keywords, 1, keywords.length - 1);
		String search_keywords = Arrays.stream(slice).collect(Collectors.joining(" ")).toLowerCase();

		if(keywords[0].equals("tracks")){
			String query = QueryGenerator.tracksQuery(search_keywords, limit);
			run_query(query, new String[] {"track"});
		}
		else if(keywords[0].equals("artists")){
			String query = QueryGenerator.artistsQuery(search_keywords, limit);
			run_query(query, new String[] {"artist"});
		}
		else if(keywords[0].equals("records")){
			String query = QueryGenerator.recordsQuery(search_keywords, limit);
			run_query(query, new String[] {"record"});
		}
		else if(keywords[0].equals("genres")){
			String query = QueryGenerator.genresQuery(search_keywords, limit);
			run_query(query, new String[] {"record"});
		}
		else if(keywords[0].equals("track") || keywords[0].equals("artist") || keywords[0].equals("record")){
			String query = QueryGenerator.getEntity(search_keywords + limit);
			run_query(query, new String[] {"predicate", "object"});
		}
		else if(keywords[0].equals("lyric")){
			String query = QueryGenerator.lyricsQuery(search_keywords + limit);
			run_query(query, new String[] {"text"});
		}

		else if(keywords[0].equals("recordsrec")){
			String query = QueryGenerator.recordsRecommendationQuery(slice, limit);
			run_query(query, new String[] {"recommended_record"});
		}
		else if(keywords[0].equals("tracksrec")){
			String query = QueryGenerator.tracksRecommendationQuery(slice, limit);
			run_query(query, new String[] {"recommended_track"});
		}
		else if(keywords[0].equals("artistsrec")){
			String query = QueryGenerator.artistsRecommendationQuery(slice, limit);
			run_query(query, new String[] {"recommended_artist"});
		}
	}

	public static void main(String args[]) {
		model.read("../ontology/database/clean_jamendo.ttl", "TURTLE");
		System.out.println("jena: Model loaded " + model.size() + " triples");

		while(true) {
			System.out.print(">>> ");
			String req = sc.nextLine();
			String[] words = req.split(" ");

			try {
				parse_input(words);
			} catch(Exception e){}
		}
	}
}

import java.util.Scanner;

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
	
	public static void run_query(String query, String column){
		Query qry = QueryFactory.create(query);
		QueryExecution qe = QueryExecutionFactory.create(qry, model);
		ResultSet rs = qe.execSelect();
		
		while(rs.hasNext()) {
			QuerySolution sol = rs.nextSolution();
			RDFNode s = sol.get(column);
			System.out.println(s.toString());
		}
	}

	public static void parse_input(String[] keywords) {
		String search_keywords = "";
		for(int i = 1; i < keywords.length - 1; i++)
			search_keywords += keywords[i] + (i == keywords.length - 2 ? "" : " ");

		String limit = keywords[keywords.length - 1];

		if(keywords[0].equals("tracks")){
			String query = QueryGenerator.tracksQuery(search_keywords, limit);
			run_query(query, "track");
		}
		else if(keywords[0].equals("artists")){
			String query = QueryGenerator.artistsQuery(search_keywords, limit);
			run_query(query, "artist");
		}
		else if(keywords[0].equals("records")){
			String query = QueryGenerator.recordsQuery(search_keywords, limit);
			run_query(query, "record");
		}
		else if(keywords[0].equals("genres")){
			String query = QueryGenerator.genresQuery(search_keywords, limit);
			run_query(query, "record");
		}
		else {
			
		}
	}

	public static void main(String args[]) {
		model.read("clean_jamendo.ttl", "TURTLE") ;
		
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

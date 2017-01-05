# ws2016
Project for the Web Semantic course

### Instructions for installing and running the project
```
1. Install Meteor: https://www.meteor.com/install
2. Change directory to the project directory 
3. Run Meteor with command: meteor run
4. Download Fuseki: https://jena.apache.org/documentation/serving_data/#download-fuseki1
5. Unpack the downloaded file
6. Change directory to the extracted file 
7. Run Fuseki server with command: ./fuseki-server --update --mem /ds
8. Load N-Triples database into Fuseki with command: ./s-put http://localhost:3030/ds/data default "full path to db.nt"
9. The project path of the N-Triples file is: "server/ontology/database/db.nt"
10. Open your favorite browser
11. Navigate to URL http://localhost:3000
```

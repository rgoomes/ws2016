import requests

#Artist: name, homepage(url), area, imagem, biography = name, url, ?, image, bio 
#Records: title, description, image, number of tracks, tags = name, (wiki), ..., image, ..., (tags)
#tracks: title, track number, lyrics, license = (name), (usar um counter), ?, ?

artists = ['Eminem', 'Bon Jovi', 'Deadmau5', 'No Doubt', 'The Doors', 'Red Hot Chili Peppers', 'The Verve', 'Hans Zimmer', 'AC/DC', 'Rolling Stones']
tag_list = []

a_link = "<http://dbtune.org/jamendo/artist/"
r_link = "<http://dbtune.org/jamendo/record/"
t_link = "<http://dbtune.org/jamendo/track/"

def write_artist(f, a_id, name, url, img, bio):
	f.write(a_link + str(a_id) + "> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/MusicArtist> .\n")
	f.write(a_link + str(a_id) + "> <http://xmlns.com/foaf/0.1/homepage> <" + url.encode('utf-8') + "> .\n")
	f.write(a_link + str(a_id) + "> <http://xmlns.com/foaf/0.1/img> <" + img.encode('utf-8') + "> .\n")
	f.write(a_link + str(a_id) + "> <http://xmlns.com/foaf/0.1/name> \"" + name.replace("\"", "").encode('utf-8') + "\"^^<http://www.w3.org/2001/XMLSchema#string> .\n")
	f.write(a_link + str(a_id) + "> <http://purl.org/ontology/mo/biography> \"" +  bio.replace("\"", "").replace("\n", "\\n").encode('utf-8') + "\"^^<http://www.w3.org/2001/XMLSchema#string> .\n")

def write_record(f, a_id, r_id, title, description, img, tags):
	f.write(a_link + str(a_id) + "> <http://xmlns.com/foaf/0.1/made> " + r_link + str(r_id) + "> .\n")
	f.write(r_link + str(r_id) + "> <http://xmlns.com/foaf/0.1/maker> " + a_link + str(a_id) + "> .\n")
	f.write(r_link + str(r_id) + "> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Record> .\n")
	f.write(r_link + str(r_id) + "> <http://purl.org/dc/elements/1.1/title> \"" + title.replace("\"", "").encode('utf-8') + "\"^^<http://www.w3.org/2001/XMLSchema#string> .\n")
	if img != '':
		f.write(r_link + str(r_id) + "> <http://purl.org/ontology/mo/image> " + "<" + img.encode('utf-8') + "> .\n")
	if description != '':
		f.write(r_link + str(r_id) + "> <http://purl.org/dc/elements/1.1/description> \"" + description.replace("\"", "").replace("\n", "\\n").encode('utf-8') + "\"^^<http://www.w3.org/2001/XMLSchema#string> .\n")
	for t in tags:
		f.write(r_link + str(r_id) + "> <http://www.holygoat.co.uk/owl/redwood/0.1/tags/taggedWithTag> <http://dbtune.org/jamendo/tag/" + t['name'].lower().replace(' ', '-') + "> .\n")
		if t['name'].replace(' ', '-') not in tag_list:
			tag_list.append(t['name'].lower().replace(' ', '-'))

def write_track(f, r_id, t_id, name, track_number):
	f.write(r_link + str(r_id) + "> <http://purl.org/ontology/mo/track> " + t_link + str(t_id) + "> .\n")
	f.write(t_link + str(t_id) + "> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/Track> .\n")
	f.write(t_link + str(t_id) + "> <http://purl.org/dc/elements/1.1/title> \"" + name.replace("\"", "").encode('utf-8') + "\"^^<http://www.w3.org/2001/XMLSchema#string> .\n")
	f.write(t_link + str(t_id) + "> <http://purl.org/ontology/mo/track_number> \"" + str(track_number) + "\"^^<http://www.w3.org/2001/XMLSchema#int> .\n")

def write_tags(f):
	for t in tag_list:
		f.write("<http://dbtune.org/jamendo/tag/" + t + "> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.holygoat.co.uk/owl/redwood/0.1/tags/Tag> .\n")
		f.write("<http://dbtune.org/jamendo/tag/" + t + "> <http://www.holygoat.co.uk/owl/redwood/0.1/tags/tagName> \"" + t + "\"^^<http://www.w3.org/2001/XMLSchema#string> .\n")

def get_data():
	artist_id = 9000000
	record_id = 9000000
	track_id = 9000000
	file = open("new.nt", "w")
	for a in artists:
		print(a)
		params = {
			'method': 'artist.getInfo',
			'artist': a,
			'api_key': '',
			'format': 'json'
		}
		r = requests.get('http://ws.audioscrobbler.com/2.0/', params=params)
		write_artist(file, artist_id, r.json()['artist']['name'], r.json()['artist']['url'], r.json()['artist']['image'][3]['#text'], r.json()['artist']['bio']['content'])

		params = {
			'method': 'artist.getTopAlbums',
			'artist': a,
			'api_key': '',
			'format': 'json'
		}
		r = requests.get('http://ws.audioscrobbler.com/2.0/', params=params)

		for album in r.json()['topalbums']['album']:
			params = {
				'method': 'album.getInfo',
				'artist': album['artist']['name'],
				'album': album['name'],
				'api_key': '',
				'format': 'json'
			}
			r2 = requests.get('http://ws.audioscrobbler.com/2.0/', params=params)
			if len(r2.json()['album']['tracks']['track']) != 0:
				try:
					desc = r2.json()['album']['wiki']['content']
				except: 
					desc = ''
				write_record(file, artist_id, record_id, album['name'], desc, r2.json()['album']['image'][3]['#text'], r2.json()['album']['tags']['tag'])
				track_counter = 1
				print(album['name'] + ": " + str(len(r2.json()['album']['tracks']['track'])) + " tracks")
				for i in r2.json()['album']['tracks']['track']:
					write_track(file, record_id, track_id, i['name'], track_counter)
					track_counter += 1
					track_id += 1
				record_id += 1
		artist_id += 1
	write_tags(file)

if __name__ == '__main__':
	get_data()
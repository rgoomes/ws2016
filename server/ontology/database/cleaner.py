#!/usr/bin/env python
# -*- coding: utf-8 -*-

class Cleaner:
	def __init__(self):
		self.performances = {}
		
	def untag(self, string):
		return string[1:-1]
		
	def insert_mo_performance_type(self, triple):
		resource = self.untag(triple[0])
		performance = resource.split('/')
		performance_id = int(performance[-1])
		if performance_id not in self.performances:
			self.performances[performance_id] = True
			print triple[0], "<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>", "<http://purl.org/ontology/mo/Performance> .\n",

	def triple_isvalid(self, triple):
		if triple[1] == "<http://purl.org/ontology/mo/time>":
			return False
		if "interval/" in triple[0]:
			return False
		if triple[1] == "<http://purl.org/ontology/mo/available_as>":
			return False
		if triple[2] == "<http://purl.org/ontology/mo/Playlist>":
			return False
		if triple[1] == "<http://purl.org/dc/elements/1.1/format>":
			return False
		if triple[2] == "<http://purl.org/ontology/mo/Torrent>":
			return False
		if triple[2] == "<http://purl.org/ontology/mo/ED2K>":
			return False

		return True

	def clean_dataset(self):
		with open("jamendo.nt") as f:
			for l in f:
				triple = l.split()
				
				if self.triple_isvalid(triple):
					if "http://dbtune.org/jamendo/performance/" in triple[0]:
						self.insert_mo_performance_type(triple)

					print l,
	
def main():
	c = Cleaner()
	c.clean_dataset()

main()

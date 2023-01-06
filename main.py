#!/usr/bin/env python
# encoding: utf-8
import json
from flask import Flask, jsonify, request
from flask_cors import CORS
import pymongo
from bson.json_util import ObjectId

myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["geospatial"]
mycol = mydb["shapes"]

class MyEncoder(json.JSONEncoder):

    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        return super(MyEncoder, self).default(obj)

app = Flask(__name__)
app.json_encoder = MyEncoder
app.json_decoder = MyEncoder
CORS(app)

@app.route('/', methods=['GET'])
def index():
    element = mycol.find_one()

    return element

@app.route('/addshape', methods=['POST'])
def adddhape():
    record = json.loads(request.data)
    mycol.insert_one(record)
    return record

@app.route('/update', methods=['PUT'])
def update():
    record = json.loads(request.data)
    print(record)
    result = mycol.update_one(
             {"_id": ObjectId( record.pop('_id', None))},
             {"$set":
                 record
             })

    return str(result.modified_count)

@app.route('/delete', methods=['DELETE'])
def delete():
    record = json.loads(request.data)
    mycol.delete_one(record)


app.run()
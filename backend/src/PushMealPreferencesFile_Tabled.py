from flask import Flask, request, jsonify, Blueprint
import boto3
import logging

food_preferences_bp = Blueprint('food_preferences', __name__)
logging.basicConfig(level=logging.DEBUG)

dynamodb = boto3.resource('dynamodb', region_name='eu-north-1')
table_name = "food_preferences"

dynamodb_w = boto3.resource('dynamodb', region_name='eu-west-1')
session_table = dynamodb_w.Table('UserSessions')

def get_table():
    return dynamodb.Table(table_name)

@food_preferences_bp.route("/add_food_preferences", methods=["POST"])
def add_food_preferences():
    try:
        data = request.get_json()
        session_id = data['sessionId']
        food_id = data['food_id']
        is_liked = data['is_liked']

        logging.info(f"Received data: food_id={food_id}, is_liked={is_liked}")

        #validating session id for session management 
        if not session_id:
            logging.error("Must provide session id")
            return jsonify({"error":"Must provide session id"}), 400     
            
        resp = session_table.get_item(Key = {'sessionId':session_id})
        if 'Item' not in resp:
            logging.error("Invalid session id")
            return jsonify({"error":"Invalid session id"}), 400      
        user_id = resp['Item'].get('userId')   

        # Check correct data inputted
        if not food_id or is_liked is None: #return error if wrong data put in
            logging.error("Invalid input data")
            return jsonify({"error":"Invalid input data"}), 400

        table = dynamodb.Table(table_name)

        response = table.put_item(Item={ #posts data to aws table
            'user_id': user_id,
            'food_id': food_id,
            'is_liked': is_liked
        })

        logging.info(f"DynamoDB Response: {response}")
        return jsonify({"output":"Food preference logged"}), 201 #confirm logged

    except Exception as e:
        logging.error(f"Error adding food preference: {e}", exc_info=True) #error message for debugging
        return jsonify({"error"}), 500



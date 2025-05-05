from flask import Flask, request, jsonify, Blueprint
from flask_login import current_user, login_required
import boto3
import logging

user_preferences_bp = Blueprint('user_preferences', __name__)
logging.basicConfig(level=logging.DEBUG)

dynamodb = boto3.resource('dynamodb', region_name='eu-north-1') 
table_name = "user_preferences"

dynamodb_w = boto3.resource('dynamodb', region_name='eu-west-1') 
sessions_table = dynamodb_w.Table('UserSessions')


def get_table():
    return dynamodb.Table(table_name)

@user_preferences_bp.route("/add_user_preferences", methods=["POST"])
def add_user_preferences():
    try:
        #Include the following parameters: diet, budget,
        #cuisines, allergens, kitchen equipment, number of people and notification options.

        data = request.get_json()

        #retrieving user id from session management 
        sessionID = data.get('sessionId')

        if not sessionID:
            logging.error("Session ID is missing from request")
            return jsonify({"error": "Must provide session id"}), 401
        
        resp = sessions_table.get_item(Key={'sessionId':sessionID})
        if 'Item' not in resp:
            logging.error(f"Invalid session ID: {sessionID}")
            return jsonify({"error": "Invalid session id"}), 401
  
        user_id = resp['Item']['userId']  
        if not user_id:
            return jsonify({"error": "Could not find user"}), 400

        diet = data.get('diet')
        budget= data.get('budget')
        cuisines  = data.get('cuisines')
        allergens = data.get('allergens')
        kitchen_equipment = data.get('kitchen_equipment')
        number_of_people = (data.get('number_of_people'))
        notification_options = data.get('notification_options')
        fitbit_access_token = data.get('fitbit_access_token')

        if number_of_people is None or not number_of_people.isdigit():
            return jsonify({"error": "Invalid number_of_people, must be an integer"}), 400 #convert to int

        number_of_people = int(number_of_people)

        logging.info(f"Received data: diet={diet},budget={budget},"
                     f" cuisines={cuisines}, allergens={allergens}, kitchen_equipment={kitchen_equipment},"
                     f" number_of_people={number_of_people}, notification_options={notification_options}")

        if (not diet or not budget or not cuisines or not allergens or not kitchen_equipment
                or not number_of_people or not notification_options):
            logging.error("Invalid input data")
            return jsonify({"error": "Invalid input data"}), 400

        table = dynamodb.Table(table_name)
        response = table.put_item(Item={  # posts
        'user_id': user_id,
        'diet': diet,
        'budget': budget,
        'cuisines': cuisines,
        'allergens': allergens,
        'kitchen_equipment': kitchen_equipment,
        'number_of_people': number_of_people,
        'notification_options': notification_options,
        'fitbit_access_token': fitbit_access_token
        })

        logging.info(f"DynamoDB Response: {response}")
        return jsonify({"output": "User preferences logged"}), 201  # confirm logged

    except Exception as e:
        logging.error(f"Error adding user preference: {e}", exc_info=True)  # error message for debugging
        return jsonify({"error": "An unexpected error occurred"}), 500

def retrieve_user_pref(user_id):
    #retrieve items from DB 
    table = get_table()

    response = table.get_item(Key={'user_id':user_id})
    
    # Check if the item exists
    if 'Item' in response:
        return response['Item'] 
    else:
        return []

def retrieve_access_token(user_id):
    #retrieve items from DB 
    table = get_table()

    response = table.get_item(Key={'user_id':user_id})
    
    # Check if the item exists
    if 'Item' in response:
        return response['Item'].get('fitbit_access_token', "")
    else:
        return ""


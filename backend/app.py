import boto3
import json
from flask import Flask, render_template, redirect, url_for, request, flash, jsonify
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
import awsgi
from flask_cors import CORS
from flask.sessions import SessionInterface, SessionMixin
import time
import hashlib

from src.user_preferences_bp import user_preferences_bp  # Import the Blueprint from user_preferences
from src.openai import recipe_blueprint  # Import the blueprint from gemini.py
from src.openai import picture_blueprint
from src.PushMealPreferencesFile_Tabled import food_preferences_bp  # Import the Blueprint from food_preferences



app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key' 
CORS(app)

app.register_blueprint(user_preferences_bp) #reg bp for user preferences
app.register_blueprint(recipe_blueprint) #register blueprint
app.register_blueprint(picture_blueprint)
app.register_blueprint(food_preferences_bp)

dynamodb = boto3.resource('dynamodb', region_name='eu-west-1')  
users_table = dynamodb.Table('Users')  

#table for user sessions 
sessions_table = dynamodb.Table('UserSessions')

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

#defining dynamoDBSession
class DynamoDBSession(dict, SessionMixin):
    def __init__(self, session_id=None, user_id=None):
        self.session_id = session_id or hashlib.sha256(f"{uuid.uuid4()}{time.time()}".encode()).hexdigest()
        self.user_id = user_id
        self.modified = False
        super(DynamoDBSession, self).__init__()

class User(UserMixin):
    def __init__(self, username, password, user_id):
        self.username = username
        self.password = password
        self.id = user_id

@login_manager.user_loader
def load_user(user_id):
    try:
        response = users_table.get_item(Key={'username': user_id})
        user_data = response.get('Item')
        if user_data:
            return User(user_data['username'], user_data['password'], user_data['id'])
        else:
            return None
    except Exception as e:
        print(f"Error fetching user: {e}")
        return None




@app.route('/')
@login_required
def home():
    return f'Hello, {current_user.username}! <a href="/logout">Logout</a>'

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data['username']
    password = data['password']

    try:
        response = users_table.get_item(Key={'username': username})
        user_data = response.get('Item')

        if user_data and check_password_hash(user_data['password'], password):
            user = User(user_data['username'], user_data['password'], user_data['id'])
            login_user(user)

            # Store session in DynamoDB
            session_id = hashlib.sha256(f"{user_data['username']}{time.time()}".encode()).hexdigest()
            session = DynamoDBSession(session_id=session_id,user_id=user_data['username'])

            item = {
                'sessionId': session_id,
                'userId': user_data['username'],
                'ttl': int(time.time()) + 3600
            }
            sessions_table.put_item(Item=item)

            return jsonify({'message': 'Login successful', 'session_id':session_id}), 200 

        else:
            return jsonify({'message': 'Invalid credentials'}), 401

    except Exception as e:
        print(f"Error logging in user: {e}")
        return jsonify({'message': 'Error occurred during login'}), 500


@app.route('/logout')
def logout():
    #end user session 
    logout_user()
    # Get session ID 
    data = request.get_json()
    session_id = data['sessionId']

    if not session_id:
        return jsonify({'message': 'No session ID provided'}), 400
        
        # Remove the session from DynamoDB
        sessions_table.delete_item(Key={'sessionId': session_id})

    if session: 
        finish_session(session.session_id)

    return redirect(url_for('login'))

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json() 
    username = data['username']
    password = data['password']
    name = data.get('name', '')
    password_hash = generate_password_hash(password)

    try:
        response = users_table.get_item(Key={'username': username})
        if 'Item' in response:
            return jsonify({'message': 'User already exists'}), 400
        
        # Set user_id in session
        session_id = hashlib.sha256(f"{data['username']}{time.time()}".encode()).hexdigest()
        session = DynamoDBSession(session_id=session_id,user_id=data['username'])

        # user_id = str(uuid.uuid4())
        item = {
                'sessionId': session_id,
                'userId': username,
                'ttl': int(time.time()) + 3600
            }
        sessions_table.put_item(Item=item)


        return jsonify({'message': 'Register successful', 'session_id':session_id}), 200

    except Exception as e:
        print(f"Error registering user: {e}")
        return jsonify({'message': 'Error occurred during registration'}), 500



@app.route('/users', methods=['GET'])
def get_all_users():
    try:
        response = users_table.scan()

        if 'Items' in response:
            return jsonify(response['Items']) 

        else:
            return jsonify({'message': 'No users found'}), 404

    except Exception as e:
        print(f"Error fetching users: {e}")
        return jsonify({'error': 'Could not retrieve users'}), 500

    
    
#handles incoming http requests from lambda   
def lambda_handler(event, context):
    return awsgi.response(app, event, context, base64_content_types={"image/png"})

if __name__ == '__main__':
    app.run(debug=True)


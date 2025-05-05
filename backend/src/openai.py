import base64
import time
from urllib.parse import parse_qs, urlparse
import boto3
from botocore.exceptions import ClientError
import json
from flask import Blueprint, request, jsonify
from openai import OpenAI
from pydantic import BaseModel
from typing import List
import src.user_preferences_bp as user_preferences_bp
from flask_login import current_user, login_required
import requests


dynamodb = boto3.resource('dynamodb', region_name='eu-west-1')  
user_preferences_table = dynamodb.Table('Users')  
sessions_table = dynamodb.Table('UserSessions')

# Create the Blueprint
recipe_blueprint = Blueprint('recipe', __name__)
picture_blueprint = Blueprint('picture', __name__)

dynamodb = boto3.resource('dynamodb', region_name='eu-west-1')
table_name = "Users"

# Fetch the API key from AWS Secrets Manager
def get_secret():

    secret_name = "openai-key-2"
    region_name = "eu-west-1"

    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        raise e

    secret = get_secret_value_response['SecretString']
    data = json.loads(secret)
    api_key = data.get("openai-key-2")
    return api_key

# Initialize OpenAI
api_key = get_secret()

if not api_key:
    print("API Key not found in AWS Secrets Manager!")

client = OpenAI(api_key=api_key)
# openai.api_key = api_key

#Define models
class Ingredient (BaseModel):
    name: str
    estimated_expiry : str
class Foods (BaseModel):
    foods: List [Ingredient]
class Recipe(BaseModel):
    day_of_the_week: str
    title: str
    description: str
    difficulty: str
    time_to_prepare: str
    servings: int
    ingredients: List[str]
    instructions: List[str]

class WeeklyMenu (BaseModel):
    recipes: List [Recipe]

# Function to Analyze Food Picture using OpenAI
def analyse_picture(base64_image):
    try:
        # base64_image = base64.b64encode(image_content).decode("utf-8")

        prompt = """
        You are a food safety expert. Analyze the provided image and return:
        1. A list of identified ingredients.
        2. An estimated expiry date for each ingredient.
        

        **Respond in JSON format like this:**
        {{
            "foods": [
                {{
                    "name": "Ingredient Name",
                    "estimated_expiry": "X days"
                }},
                {{
                    "name": "Another Ingredient",
                    "estimated_expiry": "Y days"
                }}
            ]
        }}
        """
        
        completion = client.beta.chat.completions.parse(
            model="gpt-4o",
            messages=[
                {
                    "role": "user", 
                    "content": [
                        {
                            "type": "text", 
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": base64_image,
                            },
                        },
                    ],
                }
            ],
            response_format=Foods,
        )

        ingredients = json.loads(completion.choices[0].message.content)
        return ingredients

    except Exception as e:
        return {"error": str(e)}

# Function to store ingredients in DynamoDB
def store_ingredients_in_db(username, ingredients):
    try:
        if not ingredients:
            print("No ingredients to store!")
            return

        # Store ingredients in user_preferences table under 'ingredients' key
        user_preferences_table.update_item(
            Key={'username': username},
            UpdateExpression="SET ingredients = :ingredients",
            ExpressionAttributeValues={':ingredients': ingredients},
            ReturnValues="UPDATED_NEW"
        )

    except Exception as e:
        print(f"Error storing ingredients in DynamoDB: {e}")


def get_stored_ingredients(username):
    try:
        response = user_preferences_table.get_item(Key={'username': username})
        user_data = response.get('Item', {})

        # Return the stored ingredients list, or an empty list if not found
        return user_data.get('ingredients', [])

    except Exception as e:
        print(f"Error retrieving ingredients from DynamoDB: {e}")
        return []

def get_stored_feedback(username):
    try:
        response = user_preferences_table.get_item(Key={'username': username})
        user_data = response.get('Item', {})

        # Return the stored ingredients list, or an empty list if not found
        return user_data.get('feedbacks', [])

    except Exception as e:
        print(f"Error retrieving ingredients from DynamoDB: {e}")
        return []
    
# Function to Generate Recipe using OpenAI
def generate_recipe(preferences, user_id, session_id):
    try:
        stored_ingredients = get_stored_ingredients(user_id)
        if not stored_ingredients:
            return {"error": "No stored ingredients found"}
        
        # Get user's Fitbit token and fetch average steps
         # 1. Get the user's session token from DynamoDB
        # session_data = sessions_table.get_item(Key={'userId': user_id}).get('Item', {})
        # print ("session data:", session_data)
        # session_id = session_data.get('sessionId')
        # print ("session if:", session_id)
        if session_id:
            #Retrieve access token from database using user_id
            url = user_preferences_bp.retrieve_access_token (user_id)
            access_url = urlparse(url)
            query_params =  parse_qs(access_url.query)
            # Extract access_token (list → string)
            access_token = query_params.get('access_token', [None])[0]
            print ("access token:", access_token)
            access_id = query_params.get('user_id', [None])[0]
            print ("access id:", access_id)
            # assume not connected 
            fitbit_connected = 0

            if access_token:
                avg_steps = get_average_steps(access_token,access_id)
                fitbit_connected = 1
                if avg_steps >= 10000:
                    activity_level = "very active"
                    nutrition_guidance = "High-energy meals with complex carbs"
                elif avg_steps >= 7000:
                    activity_level = "active"
                    nutrition_guidance = "Balanced protein-rich meals"
                else:
                    activity_level = "sedentary"
                    nutrition_guidance = "Light, nutrient-dense meals"

        print(stored_ingredients)
        # Format ingredients list for prompt
        ingredients_list = [
        f"{item['name']} (expires in {item['estimated_expiry']})"
        for item in stored_ingredients['foods']
        ]
        #Retrieve user preferences form 
        form_list = user_preferences_bp.retrieve_user_pref(user_id)
        feedback = get_stored_feedback(user_id)

        print("generate_recipe() function was called")
        prompt = f"""
        You are a helpful and creative chef AI tasked with generating a personalized weekly meal plan.
        The user has provided the following inputs:
        - **Food preferences**: {preferences} 
            do **not repeat** any of these meals.
            Swiping right = they liked the meal, so use it to infer their tastes (e.g., flavors, cuisines, ingredients). 
            Swiping left = they disliked it — do not suggest similar meals.
        - **Form responses**: {form_list}
        - **Ingredients with expiry dates**: {ingredients_list}
        """
        if feedback:
            prompt += f"The user has also provided us with this feedback from previous recipes: {feedback}.\n"

        if fitbit_connected:
            prompt +=  f"""They also have provided us with their activity level: Activity level: {activity_level}
            (averaging {avg_steps} steps/day) and with the following nutrition_guidance: {nutrition_guidance} .\n"""
        prompt += """
        Generate **7 completely different meals** (one for each day of the week).
        - Each meal must be **new** — do not repeat or slightly modify meals from preferences or past feedback.
        - Ensure to respect the user's preferences from the form and prioritize ingredients that will expire soon.
        - Reflect their activity level and nutritional guidance in the portion size or energy level of meals if provided.


        **For each meal, provide:**
        - Day of the week
        - Recipe title
        - A short description
        - Difficulty level (Easy, Medium, Hard)
        - Time to prepare (in minutes)
        - Number of servings
        - List of ingredients
        - Step-by-step instructions

        **Then, at the end, provide a **complete** list of groceries that need to be bought, i.e., those not available in the provided ingredients.  
        For each grocery item, include:**  
        - Name of the ingredient  
        - Quantity required  
        - Category (e.g., Dairy, Vegetables, Meat, Grains, etc.)  
        - Ensure duplicates are merged into a single entry with the total required quantity. 

        **Respond ONLY in JSON format, following this exact schema:**
        {{
            "recipes": [
                {{
                    "day_of_the_week": "Monday/Tuesday/...",
                    "title": "Recipe Title",
                    "description": "Short description",
                    "difficulty": "Easy/Medium/Hard",
                    "time_to_prepare": "Time in minutes",
                    "servings": Number,
                    "ingredients": ["Ingredient 1", "Ingredient 2"],
                    "instructions": ["Step 1", "Step 2"]
                }},
                ... (7 recipes, one for each day)


            ],
            "grocery_list": [
                {{
                    "name": "Ingredient Name",
                    "quantity": "Amount (e.g., 500g, 2 cups, 1 liter)",
                    "category": "Category (e.g., Dairy, Vegetables, Meat, Grains)"
                }},
                ... (one entry per missing ingredient)
            ]
        }}
        """
        
        completion = client.beta.chat.completions.parse(
            model="gpt-4o",
            messages=[
                {
                    "role": "user", 
                    "content": [
                        {
                            "type": "text", 
                            "text": prompt
                        },
                    ],
                }
            ],
            response_format={"type": "json_object"}
        )

        print("Full Completion Response:", completion)  # Debugging

        raw_content = completion.choices[0].message.content
        print(f"Type of raw_content: {type(raw_content)}, Content: {raw_content}")

        try:
                menu = json.loads(raw_content) if isinstance(raw_content, str) else raw_content
        except json.JSONDecodeError as e:
                return {"error": f"Failed to parse JSON: {str(e)}"}
        
        if not isinstance(menu, dict):
            return {"error": "Unexpected response format from API"}
        return {"recipe": menu}


    except Exception as e:
        return {"error": str(e)}

# API Route for Generating a Recipe
@recipe_blueprint.route('/generate-recipe', methods=['POST'])
def generate_recipe_endpoint():
    try:
        data = request.get_json()
        preferences = data.get('preferences')
        sessionID = data.get('sessionId')

        if not preferences or not sessionID:
            return jsonify({'error': 'Preferences and session ID are required!'}), 400
        

        #retrieve user id using sessionID
        resp = sessions_table.get_item(Key={'sessionId' : sessionID})
        if 'Item' not in resp:
            return jsonify({'error': 'Invalid session ID'}), 400
        userId = resp['Item']['userId']

        stored_ingredients = get_stored_ingredients(userId)
        if not stored_ingredients:
            return jsonify({'error': 'No stored ingredients found. Please analyze an image first!'}), 400

        recipe = generate_recipe(preferences, userId, sessionID)

        print (recipe)
        return jsonify({'recipe': recipe})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API Route to Analyze Food Image
@picture_blueprint.route('/analyse-picture', methods=['POST'])
def analyse_food_image():
    try:
        data = request.get_json()
        base64_image = data.get('image')
        sessionID = data.get('sessionId')

        if not base64_image or not sessionID:
            return jsonify({'error': 'Image and session ID are required!'}), 400

        #retrieve user id using sessionID
        resp = sessions_table.get_item(Key={'sessionId' : sessionID})
        if 'Item' not in resp:
            return jsonify({'error': 'Invalid session ID'}), 400
        user_id = resp['Item']['userId']
        analysis_result = analyse_picture(base64_image)


        if "error" in analysis_result:
            return jsonify({'error': analysis_result["error"]}), 500

        store_ingredients_in_db(user_id, analysis_result)
        return jsonify({'analysis': analysis_result})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@recipe_blueprint.route('/submit-feedback', methods=['POST'])
def submit_feedback():
    try:
        data = request.get_json()
        sessionID = data.get('sessionId')
        recipe_title = data.get('recipeTitle')
        feedback = data.get('feedback')  # Example: "liked", "disliked", "too spicy", etc.

        if not sessionID or not recipe_title or not feedback:
            return jsonify({'error': 'Session ID, recipe title, and feedback are required!'}), 400

        resp = sessions_table.get_item(Key={'sessionId' : sessionID})
        if 'Item' not in resp:
            return jsonify({'error': 'Invalid session ID'}), 400
        
        userId = resp['Item']['userId']
        print ("My user", userId)

        # Store feedback in DynamoDB (or another DB)
        user_preferences_table.update_item(
            Key={'username': userId},
            UpdateExpression="SET feedbacks = list_append(if_not_exists(feedbacks, :empty_list), :new_feedback)",
            ExpressionAttributeValues={
                ':new_feedback': [{"recipeTitle": recipe_title, "feedback": feedback}],
                ':empty_list': []
            },
            ReturnValues="UPDATED_NEW"
        )


        return jsonify({'message': 'Feedback submitted successfully!'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


def get_average_steps(access_token, user_id):
    """Get average daily steps from the past week"""

    try:
        # Fetch step data
        response = requests.get(
            f'https://api.fitbit.com/1/user/{user_id}/activities/steps/date/2024-01-08/2024-01-14.json',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        response.raise_for_status()
       
        # Calculate average
        steps_data = response.json().get('activities-steps', [])
        total_steps = sum(int(day['value']) for day in steps_data)
        avg_steps = round(total_steps / 7) if steps_data else 0
        print ("my average steps", avg_steps)

        return avg_steps

    except requests.exceptions.HTTPError as err:
        return jsonify({'error': f'Fitbit API error: {str(err)}'}), err.response.status_code
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

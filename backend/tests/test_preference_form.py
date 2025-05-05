# import pytest
# import boto3
# from app import app
# import json


# region = "eu-north-1"
# table_name = "food_preferences"

# @pytest.fixture
# def client():
#     app.config["TESTING"] = True
#     with app.test_client() as client:
#         yield client

# @pytest.fixture(scope="module")
# def dynamodb_table():

#     dynamodb = boto3.resource("dynamodb", region_name=region)
#     return dynamodb.Table(table_name)

# def test_add_food_preferences(client, dynamodb_table):


#     form_data = {
#         "user_id": "test_user",
#         "food_id": "pizza",
#         "is_liked": "True"
#     }


#     response = client.post(
#         "/add_food_preferences",
#         json=form_data
#     )


#     assert response.status_code == 201
#     assert response.json == {"output": "Food preference logged"}

#     #check if stored
#     stored_item = dynamodb_table.get_item(
#         Key={"user_id": "test_user", "food_id": "pizza"}
#     )

#     assert "Item" in stored_item


# def test_missing_user_id(client):

#     form_data = {
#         "food_id": "pizza",
#         "is_liked": "true"
#     }

#     response = client.post("/add_food_preferences", json=form_data)

#     assert response.status_code == 400
#     assert response.json == {"error": "Invalid input data"}

# def test_missing_food_id(client):

#     form_data = {
#         "user_id": "test_user",
#         "is_liked": "true"
#     }

#     response = client.post("/add_food_preferences", json=form_data)

#     assert response.status_code == 400
#     assert response.json == {"error": "Invalid input data"}


# def test_invalid_is_liked(client):

#     form_data = {
#         "user_id": "test_user",
#         "food_id": "pizza",
#         "is_liked": "Hola"
#     }

#     response = client.post("/add_food_preferences", json=form_data)

#     assert response.status_code == 400
#     assert response.json == {"error": "Invalid value for is_liked"}


# def test_is_liked_false(client, dynamodb_table):

#     form_data = {
#         "user_id": "test_user",
#         "food_id": "burger",
#         "is_liked": "false"
#     }

#     response = client.post("/add_food_preferences", json=form_data)

#     assert response.status_code == 201
#     assert response.json == {"output": "Food preference logged"}

#     stored_item = dynamodb_table.get_item(Key={"user_id": "test_user", "food_id": "burger"})
#     assert "Item" in stored_item


# def test_missing_all(client, dynamodb_table):
#     form_data = {
#     }

#     response = client.post("/add_food_preferences", json=form_data)
#     assert response.status_code == 400
#     assert response.json == {"error": "Invalid input data"}

# def test_wrong_order(client, dynamodb_table):
#     form_data = {
#         "is_liked": "true",
#         "food_id": "pizza",
#         "user_id": "test_user"
#     }

#     response = client.post("/add_food_preferences", json=form_data)
#     assert response.status_code == 201
#     assert response.json == {"output": "Food preference logged"}

#     stored_item = dynamodb_table.get_item(Key={"user_id": "test_user", "food_id": "burger"})
#     assert "Item" in stored_item

# #tests for user_preferences



# def test_get_user_preferences(client):
#     test_user_id = "2929"
#     user_preferences_table = boto3.resource("dynamodb", region_name=region).Table("user_preferences")


#     form_data = {
#         "user_id": test_user_id,
#         "diet": "vegan",
#         "budget": "1274",
#         "cuisines": ["fish food"],
#         "allergens": ["peanuts"],
#         "kitchen_equipment": ["blender"],
#         "number_of_people": 3,
#         "notification_options": ["yes"]
#     }

#     #POST
#     response = client.post(
#         "/add_user_preferences",
#         json=form_data
#     )


#     assert response.status_code == 201
#     assert response.json == {"output": "User preferences logged"}


#     stored_item = user_preferences_table.get_item(Key={"user_id": test_user_id}  # Use the actual user_id!!!
#                                           )
#     assert "Item" in stored_item
#     assert stored_item["Item"]["diet"] == "vegan"
#     assert stored_item["Item"]["budget"] == "1274"
#     assert stored_item["Item"]["cuisines"] == ["fish food"]
#     assert stored_item["Item"]["allergens"] == ["peanuts"]
#     assert stored_item["Item"]["kitchen_equipment"] == ["blender"]
#     assert stored_item["Item"]["number_of_people"] == 3
#     assert stored_item["Item"]["notification_options"] == ["yes"]

#     response = user_preferences_table.scan()
#     print("Stored Data in DynamoDB:", response)


# def test_missing_required_fields(client):
#     test_user_id = "2929"

#     form_data = {
#         "user_id": test_user_id,
#         "number_of_people": 3
#     }

#     response = client.post("/add_user_preferences", json=form_data)

#     assert response.status_code == 400
#     assert "error" in response.json
#     assert response.json["error"] == "Invalid input data"

# def test_invalid_number_of_people(client):
#     test_user_id = "2929"
#     form_data = {
#         "user_id": test_user_id,
#         "number_of_people": "3"
#     }
#     response = client.post("/add_user_preferences", json=form_data)
#     assert response.status_code == 400
#     assert "error" in response.json
#     assert response.json["error"] == "Invalid number_of_people, must be an integer"


# def test_empty_values(client):
#     test_user_id = "2929"
#     form_data = {
#         "user_id": test_user_id,
#         "diet": "",
#         "budget": "",
#         "cuisines": [],
#         "allergens": [],
#         "kitchen_equipment": [],
#         "number_of_people": 0,
#     }
#     response = client.post("/add_user_preferences", json=form_data)
#     assert response.status_code == 400
#     assert "error" in response.json
#     assert response.json["error"] == "Invalid input data"





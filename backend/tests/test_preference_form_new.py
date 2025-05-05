from unittest.mock import MagicMock
from flask import Flask
import sys
import os


sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))


from src.user_preferences_bp import user_preferences_bp



def create_client():
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.register_blueprint(user_preferences_bp)
    return app.test_client()


def test_add_user_preferences(mocker):
    table = MagicMock()
    table.get_item.return_value = {'Item': {'userId': '11'}}

    user_pref_table = MagicMock()

    mocker.patch('src.user_preferences_bp.sessions_table', table)

    mocker.patch('src.user_preferences_bp.dynamodb.Table', return_value=user_pref_table)

    client = create_client()

    data = {
        'sessionId': 'valid_session',
        'diet': 'vegan',
        'budget': 'low',
        'cuisines': ' ',
        'allergens': 'nuts',
        'kitchen_equipment': 'oven',
        'number_of_people': '2',
        'notification_options': 'email'
    }
    print(data)

    response = client.post('/add_user_preferences', json=data)

    assert response.status_code == 201
    assert response.json == {"output": "User preferences logged"}

    user_pref_table.put_item.assert_called_once_with(Item={
        'user_id': '11',
        'diet': 'vegan',
        'budget': 'low',
        'cuisines': ' ',
        'allergens': 'nuts',
        'kitchen_equipment': 'oven',
        'number_of_people': 2,
        'notification_options': 'email'
    })

def test_invalid_input_num(mocker):
    #400 error, number of ppl given as a two rather than 2

    table = MagicMock()
    table.get_item.return_value = {'Item': {'userId': '11'}}
    mocker.patch('src.user_preferences_bp.sessions_table', table)
    client = create_client()

    data = {
        'sessionId': 'valid_session',
        'diet': 'vegan',
        'budget': 'low',
        'cuisines': 'french',
        'allergens': 'nuts',
        'kitchen_equipment': 'oven',
        'number_of_people': 'two',
        'notification_options': 'email'
    }

    response = client.post('/add_user_preferences', json=data)
    assert response.status_code == 400
    assert response.json == {"error": "Invalid number_of_people, must be an integer"}

def test_add_user_preferences_server_issue(mocker):
    #500 type error
    table = MagicMock()
    table.get_item.return_value = {'Item': {'userId': '11'}}
    mocker.patch('src.user_preferences_bp.sessions_table', table)


    user_pref_table = MagicMock()
    user_pref_table.put_item.side_effect = Exception("DynamoDB error")
    mocker.patch('src.user_preferences_bp.dynamodb.Table', return_value=user_pref_table)

    client = create_client()


    data = {
        'sessionId': 'valid_session',
        'diet': 'vegan',
        'budget': 'low',
        'cuisines': 'french',
        'allergens': 'nuts',
        'kitchen_equipment': 'oven',
        'number_of_people': '2',
        'notification_options': 'email'
    }

    response = client.post('/add_user_preferences', json=data)
    assert response.status_code == 500
    assert response.json == {"error": "An unexpected error occurred"}

def test_no_session(mocker):
    client = create_client()
    data = {}
    response = client.post('/add_user_preferences', json=data)
    assert response.status_code == 401

def test_invalid_input(mocker):

    table = MagicMock()
    table.get_item.return_value = {'Item': {'userId': '11'}}

    user_pref_table = MagicMock()

    mocker.patch('src.user_preferences_bp.sessions_table', table)

    mocker.patch('src.user_preferences_bp.dynamodb.Table', return_value=user_pref_table)

    client = create_client()

    data = {
        'sessionId': '',
        'diet': '',
        'budget': '',
        'cuisines': '',
        'allergens': '',
        'kitchen_equipment': '',
        'number_of_people': '2',
        'notification_options': ''
    }
    print(data)

    response = client.post('/add_user_preferences', json=data)

    assert response.status_code == 401






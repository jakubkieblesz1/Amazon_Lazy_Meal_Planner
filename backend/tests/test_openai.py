import json
from unittest import mock
import pytest
from botocore.exceptions import ClientError
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.openai import analyse_picture, get_secret
from app import app


@pytest.fixture
def client():
    #makes test client
    app.config['TESTING'] = True
    return app.test_client()


def test_secret_key():
    client = mock.Mock()
    response = {
        'SecretString': json.dumps({'openai-key-2': 'BENSAPIKEY'})
    }
    client.get_secret_value.return_value = response #when get_secret is called on mock client return this

    with mock.patch('boto3.session.Session.client', return_value=client): #makes us call from fake
        key = get_secret()

    assert key == 'BENSAPIKEY'


def test_get_secret_client_error():
    #tests error in looking for secret value
    mock_client = mock.Mock()
    mock_client.get_secret_value.side_effect = ClientError(
        {'Error': {'Code': 'ResourceNotFoundException', 'Message': 'Secret not found'}}, #when someone tries to get secret value give back error
        'GetSecretValue'
    )
    with mock.patch('boto3.session.Session.client', return_value=mock_client):
        with pytest.raises(ClientError):
            get_secret()


def test_generate_recipe_working(client):
    #tests correct menu gen with valid preferences
    with mock.patch('src.openai.client.beta.chat.completions.parse') as mock_generate_content, \
            mock.patch('src.openai.sessions_table.get_item', return_value={'Item': {'userId': '1'}}), \
            mock.patch('src.openai.get_stored_ingredients', return_value={"foods": [{"name": "Tomato", "estimated_expiry": "2 days"}]}), \
            mock.patch('src.openai.user_preferences_bp.retrieve_user_pref', return_value={'diet': 'vegan'}):


        mock_generate_content.return_value = mock.Mock(
            choices=[
                mock.Mock(message=mock.Mock(content='{"recipes": "vegan recipe", "grocery_list": []}'))]
        )

        response = client.post('/generate-recipe', json={
            'preferences': 'vegan',
            'sessionId': 's1'
        })


        assert response.status_code == 200
        data = response.get_json()

        print(data)
        assert 'recipe' in data
        assert isinstance(data['recipe'], dict)

        assert data['recipe']['recipe']['recipes'] == "vegan recipe"


def test_no_preferences(client):
    # 400 error should occur
    response = client.post('/generate-recipe', json={'sessionId': 's1'})

    assert response.status_code == 400
    data = response.get_json()

    print(data)
    assert 'error' in data
    assert data['error'] == 'Preferences and session ID are required!'


def test_server_error(client):
    #500 error, server error i.e. open ai crashing
    with mock.patch('src.openai.sessions_table.get_item', return_value={'Item': {'userId': '5'}}), \
            mock.patch('src.openai.get_stored_ingredients',
                       return_value={"foods": [{"name": "Tomato", "estimated_expiry": "5 days"}]}), \
            mock.patch('src.openai.user_preferences_bp.retrieve_user_pref', return_value={'diet': 'vegan'}), \
            mock.patch('src.openai.generate_recipe', side_effect=Exception("Test server error")):

        response = client.post('/generate-recipe', json={'preferences': 'test', 'sessionId': 's1' })

        assert response.status_code == 500
        data = response.get_json()
        print(data)
        assert 'error' in data
        assert "Test server error" in data['error']


def test_analyse_image():
    image = "image"
    mock_response = mock.Mock()
    mock_response.choices = [
        mock.Mock(message=mock.Mock(content=json.dumps({
            "foods": [{"name":"orange"}]
        })))
    ]
    with mock.patch("src.openai.client.beta.chat.completions.parse", return_value=mock_response):
        result = analyse_picture(image)
        assert "foods" in result
        assert result["foods"][0]["name"] == "orange"


def test_analyse_image_failure_no_image(client):
    # 400 error should occur
    response = client.post('/analyse-picture', json={'sessionId': 's1'})

    assert response.status_code == 400
    data = response.get_json()

    print(data)
    assert 'error' in data
    assert data['error'] == 'Image and session ID are required!'

def test_no_session_id(client):
    #400 error
    response = client.post('/analyse-picture', json={'sessionId': 's1'})
    assert response.status_code == 400
    data = response.get_json()
    print(data)
    assert 'error' in data
    assert data['error'] == 'Image and session ID are required!'


def test_image_analyse_serve_failure(client):
    # 500 error
    with (mock.patch('src.openai.sessions_table.get_item', return_value={'Item': {'userId': '5'}}), \
            mock.patch('src.openai.client.beta.chat.completions.parse', side_effect=Exception("Test image anaylse error"))):

        response = client.post('/analyse-picture', json={
            'image': 'image', 'sessionId': 's1'
        })

        assert response.status_code == 500
        data = response.get_json()

        print(data)

        assert data
        assert "Test image anaylse error" in data['error']












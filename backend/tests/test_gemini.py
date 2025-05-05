# import sys
# import os
# sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# from src.openai import get_secret
# import pytest
# from unittest import mock
# import json
# from app import app 
# from botocore.exceptions import ClientError

# @pytest.fixture
# def client():
#     """Creates a test client for the Flask app."""
#     app.config['TESTING'] = True
#     client = app.test_client()
#     return client

# def test_get_secret_success():
#     """Test the successful retrieval of the API key from AWS Secrets Manager."""

#     # Mock the Secrets Manager client
#     mock_client = mock.Mock()
    
#     # Mock the response of the get_secret_value function
#     secret_value_response = {
#         'SecretString': json.dumps({'Api_key': 'test_api_key_123'})
#     }
#     mock_client.get_secret_value.return_value = secret_value_response

#     # boto3.client returns the mocked client
#     with mock.patch('boto3.session.Session.client', return_value=mock_client):
#         api_key = get_secret()

#     # Assert that the API key returned is correct
#     assert api_key == 'test_api_key_123'

# def test_get_secret_client_error():
#     """Test handling of ClientError when getting the secret."""
    
#     # Mock the Secrets Manager client
#     mock_client = mock.Mock()
    
#     # Simulates a ClientError being raised by get_secret_value
#     mock_client.get_secret_value.side_effect = ClientError(
#         {'Error': {'Code': 'ResourceNotFoundException', 'Message': 'Secret not found'}},
#         'GetSecretValue'
#     )
    
#     # boto3.client returns the mocked client
#     with mock.patch('boto3.session.Session.client', return_value=mock_client):
#         with pytest.raises(ClientError):
#             get_secret()  # Raises ClientError 

# def test_generate_recipe_success(client):
#     """Test successful recipe generation with valid preferences."""

#     # Mock the 'generate_content' method of the client.models
#     with mock.patch('client.beta.chat.completions.parse') as mock_generate_content:

#         mock_generate_content.return_value = mock.Mock(
#             text="Delicious vegetarian recipe.",
#             candidates=[]
#         )

#         response = client.post('/generate-recipe', data={'preferences': 'vegetarian, quick meals'})
         
#          # Assert that the response status code is 200 OK
#         assert response.status_code == 200
#         data = response.get_json()
#         assert 'recipe' in data
#         assert data['recipe'] == "Delicious vegetarian recipe."


# def test_generate_recipe_no_preferences(client):
#     """Test when no preferences are provided."""
#     response = client.post('/generate-recipe', data={})  # No preferences provided
#     assert response.status_code == 400
#     data = response.get_json()
#     assert 'error' in data
#     assert data['error'] == 'Preferences are required!'

# def test_generate_recipe_internal_error(client):
#     """Test internal server error handling."""
    
#     # Mock the generate_recipe function to raise an exception
#     with mock.patch('openai.generate_recipe', side_effect=Exception("Test internal server error")):
        
#         # Send a POST request to the /generate-recipe
#         response = client.post('/generate-recipe', data={'preferences': 'test'})
        
#         # Assert Internal Server Error
#         assert response.status_code == 500
        
#         data = response.get_json()
#         assert 'error' in data
#         assert "Test internal server error" in data['error']
# SwEng25_Group28_LazyCook
How to use the backend flask app:

Create a virtual environment:
python3 -m venv venv

source venv/bin/activate  
On Windows: venv\Scripts\activate

Run this to install dependencies:
pip install -r requirements.txt

install AWS

Run aws configure 
secret key: **your secret key**

Access key: **your access key**

server: eu-west-1

leave last blank

To Run the backend locally: 
python3 app.py

## Description 
This is the backend for project 28's Lazy Meal Prep Application. 
It is written in python using flask. 
We use gemini to generate meal plans as well as identify ingredients uploaded as an image by the user. 

## Testing and Deployment 
For continuous integration, we use linting and formatting tests, as well as unit tests. 
Once testing is complete, the backend is zipped to an S3 bucket and deployed to AWS lambda. 
With necessary permissions you can access the backend through a url through API gateway. 




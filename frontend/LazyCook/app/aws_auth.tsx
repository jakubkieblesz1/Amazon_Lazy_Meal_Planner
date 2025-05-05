import AWS from "aws-sdk";
import axios from "axios";
import CryptoJS from "crypto-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_ROLE_ARN } from "@env";

AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

const API_GATEWAY_URL = "https://1ckhyldni3.execute-api.eu-west-1.amazonaws.com/prod";

export const getTemporaryAWSCredentials = async () => {
  try {
    const cachedCredentials = await AsyncStorage.getItem("AWS_CREDENTIALS");
    if (cachedCredentials) {
      return JSON.parse(cachedCredentials);
    }


    const sts = new AWS.STS();
    const response = await sts
      .assumeRole({
        RoleArn: AWS_ROLE_ARN,
        RoleSessionName: "LazyCookSession",
        DurationSeconds: 3600, 
      })
      .promise();

    const credentials = {
      accessKeyId: response.Credentials.AccessKeyId,
      secretAccessKey: response.Credentials.SecretAccessKey,
      sessionToken: response.Credentials.SessionToken,
    };

    await AsyncStorage.setItem("AWS_CREDENTIALS", JSON.stringify(credentials));

    return credentials;
  } catch (error) {
    console.error("Error assuming IAM role:", error);
    return null;
  }
};

const signRequest = (url, method, body, accessKeyId, secretAccessKey, sessionToken) => {
  const REGION = AWS_REGION;
  const SERVICE = "execute-api";
  const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const credentialScope = `${date.slice(0, 8)}/${REGION}/${SERVICE}/aws4_request`;

  const headers = {
    "content-type": "application/json",
    host: new URL(url).host,
    "x-amz-security-token": sessionToken, 
  };

  const canonicalHeaders = Object.keys(headers)
    .map((key) => `${key}:${headers[key]}`)
    .join("\n");

  const signedHeaders = Object.keys(headers).join(";");

  const payloadHash = CryptoJS.SHA256(body || "").toString(CryptoJS.enc.Hex);
  const canonicalRequest = `${method}\n/\n\n${canonicalHeaders}\n\n${signedHeaders}\n${payloadHash}`;

  const stringToSign = `AWS4-HMAC-SHA256\n${date}\n${credentialScope}\n${CryptoJS.SHA256(canonicalRequest).toString(CryptoJS.enc.Hex)}`;

  const signingKey = CryptoJS.HmacSHA256(
    "aws4_request",
    CryptoJS.HmacSHA256(SERVICE, CryptoJS.HmacSHA256(REGION, CryptoJS.HmacSHA256(date.slice(0, 8), `AWS4${secretAccessKey}`)))
  );

  const signature = CryptoJS.HmacSHA256(stringToSign, signingKey).toString(CryptoJS.enc.Hex);

  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return { ...headers, Authorization: authorizationHeader };
};

export const callApiWithSigV4 = async (endpoint, method, data = {}) => {
  const credentials = await getTemporaryAWSCredentials();
  if (!credentials) {
    console.error("Unable to retrieve AWS temporary credentials.");
    return;
  }

  const { accessKeyId, secretAccessKey, sessionToken } = credentials;
  const url = `${API_GATEWAY_URL}${endpoint}`;

  const headers = signRequest(url, method, JSON.stringify(data), accessKeyId, secretAccessKey, sessionToken);

  try {
    const response = await axios({
      method: method,
      url: url,
      headers: headers,
      data: method === "GET" ? undefined : data, 
    });

    console.log(`Success [${method} ${endpoint}]:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error.response?.data || error.message);
  }
};

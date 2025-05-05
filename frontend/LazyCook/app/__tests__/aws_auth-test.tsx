import AWS from "aws-sdk";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getTemporaryAWSCredentials, callApiWithSigV4 } from "../aws_auth";

// Mocking the AWS SDK
jest.mock('aws-sdk', () => {
  const mockSTS = {
    assumeRole: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Credentials: {
          AccessKeyId: "mockAccessKeyId",
          SecretAccessKey: "mockSecretAccessKey",
          SessionToken: "mockSessionToken",
        },
      }),
    }),
  };

  return {
    config: {
      update: jest.fn(), // Mock the `update` method to avoid errors
    },
    STS: jest.fn(() => mockSTS),
  };
});


// Mocking Axios
jest.mock("axios");

// Mocking AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe("AWS API Utility Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getTemporaryAWSCredentials - returns cached credentials if available", async () => {
    // Mock AsyncStorage to return cached credentials
    AsyncStorage.getItem.mockResolvedValue(
      JSON.stringify({
        accessKeyId: "cachedAccessKeyId",
        secretAccessKey: "cachedSecretAccessKey",
        sessionToken: "cachedSessionToken",
      })
    );

    const credentials = await getTemporaryAWSCredentials();

    // Assertions to ensure cached credentials are returned
    expect(credentials).toEqual({
      accessKeyId: "cachedAccessKeyId",
      secretAccessKey: "cachedSecretAccessKey",
      sessionToken: "cachedSessionToken",
    });
    expect(AsyncStorage.getItem).toHaveBeenCalledWith("AWS_CREDENTIALS");
    expect(AWS.STS).not.toHaveBeenCalled(); // AWS STS should not be called if cached credentials are found
  });

  it("getTemporaryAWSCredentials - fetches new credentials if no cache is available", async () => {
    // Mock AsyncStorage to return no cached credentials
    AsyncStorage.getItem.mockResolvedValue(null);

    const credentials = await getTemporaryAWSCredentials();

    // Assertions to ensure new credentials are fetched
    expect(AWS.STS).toHaveBeenCalled(); // STS should be called to fetch new credentials
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "AWS_CREDENTIALS",
      JSON.stringify({
        accessKeyId: "mockAccessKeyId",
        secretAccessKey: "mockSecretAccessKey",
        sessionToken: "mockSessionToken",
      })
    );
    expect(credentials).toEqual({
      accessKeyId: "mockAccessKeyId",
      secretAccessKey: "mockSecretAccessKey",
      sessionToken: "mockSessionToken",
    });
  });

  it("callApiWithSigV4 - makes a successful API call", async () => {
    // Mock AsyncStorage to return credentials
    AsyncStorage.getItem.mockResolvedValue(
      JSON.stringify({
        accessKeyId: "mockAccessKeyId",
        secretAccessKey: "mockSecretAccessKey",
        sessionToken: "mockSessionToken",
      })
    );

    // Mock Axios to resolve with a success response
    axios.mockResolvedValue({ data: { success: true } });

    const response = await callApiWithSigV4("/test", "POST", { key: "value" });

    // Assertions to ensure the request is made correctly
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: expect.stringContaining("execute-api"), // Ensure URL contains 'execute-api'
        data: { key: "value" }, // Ensure correct data is passed
      })
    );
    expect(response).toEqual({ success: true }); // Ensure the API response is returned correctly
  });

  it("callApiWithSigV4 - handles API error", async () => {
    // Mock AsyncStorage to return credentials
    AsyncStorage.getItem.mockResolvedValue(
      JSON.stringify({
        accessKeyId: "mockAccessKeyId",
        secretAccessKey: "mockSecretAccessKey",
        sessionToken: "mockSessionToken",
      })
    );

    // Mock Axios to reject with an error response
    axios.mockRejectedValue({ response: { data: { error: "API Error" } } });

    const response = await callApiWithSigV4("/error", "GET");

    // Assertions to ensure error handling works correctly
    expect(axios).toHaveBeenCalled();
    expect(response).toBeUndefined(); // Ensure undefined is returned when an error occurs
  });
});

// The Adyen SDK is CommonJS; import its default namespace when this app runs as ESM.
import adyen from "@adyen/api-library";
import crypto from "crypto";

const { Client, CheckoutAPI, Config } = adyen;

const config = new Config();
config.apiKey = process.env.ADYEN_API_KEY;
config.environment = process.env.ADYEN_ENVIRONMENT === "live" ? "LIVE" : "TEST";

const client = new Client({ config });
client.setEnvironment(config.environment);

export const checkoutAPI = new CheckoutAPI(client);

export const createPaymentSession = async ({ amount, currency, merchantReference, returnUrl, shopperEmail, shopperReference }) => {
  const response = await checkoutAPI.PaymentsApi.sessions({
    merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
    amount: { value: Math.round(amount * 100), currency },
    reference: merchantReference,
    returnUrl,
    shopperEmail,
    shopperReference,
    countryCode: "NL",
  });
  return response;
};

export const submitAdditionalDetails = async (payload) => {
  return checkoutAPI.PaymentsApi.paymentsDetails(payload);
};

// HMAC validation for Adyen webhook notifications
export const validateHmacSignature = (notificationItem) => {
  const hmacKey = process.env.ADYEN_HMAC_KEY;
  if (!hmacKey) return false;

  const nfi = notificationItem;
  const dataToSign = [
    nfi.pspReference,
    nfi.originalReference || "",
    nfi.merchantAccountCode,
    nfi.merchantReference,
    nfi.amount?.value,
    nfi.amount?.currency,
    nfi.eventCode,
    nfi.success,
  ].join(":");

  const hmac = crypto.createHmac("sha256", Buffer.from(hmacKey, "hex"));
  hmac.update(Buffer.from(dataToSign, "utf-8"));
  const expectedSignature = hmac.digest("base64");

  const receivedSignature = nfi.additionalData?.hmacSignature;
  if (!receivedSignature) return false;

  try {
    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(receivedSignature));
  } catch {
    return false;
  }
};

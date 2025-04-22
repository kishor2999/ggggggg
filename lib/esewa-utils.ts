import * as crypto from "crypto";

// eSewa test credentials
export const ESEWA_CONFIG = {
  MERCHANT_CODE: "EPAYTEST", // Test merchant code
  SECRET_KEY: "8gBm/:&EnhH.1/q", // Test secret key
  FORM_URL: "https://rc-epay.esewa.com.np/api/epay/main/v2/form", // Test URL
  STATUS_URL: "https://rc.esewa.com.np/api/epay/transaction/status/", // Test status check URL
};

/**
 * Generate HMAC-SHA256 signature for eSewa payment
 * @param total_amount - Total payment amount
 * @param transaction_uuid - Unique transaction ID
 * @param product_code - Merchant code
 * @returns base64 encoded signature
 */
export function generateSignature(
  total_amount: number | string,
  transaction_uuid: string,
  product_code: string = ESEWA_CONFIG.MERCHANT_CODE
): string {
  // Create signature input string in exact order as required by eSewa
  // Format: "total_amount=100,transaction_uuid=11-201-13,product_code=EPAYTEST"
  const signatureInput = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
  
  console.log("Signature input for generation:", signatureInput);
  
  // Generate HMAC-SHA256 signature
  const hmac = crypto.createHmac("sha256", ESEWA_CONFIG.SECRET_KEY);
  hmac.update(signatureInput);
  
  // Return base64 encoded signature
  const signature = hmac.digest("base64");
  console.log("Generated signature:", signature);
  
  return signature;
}

/**
 * Verify eSewa response signature
 * @param data - Data object from eSewa
 * @returns boolean indicating if signature is valid
 */
export function verifySignature(data: any): boolean {
  const { signed_field_names, signature } = data;
  
  if (!signed_field_names || !signature) {
    return false;
  }
  
  // Extract field names in order from signed_field_names
  const fieldsToSign = signed_field_names.split(",");
  
  // Create signature input string with field=value format, comma-separated
  const signatureInputParts = fieldsToSign.map((field: string) => `${field}=${data[field]}`);
  const signatureInput = signatureInputParts.join(",");
  
  console.log("Signature input for verification:", signatureInput);
  
  // Generate HMAC-SHA256 signature for verification
  const hmac = crypto.createHmac("sha256", ESEWA_CONFIG.SECRET_KEY);
  hmac.update(signatureInput);
  const calculatedSignature = hmac.digest("base64");
  
  console.log("Received signature:", signature);
  console.log("Calculated signature:", calculatedSignature);
  
  // Compare the received signature with calculated signature
  return signature === calculatedSignature;
}

/**
 * Create form data object for eSewa payment
 * @param amount - Payment amount
 * @param transaction_uuid - Unique transaction ID
 * @param success_url - Success callback URL
 * @param failure_url - Failure callback URL
 * @param payment_id - Internal payment ID reference
 * @returns Object with all required form fields
 */
export function createEsewaFormData(
  amount: number,
  transaction_uuid: string,
  success_url: string,
  failure_url: string,
  payment_id: string
): Record<string, string> {
  // Calculate total amount (amount + tax + service charge + delivery charge)
  const tax_amount = "0";
  const product_service_charge = "0";
  const product_delivery_charge = "0";
  const total_amount = amount.toString();
  
  // Generate signature
  const signature = generateSignature(
    total_amount,
    transaction_uuid,
    ESEWA_CONFIG.MERCHANT_CODE
  );
  
  // Prepare form data exactly as required by eSewa documentation
  return {
    amount: amount.toString(),
    tax_amount,
    total_amount,
    transaction_uuid,
    product_code: ESEWA_CONFIG.MERCHANT_CODE,
    product_service_charge,
    product_delivery_charge,
    success_url,
    failure_url,
    signed_field_names: "total_amount,transaction_uuid,product_code",
    signature
  };
}

/**
 * Check transaction status with eSewa
 * @param product_code - Merchant code
 * @param total_amount - Payment amount
 * @param transaction_uuid - Transaction ID
 * @returns Promise with transaction status response
 */
export async function checkTransactionStatus(
  total_amount: number | string,
  transaction_uuid: string,
  product_code: string = ESEWA_CONFIG.MERCHANT_CODE
): Promise<any> {
  const url = `${ESEWA_CONFIG.STATUS_URL}?product_code=${product_code}&total_amount=${total_amount}&transaction_uuid=${transaction_uuid}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error checking transaction status:", error);
    throw error;
  }
} 
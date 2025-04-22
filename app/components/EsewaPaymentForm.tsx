"use client";

import { useEffect, useRef } from "react";
import { ESEWA_CONFIG } from "@/lib/esewa-utils";

interface EsewaPaymentFormProps {
  params: Record<string, string>;
  onPaymentInitiated?: () => void;
}

export function EsewaPaymentForm({ params, onPaymentInitiated }: EsewaPaymentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // This will automatically submit the form on mount if provided with params
    if (formRef.current && Object.keys(params).length > 0) {
      if (onPaymentInitiated) {
        onPaymentInitiated();
      }
      console.log("Submitting eSewa form with params:", params);
      formRef.current.submit();
    }
  }, [params, onPaymentInitiated]);

  return (
    <form 
      ref={formRef}
      action={ESEWA_CONFIG.FORM_URL} 
      method="POST"
      className="hidden" // Form is hidden and auto-submitted
    >
      {/* Required fields according to eSewa documentation */}
      <input type="hidden" name="amount" value={params.amount || ""} />
      <input type="hidden" name="tax_amount" value={params.tax_amount || "0"} />
      <input type="hidden" name="total_amount" value={params.total_amount || ""} />
      <input type="hidden" name="transaction_uuid" value={params.transaction_uuid || ""} />
      <input type="hidden" name="product_code" value={params.product_code || ""} />
      <input type="hidden" name="product_service_charge" value={params.product_service_charge || "0"} />
      <input type="hidden" name="product_delivery_charge" value={params.product_delivery_charge || "0"} />
      <input type="hidden" name="success_url" value={params.success_url || ""} />
      <input type="hidden" name="failure_url" value={params.failure_url || ""} />
      <input type="hidden" name="signed_field_names" value={params.signed_field_names || ""} />
      <input type="hidden" name="signature" value={params.signature || ""} />
    </form>
  );
} 
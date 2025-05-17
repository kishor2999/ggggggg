'use client';

import { useState } from 'react';
import { EsewaPaymentForm } from './EsewaPaymentForm';
import { createEsewaFormData } from '@/lib/esewa-utils';
import { v4 as uuidv4 } from 'uuid';

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  items: {
    product: {
      name: string;
    };
    quantity: number;
    price: number;
  }[];
}

export default function OrderPaymentExample({ order }: { order: Order }) {
  const [isPaying, setIsPaying] = useState(false);
  
  // Format the total amount as a number with 2 decimal places
  const formattedAmount = Number(order.totalAmount);

  const handleInitiatePayment = () => {
    setIsPaying(true);
  };
  
  const getEsewaParams = () => {
    const transactionUuid = uuidv4();
    const origin = window.location.origin;
    const successUrl = `${origin}/api/payments/esewa/success`;
    const failureUrl = `${origin}/api/payments/esewa/failure`;

    return createEsewaFormData(
      Math.round(formattedAmount),
      transactionUuid,
      successUrl,
      failureUrl,
      order.id
    );
  };
  
  return (
    <div className="rounded-lg border p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-2">Order #{order.id.substring(0, 8)}</h2>
      
      <div className="space-y-2 mb-4">
        {order.items.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span>{item.product.name} x{item.quantity}</span>
            <span>Rs. {Number(item.price).toFixed(2)}</span>
          </div>
        ))}
        
        <div className="flex justify-between font-medium pt-2 border-t">
          <span>Total Amount:</span>
          <span>Rs. {formattedAmount.toFixed(2)}</span>
        </div>
      </div>
      
      {order.status === 'PENDING' && (
        <div>
          <h3 className="font-medium mb-2">Payment Options</h3>
          
          {isPaying ? (
            <EsewaPaymentForm 
              params={getEsewaParams()}
              onPaymentInitiated={() => } 
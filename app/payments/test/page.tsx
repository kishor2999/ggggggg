'use client';

import { useState } from 'react';
import EsewaPaymentForm from '@/app/components/EsewaPaymentForm';
import { Button } from '@/components/ui/button';

export default function TestEsewaPayment() {
  const [testOrderId, setTestOrderId] = useState('');
  const [amount, setAmount] = useState(100);
  const [showPayment, setShowPayment] = useState(false);
  
  const generateTestOrder = async () => {
    try {
      // Create a test order in the database
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              productId: 'test-product-id', // Replace with an actual product ID from your database
              quantity: 1,
              price: amount
            }
          ],
          totalAmount: amount
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create test order');
      }
      
      const order = await response.json();
      setTestOrderId(order.id);
      setShowPayment(true);
    } catch (error) {
      console.error('Error creating test order:', error);
      alert('Failed to create test order. Make sure you are logged in and have valid product IDs.');
    }
  };
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">eSewa Payment Test</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Amount (NPR)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="border rounded p-2 w-full"
            min="1"
          />
        </div>
        
        {!showPayment ? (
          <Button onClick={generateTestOrder} className="w-full">
            Generate Test Order
          </Button>
        ) : (
          <div>
            <div className="bg-green-50 p-4 rounded-md mb-4">
              <h3 className="font-medium">Test Order Created</h3>
              <p className="text-sm">Order ID: {testOrderId}</p>
              <p className="text-sm">Amount: Rs. {amount}</p>
            </div>
            
            <EsewaPaymentForm orderId={testOrderId} totalAmount={amount} />
            
            <Button 
              variant="outline" 
              className="w-full mt-2"
              onClick={() => {
                setShowPayment(false);
                setTestOrderId('');
              }}
            >
              Reset
            </Button>
          </div>
        )}
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Testing Instructions</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Use test credentials from eSewa: <code>9806800001</code> / <code>Nepal@123</code></li>
          <li>The test environment will not actually deduct money</li>
          <li>After payment, you will be redirected to the success/failure page</li>
        </ul>
      </div>
    </div>
  );
} 
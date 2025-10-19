'use client';

import React from 'react';

export default function FAQPage() {
  const faqs = [
    {
      question: 'How do I start a trading challenge?',
      answer: 'Navigate to Buy Evaluation and select a plan that fits your needs.'
    },
    {
      question: 'What are the trading rules?',
      answer: 'Each evaluation has specific rules including ROI targets, drawdown limits, and minimum trading days.'
    },
    {
      question: 'How do I withdraw profits?',
      answer: 'Once you pass evaluation, you can request payouts through the Payouts section.'
    },
    {
      question: 'What happens if I breach the rules?',
      answer: 'Your evaluation will be disqualified and you may need to restart.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Frequently Asked Questions</h1>
        <p className="text-gray-400 mt-2">Common questions about trading evaluations</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-medium text-white mb-2">{faq.question}</h3>
            <p className="text-gray-400">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { Disclosure, Transition } from '@headlessui/react';
import { ChevronUpIcon } from '@heroicons/react/24/outline';

const faqs = [
  {
    question: 'How do commissions work?',
    answer: 'Earn 20% on every first-time PolyProp evaluation your referrals purchase. All payouts are tracked automatically in your affiliate dashboard.'
  },
  {
    question: 'When do I get paid?',
    answer: 'Payouts are initiated once commissions clear and you reach the minimum threshold. Request payouts anytime from your dashboard.'
  },
  {
    question: 'Who can apply?',
    answer: 'Traders, educators, community leaders, and creators focused on prediction markets are encouraged to join. We review every application to ensure a good fit.'
  },
  {
    question: 'What promotional resources are available?',
    answer: 'You receive onboarding guides, campaign assets, and a dedicated support channel so you can launch quickly and confidently.'
  }
];

export default function FAQAccordion() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Get quick answers about PolyProp&apos;s affiliate program.</p>
      </div>

      <dl className="divide-y divide-gray-200 dark:divide-gray-700">
        {faqs.map((faq) => (
          <Disclosure key={faq.question} as="div" className="p-6">
            {({ open }) => (
              <>
                <Disclosure.Button className="flex w-full items-center justify-between text-left">
                  <span className="text-lg font-medium text-gray-900 dark:text-white">{faq.question}</span>
                  <ChevronUpIcon
                    className={`h-5 w-5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </Disclosure.Button>
                <Transition
                  enter="transition duration-150 ease-out"
                  enterFrom="transform scale-95 opacity-0"
                  enterTo="transform scale-100 opacity-100"
                  leave="transition duration-100 ease-out"
                  leaveFrom="transform scale-100 opacity-100"
                  leaveTo="transform scale-95 opacity-0"
                >
                  <Disclosure.Panel className="pt-4 text-gray-700 dark:text-gray-300">
                    {faq.answer}
                  </Disclosure.Panel>
                </Transition>
              </>
            )}
          </Disclosure>
        ))}
      </dl>
    </div>
  );
}

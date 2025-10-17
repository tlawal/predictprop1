import React, { useState } from 'react';
import { Disclosure, Transition } from '@headlessui/react';

const AffiliateExpander = ({ affiliateCode, onCodeChange, discount }) => {
  const [inputValue, setInputValue] = useState(affiliateCode);
  const [isValidating, setIsValidating] = useState(false);

  const handleInputChange = (value) => {
    setInputValue(value);
  };

  const handleApplyCode = () => {
    if (inputValue.trim()) {
      setIsValidating(true);
      onCodeChange(inputValue.trim());

      // Simulate validation delay
      setTimeout(() => {
        setIsValidating(false);
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleApplyCode();
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
      <Disclosure>
        {({ open }) => (
          <>
            <Disclosure.Button className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-700/30 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-teal-400/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 010 2h3a1 1 0 011 1v3a1 1 0 01-2 0V6h-3a1 1 0 010-2h1zm0 8a1 1 0 010 2h1v3a1 1 0 102 0v-3h3a1 1 0 100-2h-3v-1a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white font-medium">
                  Got an Affiliate code?
                </span>
                {discount > 0 && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                    {discount}% OFF
                  </span>
                )}
              </div>
              <svg
                className={`w-5 h-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Disclosure.Button>

            <Transition
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <Disclosure.Panel className="px-6 pb-4">
                <div className="pt-4 border-t border-slate-700">
                  <p className="text-slate-400 text-sm mb-4">
                    Enter your affiliate code to get a discount on your evaluation fee.
                  </p>

                  <div className="flex space-x-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter affiliate code"
                        className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                        disabled={isValidating}
                      />
                    </div>
                    <button
                      onClick={handleApplyCode}
                      disabled={!inputValue.trim() || isValidating}
                      className="px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                    >
                      {isValidating ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Validating...</span>
                        </>
                      ) : (
                        <span>Apply</span>
                      )}
                    </button>
                  </div>

                  {discount > 0 && (
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-400 font-medium">
                          Code applied! You save {discount}% on your evaluation fee.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 text-xs text-slate-500">
                    Don&apos;t have an affiliate code?{' '}
                    <a href="#" className="text-teal-400 hover:text-teal-300 underline">
                      Learn about our affiliate program
                    </a>
                  </div>
                </div>
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>
    </div>
  );
};

export default AffiliateExpander;

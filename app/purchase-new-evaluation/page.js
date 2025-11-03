'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Tab } from '@headlessui/react';
import useSWR from 'swr';
import { supabase } from '../../lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import BillingForm from './components/BillingForm';
import OrderSummary from './components/OrderSummary';
import AffiliateExpander from './components/AffiliateExpander';
import AddOnsSection from './components/AddOnsSection';
import PayModal from '../components/PayModal';
import AccountBalanceSelector from './components/AccountBalanceSelector';

// US States for dropdown
const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' }
];

// Countries for dropdown (ISO codes)
const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'IT', label: 'Italy' },
  { value: 'ES', label: 'Spain' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'BE', label: 'Belgium' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'AT', label: 'Austria' },
  { value: 'SE', label: 'Sweden' },
  { value: 'NO', label: 'Norway' },
  { value: 'DK', label: 'Denmark' },
  { value: 'FI', label: 'Finland' },
  { value: 'IE', label: 'Ireland' },
  { value: 'PT', label: 'Portugal' },
  { value: 'PL', label: 'Poland' },
  { value: 'CZ', label: 'Czech Republic' },
  { value: 'HU', label: 'Hungary' },
  { value: 'GR', label: 'Greece' },
  { value: 'TR', label: 'Turkey' },
  { value: 'RU', label: 'Russia' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'CN', label: 'China' },
  { value: 'IN', label: 'India' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
  { value: 'AR', label: 'Argentina' },
  { value: 'CL', label: 'Chile' },
  { value: 'CO', label: 'Colombia' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'EG', label: 'Egypt' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'KE', label: 'Kenya' },
  { value: 'GH', label: 'Ghana' },
  { value: 'MA', label: 'Morocco' },
  { value: 'TN', label: 'Tunisia' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'IL', label: 'Israel' },
  { value: 'SG', label: 'Singapore' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'TH', label: 'Thailand' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'PH', label: 'Philippines' },
  { value: 'VN', label: 'Vietnam' },
  { value: 'HK', label: 'Hong Kong' },
  { value: 'TW', label: 'Taiwan' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'OTHER', label: 'Other' }
];

// Form validation schema
const billingSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  streetAddress: yup.string().required('Street address is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State/Province is required'),
  country: yup.string().required('Country is required'),
  postalZip: yup.string()
    .required('Postal/ZIP code is required')
    .matches(/^[A-Za-z0-9\s-]+$/, 'Invalid postal/ZIP code format')
});

const fetcher = (url) => fetch(url).then((res) => res.json());

function PurchaseEvaluationPageContent() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  // Initialize state - will be updated by useEffect
  const [accountType, setAccountType] = useState('1-step');
  const [urlParams, setUrlParams] = useState({ size: null, step: null, planId: null });
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  const { data: plansData, error: plansError, isLoading: plansLoading } = useSWR('/api/plans', fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: false
  });

  const plans = useMemo(() => {
    const list = plansData?.plans || [];
    return [...list].sort((a, b) => (a.type === b.type ? a.size - b.size : a.type.localeCompare(b.type)));
  }, [plansData?.plans]);

  // Handle URL parameters with useEffect to avoid SSR issues
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const size = searchParams.get('size');
      const step = searchParams.get('step');
      const planId = searchParams.get('planId');

      setUrlParams({ size, step, planId });

      if (step && ['1-step', '2-step'].includes(step)) {
        setAccountType(step);
      } else if (step === 'one-phase') {
        setAccountType('1-step');
      } else if (step === 'two-phase') {
        setAccountType('2-step');
      }
    }
  }, []);

  useEffect(() => {
    if (!plans.length) return;

    const fromPlanId = urlParams.planId
      ? plans.find(plan => plan.id === urlParams.planId)
      : null;

    if (fromPlanId && fromPlanId.type === accountType) {
      setSelectedPlanId((prev) => (prev !== fromPlanId.id ? fromPlanId.id : prev));
      return;
    }

    const sizeNumber = urlParams.size ? Number(urlParams.size) : null;
    const fromSize = sizeNumber
      ? plans.find(plan => plan.size === sizeNumber && plan.type === accountType)
      : null;

    if (fromSize) {
      setSelectedPlanId((prev) => (prev !== fromSize.id ? fromSize.id : prev));
      return;
    }

    const firstOfType = plans.find(plan => plan.type === accountType);
    if (firstOfType) {
      setSelectedPlanId((prev) => (prev !== firstOfType.id ? firstOfType.id : prev));
    }
  }, [plans, accountType, urlParams.planId, urlParams.size]);

  const selectedPlan = useMemo(() => {
    return plans.find(plan => plan.id === selectedPlanId) || null;
  }, [plans, selectedPlanId]);

  const [affiliateCode, setAffiliateCode] = useState('');
  const [affiliateDiscount, setAffiliateDiscount] = useState(0);
  const [showPayModal, setShowPayModal] = useState(false);
  const [agreements, setAgreements] = useState({
    rulesAgreement: false,
    refundPolicy: false,
    agreeTerms: false
  });

  // Fetch affiliate validation
  const { data: affiliateData, mutate: mutateAffiliate } = useSWR(
    affiliateCode ? `/api/affiliates/validate?code=${affiliateCode}` : null,
    fetcher
  );

  // React Hook Form setup
  const methods = useForm({
    resolver: yupResolver(billingSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: user?.email?.address || '',
      streetAddress: '',
      city: '',
      state: '',
      country: 'US',
      postalZip: ''
    }
  });

  const { handleSubmit, formState: { errors, isValid }, watch } = methods;

  // Update email when user changes
  useEffect(() => {
    if (user?.email?.address) {
      methods.setValue('email', user?.email?.address);
    }
  }, [user?.email?.address, methods]);

  // Update affiliate discount when affiliate data changes
  useEffect(() => {
    if (affiliateData?.valid) {
      setAffiliateDiscount(affiliateData.discount || 10); // Default 10% discount
      toast.success(`Affiliate code applied! ${affiliateData.discount || 10}% discount`);
    } else if (affiliateData && !affiliateData.valid) {
      setAffiliateDiscount(0);
      toast.error('Invalid affiliate code');
    }
  }, [affiliateData]);

  const calculateTotal = () => {
    const planFee = Number(selectedPlan?.fee || 0);
    const addonsFee = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    const totalBeforeDiscount = planFee + addonsFee;
    const discount = (planFee * affiliateDiscount) / 100;
    return totalBeforeDiscount - discount;
  };

  const handleAffiliateCodeChange = (code) => {
    setAffiliateCode(code);
    mutateAffiliate();
  };

  const handlePurchase = async (data) => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push('/?error=unauth');
      return;
    }

    if (!agreements.rulesAgreement || !agreements.refundPolicy || !agreements.agreeTerms) {
      toast.error('Please agree to all terms and conditions');
      return;
    }

    // Store billing info in Supabase
    try {
      // Update existing user with billing info (user already exists from Clerk sync)
      const { error } = await supabase
        .from('users')
        .update({
          email: data.email,
          billing_info: {
            firstName: data.firstName,
            lastName: data.lastName,
            streetAddress: data.streetAddress,
            city: data.city,
            state: data.state,
            country: data.country,
            postalZip: data.postalZip
          }
        })
        .eq('user_id_text', user.id); // Update the user that matches Clerk ID

      if (error) {
        console.error('Error storing billing info:', error);
        toast.error('Failed to save billing information');
        return;
      }

      // Open payment modal
      if (!selectedPlan) {
        toast.error('Please select a plan before continuing');
        return;
      }

      setShowPayModal(true);

    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to process purchase');
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (plansError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white space-y-4">
          <p className="text-lg">Failed to load plans.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Purchase New Evaluation</h1>
          <p className="text-slate-400 text-lg">
            Start your trading journey with PolyProp&apos;s evaluation program
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Forms */}
          <div className="space-y-8">
            {/* Account Type Selection */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Select Evaluation Type</h2>
                <div className="flex rounded-lg overflow-hidden border border-slate-700">
                  <button
                    onClick={() => setAccountType('1-step')}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                      accountType === '1-step'
                        ? 'bg-teal-500/20 text-teal-300 border-r border-slate-700'
                        : 'bg-slate-900/40 text-slate-300 hover:text-white'
                    }`}
                    type="button"
                  >
                    1-Step
                  </button>
                  <button
                    onClick={() => setAccountType('2-step')}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                      accountType === '2-step'
                        ? 'bg-teal-500/20 text-teal-300'
                        : 'bg-slate-900/40 text-slate-300 hover:text-white'
                    }`}
                    type="button"
                  >
                    2-Step
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Choose Account Balance</h3>
                {plansLoading ? (
                  <div className="py-12 text-center text-slate-400">
                    Loading plans...
                  </div>
                ) : (
                  <AccountBalanceSelector
                    plans={plans}
                    filterType={accountType}
                    selectedPlanId={selectedPlanId}
                    onPlanSelect={setSelectedPlanId}
                  />
                )}
              </div>
            </div>

            {/* Billing Information */}
            <FormProvider {...methods}>
              <BillingForm />
            </FormProvider>

            {/* Affiliate Code */}
            <AffiliateExpander
              affiliateCode={affiliateCode}
              onCodeChange={handleAffiliateCodeChange}
              discount={affiliateDiscount}
            />

            {/* Add-Ons */}
            <AddOnsSection
              selectedAddons={selectedAddons}
              onAddonToggle={setSelectedAddons}
            />

            {/* Agreements */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Terms & Agreements</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="rules-agreement"
                    checked={agreements.rulesAgreement}
                    onChange={(e) => setAgreements(prev => ({ ...prev, rulesAgreement: e.target.checked }))}
                    className="mt-1 w-4 h-4 text-teal-400 bg-slate-700 border-slate-600 rounded focus:ring-teal-400"
                  />
                  <label htmlFor="rules-agreement" className="text-slate-300 text-sm">
                    I have read and understood, and agree to the Program&apos;s{' '}
                    <a href="#" className="text-teal-400 hover:text-teal-300 underline">
                      rules and Evaluation agreement
                    </a>
                  </label>
                </div>
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="refund-policy"
                    checked={agreements.refundPolicy}
                    onChange={(e) => setAgreements(prev => ({ ...prev, refundPolicy: e.target.checked }))}
                    className="mt-1 w-4 h-4 text-teal-400 bg-slate-700 border-slate-600 rounded focus:ring-teal-400"
                  />
                  <label htmlFor="refund-policy" className="text-slate-300 text-sm">
                    I agree to the{' '}
                    <a href="#" className="text-teal-400 hover:text-teal-300 underline">
                      Refund policy and chargeback policy
                    </a>
                  </label>
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="agree-terms"
                    checked={agreements.agreeTerms}
                    onChange={(e) => setAgreements(prev => ({ ...prev, agreeTerms: e.target.checked }))}
                    className="mt-1 w-4 h-4 text-teal-400 bg-slate-700 border-slate-600 rounded focus:ring-teal-400"
                  />
                  <label htmlFor="agree-terms" className="text-slate-300 text-sm flex-1">
                    I agree to the{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      Terms of Use
                    </a>
                    {' '}({' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      See Here
                    </a>
                    ),{' '}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      Privacy Policy
                    </a>
                    {' '}({' '}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      See Here
                    </a>
                    ) and am over the age of 18.<span className="text-red-500">*</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Purchase Button */}
            <button
              onClick={handleSubmit(handlePurchase)}
              disabled={!isValid || !agreements.rulesAgreement || !agreements.refundPolicy || !agreements.agreeTerms || !selectedPlan}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-4 px-6 rounded-lg font-semibold text-lg transition-colors"
            >
              {selectedPlan ? `Purchase Evaluation - $${calculateTotal().toFixed(2)}` : 'Select a Plan to Continue'}
            </button>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <OrderSummary
              selectedPlan={selectedPlan}
              affiliateDiscount={affiliateDiscount}
              selectedAddons={selectedAddons}
              total={calculateTotal()}
            />
          </div>
        </div>

        {/* Payment Modal */}
        {showPayModal && (
          <PayModal
            isOpen={showPayModal}
            onClose={() => setShowPayModal(false)}
            plan={{
              ...selectedPlan,
              fee: calculateTotal(),
              originalFee: selectedPlan.fee,
              userId: user?.id,
              addons: selectedAddons
            }}
            onSuccess={(result) => {
              toast.success('Purchase completed successfully!');
              setShowPayModal(false);
              router.push('/traders');
            }}
            onError={(error) => {
              toast.error(error || 'Payment failed');
            }}
          />
        )}

        <Toaster position="top-right" />
      </div>
    </div>
  );
}

export default function PurchaseEvaluationPage() {
  return <PurchaseEvaluationPageContent />;
}

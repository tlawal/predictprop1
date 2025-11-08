'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast, { Toaster } from 'react-hot-toast';

const experienceOptions = [
  {
    value: 'first-time',
    label: 'This will be my first prop firm or exchange collaboration'
  },
  {
    value: 'have-partnered',
    label: 'I’ve partnered with prop firms or centralized exchanges before'
  }
];

const schema = yup.object({
  name: yup.string().trim().required('Name is required'),
  email: yup
    .string()
    .trim()
    .email('Enter a valid email')
    .required('Email is required'),
  social_link: yup
    .string()
    .trim()
    .url('Enter a valid URL')
    .optional()
    .nullable()
    .transform((value) => (value === '' ? null : value)),
  audience_size: yup
    .number()
    .typeError('Enter a valid number')
    .positive('Must be greater than zero')
    .integer('Use whole numbers only')
    .optional()
    .nullable()
    .transform((value) => (value === '' || value === null ? null : value)),
  previous_partnership: yup
    .string()
    .oneOf(experienceOptions.map((option) => option.value))
    .required('Let us know about your past sponsorship experience'),
  promotion_method: yup
    .string()
    .trim()
    .min(100, 'Please provide at least 100 characters describing your promotion plan')
    .required('Tell us how you will promote PolyProp')
});

export default function AffiliateForm() {
  const { user, isSignedIn } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultName = useMemo(() => {
    if (!user) return '';
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
    if (fullName) return fullName;
    if (user.username) return user.username;
    return user.primaryEmailAddress?.emailAddress?.split('@')[0] || '';
  }, [user]);

  const defaultEmail = user?.primaryEmailAddress?.emailAddress || '';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: defaultName,
      email: defaultEmail,
      social_link: '',
      audience_size: '',
      previous_partnership: experienceOptions[0].value,
      promotion_method: ''
    }
  });

  useEffect(() => {
    reset((currentValues) => ({
      ...currentValues,
      name: defaultName,
      email: defaultEmail
    }));
  }, [defaultName, defaultEmail, reset]);

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/affiliates/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          userId: user?.id || null
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || 'Failed to submit application');
      }

      toast.success('Application submitted—awaiting approval');
      reset({
        name: defaultName,
        email: defaultEmail,
        social_link: '',
        audience_size: '',
        previous_partnership: experienceOptions[0].value,
        promotion_method: ''
      });
    } catch (error) {
      console.error('Affiliate application error:', error);
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Apply to become an affiliate</h3>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Complete the form and our team will review your application within 1-2 business days.
        </p>
      </div>

      {!isSignedIn && (
        <div className="mb-6 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
          <p className="font-medium">Login to apply faster</p>
          <p className="mt-1">
            Sign in with your PolyProp account to auto-fill your details and track your application status.
          </p>
          <div className="mt-3">
            <SignInButton mode="modal">
              <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Sign in with Clerk
              </button>
            </SignInButton>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="name">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              placeholder="Jane Doe"
              {...register('name')}
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="email">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              placeholder="you@example.com"
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="social_link">
            Primary social link (YouTube, X, TikTok, Substack, etc.)
          </label>
          <input
            id="social_link"
            type="url"
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            placeholder="https://twitter.com/yourhandle"
            {...register('social_link')}
          />
          {errors.social_link && <p className="mt-1 text-sm text-red-500">{errors.social_link.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="audience_size">
              Audience size (followers / subscribers)
            </label>
            <input
              id="audience_size"
              type="number"
              min={0}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              placeholder="e.g. 25,000"
              {...register('audience_size')}
            />
            {errors.audience_size && <p className="mt-1 text-sm text-red-500">{errors.audience_size.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="previous_partnership">
              Prior sponsorship experience
            </label>
            <select
              id="previous_partnership"
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              {...register('previous_partnership')}
            >
              {experienceOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.previous_partnership && (
              <p className="mt-1 text-sm text-red-500">{errors.previous_partnership.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="promotion_method">
            How will you promote PolyProp? <span className="text-red-500">*</span>
          </label>
          <textarea
            id="promotion_method"
            minLength={100}
            rows={5}
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            placeholder="Share on YouTube with tutorials on prediction strategies..."
            {...register('promotion_method')}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Minimum 100 characters. Share audience size, platforms, and content ideas so we can best support you.
          </p>
          {errors.promotion_method && (
            <p className="mt-1 text-sm text-red-500">{errors.promotion_method.message}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isSubmitting ? 'Submitting…' : 'Apply Now'}
          </button>
        </div>
      </form>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#ffffff',
            border: '1px solid #374151'
          }
        }}
      />
    </div>
  );
}

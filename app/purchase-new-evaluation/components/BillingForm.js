import React from 'react';
import { useFormContext } from 'react-hook-form';
import Select from 'react-select';

const BillingForm = () => {
  const { register, formState: { errors }, setValue, watch } = useFormContext();
  const selectedCountry = watch('country');

  // Custom styles for react-select to match dark theme
  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: 'rgb(51 65 85)', // slate-700
      borderColor: state.isFocused ? 'rgb(20 184 166)' : 'rgb(71 85 105)', // teal-400 : slate-600
      borderRadius: '0.5rem',
      minHeight: '3rem',
      boxShadow: state.isFocused ? '0 0 0 1px rgb(20 184 166)' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? 'rgb(20 184 166)' : 'rgb(100 116 139)', // slate-500
      }
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'rgb(203 213 225)', // slate-300
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'rgb(148 163 184)', // slate-400
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'rgb(51 65 85)', // slate-700
      borderRadius: '0.5rem',
      border: '1px solid rgb(71 85 105)', // slate-600
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? 'rgb(20 184 166)' // teal-400
        : state.isFocused
        ? 'rgb(71 85 105)' // slate-600
        : 'transparent',
      color: state.isSelected ? 'white' : 'rgb(203 213 225)', // slate-300
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: state.isSelected ? 'rgb(20 184 166)' : 'rgb(71 85 105)',
      }
    }),
    input: (provided) => ({
      ...provided,
      color: 'rgb(203 213 225)', // slate-300
    }),
  };

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

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Billing Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name */}
        <div className="md:col-span-1">
          <label htmlFor="firstName" className="block text-sm font-medium text-slate-300 mb-2">
            First Name *
          </label>
          <input
            {...register('firstName')}
            type="text"
            id="firstName"
            className={`w-full px-3 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${
              errors.firstName ? 'border-red-500' : 'border-slate-600'
            }`}
            placeholder="Enter your first name"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-400">{errors.firstName.message}</p>
          )}
        </div>

        {/* Last Name */}
        <div className="md:col-span-1">
          <label htmlFor="lastName" className="block text-sm font-medium text-slate-300 mb-2">
            Last Name *
          </label>
          <input
            {...register('lastName')}
            type="text"
            id="lastName"
            className={`w-full px-3 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${
              errors.lastName ? 'border-red-500' : 'border-slate-600'
            }`}
            placeholder="Enter your last name"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-400">{errors.lastName.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="md:col-span-2">
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
            Email Address *
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            className={`w-full px-3 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${
              errors.email ? 'border-red-500' : 'border-slate-600'
            }`}
            placeholder="Enter your email address"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
          )}
        </div>

        {/* Street Address */}
        <div className="md:col-span-2">
          <label htmlFor="streetAddress" className="block text-sm font-medium text-slate-300 mb-2">
            Street Address *
          </label>
          <input
            {...register('streetAddress')}
            type="text"
            id="streetAddress"
            className={`w-full px-3 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${
              errors.streetAddress ? 'border-red-500' : 'border-slate-600'
            }`}
            placeholder="Enter your street address"
          />
          {errors.streetAddress && (
            <p className="mt-1 text-sm text-red-400">{errors.streetAddress.message}</p>
          )}
        </div>

        {/* City */}
        <div className="md:col-span-1">
          <label htmlFor="city" className="block text-sm font-medium text-slate-300 mb-2">
            City *
          </label>
          <input
            {...register('city')}
            type="text"
            id="city"
            className={`w-full px-3 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${
              errors.city ? 'border-red-500' : 'border-slate-600'
            }`}
            placeholder="Enter your city"
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-400">{errors.city.message}</p>
          )}
        </div>

        {/* State/Province */}
        <div className="md:col-span-1">
          <label htmlFor="state" className="block text-sm font-medium text-slate-300 mb-2">
            State/Province *
          </label>
          {selectedCountry === 'US' ? (
            <Select
              options={US_STATES}
              onChange={(option) => setValue('state', option?.value || '')}
              styles={selectStyles}
              placeholder="Select state"
              className="react-select-container"
              classNamePrefix="react-select"
            />
          ) : (
            <input
              {...register('state')}
              type="text"
              id="state"
              className={`w-full px-3 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${
                errors.state ? 'border-red-500' : 'border-slate-600'
              }`}
              placeholder="Enter state/province"
            />
          )}
          {errors.state && (
            <p className="mt-1 text-sm text-red-400">{errors.state.message}</p>
          )}
        </div>

        {/* Country */}
        <div className="md:col-span-1">
          <label htmlFor="country" className="block text-sm font-medium text-slate-300 mb-2">
            Country *
          </label>
          <Select
            options={COUNTRIES}
            onChange={(option) => setValue('country', option?.value || '')}
            styles={selectStyles}
            placeholder="Select country"
            defaultValue={COUNTRIES.find(country => country.value === 'US')}
            className="react-select-container"
            classNamePrefix="react-select"
          />
          {errors.country && (
            <p className="mt-1 text-sm text-red-400">{errors.country.message}</p>
          )}
        </div>

        {/* Postal/ZIP Code */}
        <div className="md:col-span-1">
          <label htmlFor="postalZip" className="block text-sm font-medium text-slate-300 mb-2">
            Postal/ZIP Code *
          </label>
          <input
            {...register('postalZip')}
            type="text"
            id="postalZip"
            className={`w-full px-3 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${
              errors.postalZip ? 'border-red-500' : 'border-slate-600'
            }`}
            placeholder={selectedCountry === 'US' ? '12345' : 'Enter postal code'}
          />
          {errors.postalZip && (
            <p className="mt-1 text-sm text-red-400">{errors.postalZip.message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingForm;

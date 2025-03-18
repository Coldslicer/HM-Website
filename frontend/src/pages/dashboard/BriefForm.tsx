/* ================ [ IMPORTS ] ================ */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCampaignStore } from '../../store/campaignStore';
import { SUPABASE_CLIENT } from '../../lib/supabase';

/* ================ [ INITIAL STATE ] ================ */

const initialFormData = {
  company_name: '',
  website: '',
  company_address: '',
  company_description: '',
  company_phone: '',
  name: '',
  rep_name: '',
  date: '',
  per_influencer_budget: [] as string[],
  desired_pricing_model: [] as string[],
  sponsorship_format: [] as string[],
  niches: [] as string[],
  brief_url: '',
};

/* ================ [ BRIEF FORM COMPONENT ] ================ */

export function BriefForm() {
  const { currentCampaign, setCurrentCampaign } = useCampaignStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [niches, setNiches] = useState<{ name: string | null; discord_webhook_url: string }[]>([]);
  const [roles, setRoles] = useState<{ value: string | null; key: string }[]>([]);
  const [error, setError] = useState('');

  /* ================ [ EFFECT HOOKS ] ================ */

  useEffect(() => {
    const fetchNiches = async () => {
      const { data, error } = await SUPABASE_CLIENT
        .from('niches')
        .select('*');
      if (error) console.error('Error fetching niches:', error);
      else setNiches(data || []);
    };

    const fetchRoles = async () => {
      const { data, error } = await SUPABASE_CLIENT
        .from('roles')
        .select('*');
      if (error) console.error('Error fetching roles:', error);
      else setRoles(data || []);
    };

    const fetchMostRecentCampaign = async () => {
      if (!user) return;

      const { data } = await SUPABASE_CLIENT
        .from('campaigns')
        .select('*')
        .eq('client_id', user.id)
        .neq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data?.[0] && (currentCampaign == null || currentCampaign?.status === 'draft')) {
        setFormData(prev => ({
          ...prev,
          company_name: data[0].company_name || '',
          website: data[0].website || '',
          company_address: data[0].company_address || '',
          company_description: data[0].company_description || '',
          company_phone: data[0].company_phone || '',
        }));
      }
    };

    // Initialize form data
    if (currentCampaign) {
      setFormData({
        company_name: currentCampaign.company_name,
        website: currentCampaign.website,
        company_address: currentCampaign.company_address || '',
        company_description: currentCampaign.company_description,
        company_phone: currentCampaign.company_phone || '',
        name: currentCampaign.name,
        rep_name: currentCampaign.rep_name,
        per_influencer_budget: currentCampaign.per_influencer_budget,
        sponsorship_format: currentCampaign.sponsorship_format,
        desired_pricing_model: currentCampaign.desired_pricing_model,
        date: currentCampaign.date,
        niches: currentCampaign.niches,
        brief_url: currentCampaign.brief_url,
      });
    } else {
      setFormData(initialFormData);
      fetchMostRecentCampaign();
    }

    fetchNiches();
    fetchRoles();
  }, [currentCampaign, user]);

  /* ================ [ HANDLERS ] ================ */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data } = await SUPABASE_CLIENT
        .from('campaigns')
        .insert([{
          client_id: user.id,
          ...formData,
          status: 'brief_submitted',
        }])
        .select()
        .single();

      setCurrentCampaign({ id: data.id, ...formData, created_at: data.created_at });
      
      // ... rest of submit handler remains unchanged ...
    } catch (error) {
      console.error('Error submitting brief:', error);
    }
  };

  const handleNicheToggle = (niche: string) => {
    setFormData((prev) => ({
      ...prev,
      niches: prev.niches.includes(niche)
        ? prev.niches.filter((n) => n !== niche)
        : [...prev.niches, niche],
    }));
  };

  const handleBudgetToggle = (value: 'regular' | 'large') => {
    setFormData((prev) => ({
      ...prev,
      per_influencer_budget: prev.per_influencer_budget.includes(value)
        ? prev.per_influencer_budget.filter((v) => v !== value)
        : [...prev.per_influencer_budget, value],
    }));
  };

  const handlePricingToggle = (value: 'Flat-rate' | 'CPM (first 30d)' | 'Hybrid') => {
    setFormData((prev) => ({
      ...prev,
      desired_pricing_model: prev.desired_pricing_model.includes(value)
        ? prev.desired_pricing_model.filter((v) => v !== value)
        : [...prev.desired_pricing_model, value],
    }));
  };

  const handleSponsorshipFormatToggle = (value: '30s' | '60s' | 'Shortform' | 'Dedicated') => {
    setFormData((prev) => ({
      ...prev,
      sponsorship_format: prev.sponsorship_format.includes(value)
        ? prev.sponsorship_format.filter((v) => v !== value)
        : [...prev.sponsorship_format, value],
    }));
  };

  /* ================ [ READ-ONLY VIEW ] ================ */

  if (currentCampaign != null && currentCampaign?.status !== 'draft') {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-black mb-6">Campaign Brief</h2>
        <div className="bg-gray-50 p-6 rounded-lg">
          <dl className="space-y-4">
            <h3 className="text-2x font-bold text-black mb-6">Brand Information</h3>
            
            {/* Company Name */}
            <div>
              <dt className="text-sm font-medium text-black-400">Brand Name</dt>
              <dd className="text-black">{currentCampaign.company_name}</dd>
            </div>

            {/* Brand Website */}
            <div>
              <dt className="text-sm font-medium text-black-400">Brand Website</dt>
              <dd className="text-black">{currentCampaign.website}</dd>
            </div>

            {/* Brand Address */}
            {/* <div>
              <dt className="text-sm font-medium text-black-400">Brand Address</dt>
              <dd className="text-black">{currentCampaign.company_address}</dd>
            </div> */}

            {/* Brand Description */}
            <div>
              <dt className="text-sm font-medium text-black-400">Brand Description</dt>
              <dd className="text-black">{currentCampaign.company_description}</dd>
            </div>

            {/* Representative Name */}
            <div>
              <dt className="text-sm font-medium text-black-400">Representative Name</dt>
              <dd className="text-black">{currentCampaign.rep_name}</dd>
            </div>

            {/* Company Phone */}
            {/* <div>
              <dt className="text-sm font-medium text-black-400">Company Phone</dt>
              <dd className="text-black">{currentCampaign.company_phone}</dd>
            </div> */}

            <h3 className="text-2x font-bold text-black mb-6">Campaign Information</h3>
            <div>
              <dt className="text-sm font-medium text-black-400">Campaign Name</dt>
              <dd className="text-black">{currentCampaign.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-black-400">Posting Date</dt>
              <dd className="text-black">{currentCampaign.date}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-black-400">Niches</dt>
              <dd className="text-black">
                {currentCampaign.niches.join(', ')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-black-400">Per-Influencer Budget</dt>
              <dd className="text-black">
                {currentCampaign.per_influencer_budget.join(', ')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-black-400">Brief URL</dt>
              <dd>
                <a
                  href={currentCampaign.brief_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:text-orange-400"
                >
                  View Brief
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    );
  }

  /* ================ [ FORM UI ] ================ */

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-black mb-6">Campaign Brief</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <h3 className="text-2x font-bold text-black mb-6">Brand Information</h3>

        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-black-200">Brand Name</label>
          <input
            type="text"
            value={formData.company_name}
            onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            placeholder="e.g., Acme Corp"
            required
          />
        </div>

        {/* Brand Website */}
        <div>
          <label className="block text-sm font-medium text-black-200">Brand Website</label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            placeholder="e.g., https://www.acmecorp.com"
            required
          />
        </div>

        {/* Brand Address */}
        {/* <div>
          <label className="block text-sm font-medium text-black-200">Brand Address</label>
          <input
            type="text"
            value={formData.company_address}
            onChange={(e) => setFormData(prev => ({ ...prev, company_address: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            placeholder="e.g., 123 Main St, City, State, ZIP"
          />
        </div> */}

        {/* Brand Description */}
        <div>
          <label className="block text-sm font-medium text-black-200">Brand Description</label>
          <textarea
            value={formData.company_description}
            onChange={(e) => setFormData(prev => ({ ...prev, company_description: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            placeholder="e.g., Acme Corp is a leading provider of innovative solutions..."
            required
          />
        </div>

        {/* Representative Name */}
        <div>
          <label className="block text-sm font-medium text-black-200">Representative Name</label>
          <input
            type="text"
            value={formData.rep_name}
            onChange={(e) => setFormData(prev => ({ ...prev, rep_name: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            placeholder="e.g., John Doe"
            required
          />
        </div>

        {/* Company Phone */}
        {/* <div>
          <label className="block text-sm font-medium text-black-200">Company Phone</label>
          <input
            type="tel"
            value={formData.company_phone}
            onChange={(e) => setFormData(prev => ({ ...prev, company_phone: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            placeholder="e.g., +1 (555) 123-4567"
          />
        </div> */}

        <br />
        <h3 className="text-2x font-bold text-black mb-6">Campaign Information</h3>

        {/* Campaign Name */}
        <div>
          <label className="block text-sm font-medium text-black-200">Campaign Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[a-zA-Z0-9 ]*$/.test(value)) {
                setFormData((prev) => ({ ...prev, name: value }));
                setError('');
              } else {
                setError('Campaign name can only contain letters, numbers, and spaces.');
              }
            }}
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            placeholder="e.g., Summer 2023 Product Launch"
            required
          />
          <p className="text-sm text-black-400 mt-1">
            Should be something descriptive, only containing letters, numbers, and spaces.
          </p>
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>

        {/* Brief URL */}
        <div>
          <label className="block text-sm font-medium text-black-200">Brief URL</label>
          <input
            type="url"
            value={formData.brief_url}
            onChange={(e) => setFormData(prev => ({ ...prev, brief_url: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            placeholder="e.g., https://docs.google.com/document/d/1xAh64H5T87aQ7JCEuiBbQEYxNg9lNJ5DR7gKX-13Je0/edit"
            required
          />
          <p className="text-sm text-black-400 mt-1">
            Here's a template to help you write the perfect brief:{" "}
            <a
              href="https://docs.google.com/document/d/1xAh64H5T87aQ7JCEuiBbQEYxNg9lNJ5DR7gKX-13Je0/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              LINK
            </a>
          </p>
        </div>

        {/* Posting Date */}
        <div>
          <label className="block text-sm font-medium text-black-200">Posting Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            required
          />
        </div>

        {/* Niches */}
        <div>
          <label className="block text-sm font-medium text-black-200 mb-2">Niches</label>
          <div className="flex flex-wrap gap-2">
            {niches.filter((niche) => niche.name !== null).map((niche) => (
              <button
                key={niche.name}
                type="button"
                onClick={() => handleNicheToggle(niche.name!)}
                className={`px-4 py-2 rounded-full transition-all duration-200 border
                  ${
                    formData.niches.includes(niche.name!)
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-white border-gray-300 text-black hover:bg-gray-50'
                  }`}
              >
                <span className="text-sm font-medium">{niche.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Influencer Size */}
        <div>
          <label className="block text-sm font-medium text-black-200 mb-2">Influencer Size</label>
          <div className="grid grid-cols-2 gap-4">
            {/* Small Influencers Card */}
            <div
              onClick={() => handleBudgetToggle('regular')}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200
                ${
                  formData.per_influencer_budget.includes('regular')
                    ? 'border-orange-500 bg-orange-50 shadow-orange-sm'
                    : 'border-gray-200 bg-white hover:border-orange-300'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-black font-medium">Standard Influencers</span>
                <div className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors
                  ${
            formData.per_influencer_budget.includes('regular')
              ? 'bg-orange-500'
              : 'bg-gray-100 border-2 border-gray-300'
          }`}
        >
          {formData.per_influencer_budget.includes('regular') && (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        Want to make meaningful impressions on viewers? Click this to choose from our standard influencer options!
      </p>
    </div>

    {/* Large Influencers Card */}
    <div
      onClick={() => handleBudgetToggle('large')}
      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200
        ${
          formData.per_influencer_budget.includes('large')
            ? 'border-orange-500 bg-orange-50 shadow-orange-sm'
            : 'border-gray-200 bg-white hover:border-orange-300'
        }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-black font-medium">Large Influencers</span>
        <div className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors
          ${
            formData.per_influencer_budget.includes('large')
              ? 'bg-orange-500'
              : 'bg-gray-100 border-2 border-gray-300'
          }`}
        >
          {formData.per_influencer_budget.includes('large') && (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        Need to bring out the big guns? Click this to reach out to our largest influencers! ($1000+ per influencer)
      </p>
    </div>
  </div>
</div>

<div>
  <label className="block text-sm font-medium text-black-200 mb-2">
    Pricing Model
  </label>
  <div className="grid grid-cols-3 gap-4">
    {/* Flat-rate Card */}
    <div
      onClick={() => handlePricingToggle('Flat-rate')}
      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200
        ${
          formData.desired_pricing_model.includes('Flat-rate')
            ? 'border-orange-500 bg-orange-50 shadow-orange-sm'
            : 'border-gray-200 bg-white hover:border-orange-300'
        }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-black font-medium">Flat-rate</span>
        <div className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors
          ${
            formData.desired_pricing_model.includes('Flat-rate')
              ? 'bg-orange-500'
              : 'bg-gray-100 border-2 border-gray-300'
          }`}
        >
          {formData.desired_pricing_model.includes('Flat-rate') && (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        Fixed payment for the campaign
      </p>
    </div>

    {/* CPM (first 30d) Card */}
    <div
      onClick={() => handlePricingToggle('CPM (first 30d)')}
      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200
        ${
          formData.desired_pricing_model.includes('CPM (first 30d)')
            ? 'border-orange-500 bg-orange-50 shadow-orange-sm'
            : 'border-gray-200 bg-white hover:border-orange-300'
        }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-black font-medium">CPM (first 30d)</span>
        <div className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors
          ${
            formData.desired_pricing_model.includes('CPM (first 30d)')
              ? 'bg-orange-500'
              : 'bg-gray-100 border-2 border-gray-300'
          }`}
        >
          {formData.desired_pricing_model.includes('CPM (first 30d)') && (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        Cost per thousand views for the first 30 days
      </p>
    </div>

    {/* Hybrid Card */}
    <div
      onClick={() => handlePricingToggle('Hybrid')}
      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200
        ${
          formData.desired_pricing_model.includes('Hybrid')
            ? 'border-orange-500 bg-orange-50 shadow-orange-sm'
            : 'border-gray-200 bg-white hover:border-orange-300'
        }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-black font-medium">Hybrid</span>
        <div className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors
          ${
            formData.desired_pricing_model.includes('Hybrid')
              ? 'bg-orange-500'
              : 'bg-gray-100 border-2 border-gray-300'
          }`}
        >
          {formData.desired_pricing_model.includes('Hybrid') && (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        Combination of flat-rate and CPM pricing
      </p>
    </div>
  </div>
</div>

<div>
  <label className="block text-sm font-medium text-black-200 mb-2">
    Sponsorship Types
  </label>
  <div className="grid grid-cols-4 gap-4">
    {/* 30 s */}
    <div
      onClick={() => handleSponsorshipFormatToggle('30s')}
      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200
        ${
          formData.sponsorship_format.includes('30s')
            ? 'border-orange-500 bg-orange-50 shadow-orange-sm'
            : 'border-gray-200 bg-white hover:border-orange-300'
        }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-black font-medium">30s Integration</span>
        <div className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors
          ${
            formData.sponsorship_format.includes('30s')
              ? 'bg-orange-500'
              : 'bg-gray-100 border-2 border-gray-300'
          }`}
        >
          {formData.sponsorship_format.includes('30s') && (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        30 second sponsored segment in a long form video
      </p>
    </div>

    {/* 60 s*/}
    <div
      onClick={() => handleSponsorshipFormatToggle('60s')}
      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200
        ${
          formData.sponsorship_format.includes('60s')
            ? 'border-orange-500 bg-orange-50 shadow-orange-sm'
            : 'border-gray-200 bg-white hover:border-orange-300'
        }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-black font-medium">60s Integration</span>
        <div className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors
          ${
            formData.sponsorship_format.includes('60s')
              ? 'bg-orange-500'
              : 'bg-gray-100 border-2 border-gray-300'
          }`}
        >
          {formData.sponsorship_format.includes('60s') && (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-2">
      60 second sponsored segment in a long form video
      </p>
    </div>

    {/*Shortform */}
    <div
      onClick={() => handleSponsorshipFormatToggle('Shortform')}
      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200
        ${
          formData.sponsorship_format.includes('Shortform')
            ? 'border-orange-500 bg-orange-50 shadow-orange-sm'
            : 'border-gray-200 bg-white hover:border-orange-300'
        }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-black font-medium">Shortform</span>
        <div className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors
          ${
            formData.sponsorship_format.includes('Shortform')
              ? 'bg-orange-500'
              : 'bg-gray-100 border-2 border-gray-300'
          }`}
        >
          {formData.sponsorship_format.includes('Shortform') && (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        A short-form (scrolling) format video about your product or service
      </p>
    </div>
    {/*Dedicated */}
    <div
      onClick={() => handleSponsorshipFormatToggle('Dedicated')}
      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200
        ${
          formData.sponsorship_format.includes('Dedicated')
            ? 'border-orange-500 bg-orange-50 shadow-orange-sm'
            : 'border-gray-200 bg-white hover:border-orange-300'
        }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-black font-medium">Dedicated Video</span>
        <div className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors
          ${
            formData.sponsorship_format.includes('Dedicated')
              ? 'bg-orange-500'
              : 'bg-gray-100 border-2 border-gray-300'
          }`}
        >
          {formData.sponsorship_format.includes('Dedicated') && (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        A full length video about your product or service!
      </p>
    </div>
  </div>
</div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          Submit Brief
        </button>
      </form>
    </div>
  );
}


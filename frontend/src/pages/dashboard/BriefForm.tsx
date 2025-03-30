/* ================ [ IMPORTS ] ================ */

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuthStore } from "../../store/authStore";
import { useCampaignStore } from "../../store/campaignStore";
import { SUPABASE_CLIENT } from "../../lib/supabase";

/* ================ [ FORM CONTENTS ] ================ */

const contents = {
  company_name: "",
  website: "",
  company_address: "",
  company_description: "",
  company_phone: "",
  name: "",
  rep_name: "",
  date: "",
  per_influencer_budget: [] as string[],
  desired_pricing_model: [] as string[],
  sponsorship_format: [] as string[],
  niches: [] as string[],
  brief_url: "",
};

/* ================ [ BRIEF FORM ] ================ */

export function BriefForm() {
  // Helper functions
  const { currentCampaign, setCurrentCampaign } = useCampaignStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // State variables
  const [formData, setFormData] = useState(contents);
  const [niches, setNiches] = useState<
    { name: string | null; discord_webhook_url: string }[]
  >([]);
  const [roles, setRoles] = useState<{ value: string | null; key: string }[]>(
    []
  );
  const [error, setError] = useState("");
  const [clientServers, setClientServers] = useState<string[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);

  // Persistent form data
  useEffect(() => {
    const savedData = localStorage.getItem("formData");
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  }, []);

  // Save form data
  useEffect(() => {
    localStorage.setItem("formData", JSON.stringify(formData));
  }, [formData]);

  // Fetch niche types
  const fetchNiches = async (serverId: string | null) => {
    if (!serverId) return;

    const { data, error } = await SUPABASE_CLIENT.from("niches")
      .select("*") // Select only the name field
      .eq("server_id", serverId)
      .neq("name", null);

    if (error) {
      console.error("Error fetching niches:", error);
    } else {
      setNiches(data || []);
    }
  };

  // Fetch discord roles
  const fetchRoles = async (serverId: string | null) => {
    const { data, error } = await SUPABASE_CLIENT.from("roles")
      .select("*")
      .eq("server_id", serverId);
    if (error) console.error("Error fetching roles:", error);
    else setRoles(data || []);
  };

  useEffect(() => {
    const fetchClientServers = async () => {
      if (!user) return;

      const { data, error } = await SUPABASE_CLIENT.from("clients")
        .select("servers")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching client servers:", error);
      } else {
        const serversArray = data?.servers || [];
        setClientServers(serversArray);

        // If there's only one server, automatically set the campaign's server_id.
        if (serversArray.length === 1) {
          setSelectedServer(serversArray[0]);
          setFormData((prev) => ({ ...prev, server_id: serversArray[0] }));
          setFormData((prev) => ({ ...prev, server_id: serversArray[0] }));
          // Optionally, update the currentCampaign if it exists.
          if (currentCampaign && !currentCampaign.server_id) {
            setCurrentCampaign((prev) => ({
              ...prev,
              server_id: serversArray[0],
            }));
          }
        }
      }
    };

    const fetchMostRecentCampaign = async () => {
      if (!user) return;

      const { data } = await SUPABASE_CLIENT.from("campaigns")
        .select("*")
        .eq("client_id", user.id)
        .neq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(1);

      if (
        data?.[0] &&
        (currentCampaign == null || currentCampaign?.status === "draft")
      ) {
        setFormData((prev) => ({
          ...prev,
          company_name: data[0].company_name || "",
          website: data[0].website || "",
          company_address: data[0].company_address || "",
          company_description: data[0].company_description || "",
          company_phone: data[0].company_phone || "",
        }));
      }
    };

    // Initialize form data
    if (currentCampaign) {
      setFormData({
        company_name: currentCampaign.company_name,
        website: currentCampaign.website,
        company_address: currentCampaign.company_address || "",
        company_description: currentCampaign.company_description,
        company_phone: currentCampaign.company_phone || "",
        name: currentCampaign.name,
        rep_name: currentCampaign.rep_name,
        per_influencer_budget: currentCampaign.per_influencer_budget,
        sponsorship_format: currentCampaign.sponsorship_format,
        desired_pricing_model: currentCampaign.desired_pricing_model,
        date: currentCampaign.date,
        niches: currentCampaign.niches || [],
        brief_url: currentCampaign.brief_url,
      });
    } else {
      setFormData(contents);
      fetchMostRecentCampaign();
    }

    fetchClientServers();
    if (clientServers.length > 0) {
      setSelectedServer(clientServers[0]);
    }
  }, [currentCampaign, user]);

  useEffect(() => {
    console.log(selectedServer);
    fetchNiches(selectedServer);
    fetchRoles(selectedServer);
    formData.niches = [];
  }, [selectedServer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!/^[a-zA-Z0-9 ]+$/.test(formData.name)) {
      setError("Campaign name can only contain letters, numbers, and spaces.");
      return;
    }

    try {
      const campaign = {
        client_id: user.id,
        ...formData,
        status: "brief_submitted",
        server_id: selectedServer, // Keeping this from the second function
      };

      const { data, error } = await SUPABASE_CLIENT.from("campaigns")
        .insert([campaign])
        .select()
        .single();

      if (error) throw error;

      const campaignInfo = {
        id: data.id,
        ...campaign,
        created_at: data.created_at,
      };

      setCurrentCampaign(campaignInfo);

      const baseUrl = window.location.origin; // Dynamically get the base URL
      let formattedMessage = "";
      for (const role of roles) {
        if (formData.per_influencer_budget.includes(role.id))
          formattedMessage += role.value + " \n";
      }
      formattedMessage += `

# Sponsorship Offer from **${formData.company_name}**

- ${formData.company_description}

- ${
        formData.website.startsWith("https://")
          ? `[WEBSITE LINK](${formData.website})`
          : formData.website
      }

## Key Campaign Details

**Brief**
- ${
        formData.brief_url.startsWith("https://")
          ? `[BRIEF LINK](${formData.brief_url})`
          : formData.brief_url
      }

**Deliberable Type Options**
${formData.sponsorship_format.map((format) => `- ${format}`).join("\n")}

**Payment Format Options**
${formData.desired_pricing_model.map((model) => `- ${model}`).join("\n")}

**Timeline**
- ${
        formData.date == "flexible"
          ? "flexible posting: you can work it into your posting schedule"
          : `All sponsored videos will be posted by ${formData.date}`
      }

## **To Declare Your Commitment React Below and [FILL OUT THIS FORM](${baseUrl}/creator-form?campaignName=${encodeURIComponent(
        formData.name
      )})** 
### **OR** React to this message to get a customized link with QoL features such as prefill
`;

      // Send to selected niches' webhooks
      const selectedNiches = niches.filter((niche) =>
        formData.niches.includes(niche.name!)
      );
      for (const niche of selectedNiches) {
        await fetch("/api/messages/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channelId: niche.channel_id,
            message: formattedMessage,
          }),
        });
      }

      // Additionally send to the NULL niche's webhook
      const nullChannel = niches.find(
        (niche) => niche.name === null
      )?.channel_id;
      if (nullChannel) {
        await fetch("/api/messages/send-brief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channelId: nullChannel,
            message: formattedMessage,
          }),
        });
      } else {
        console.error(
          "No webhook found for NULL niche, could not post to the all sponsorships channel."
        );
      }

      navigate("/dashboard/creators");
    } catch (error) {
      console.error("Error submitting brief:", error);
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

  const handleRoleToggle = (value) => {
    setFormData((prev) => ({
      ...prev,
      per_influencer_budget: prev.per_influencer_budget.includes(value)
        ? prev.per_influencer_budget.filter((v) => v !== value)
        : [...prev.per_influencer_budget, value],
    }));
  };

  const handlePricingToggle = (
    value: "Flat-rate" | "CPM (first 30d)" | "Hybrid"
  ) => {
    setFormData((prev) => ({
      ...prev,
      desired_pricing_model: prev.desired_pricing_model.includes(value)
        ? prev.desired_pricing_model.filter((v) => v !== value)
        : [...prev.desired_pricing_model, value],
    }));
  };

  const handleSponsorshipFormatToggle = (
    value: "30s" | "60s" | "Shortform" | "Dedicated"
  ) => {
    setFormData((prev) => ({
      ...prev,
      sponsorship_format: prev.sponsorship_format.includes(value)
        ? prev.sponsorship_format.filter((v) => v !== value)
        : [...prev.sponsorship_format, value],
    }));
  };

  // Completed brief
  if (currentCampaign != null && currentCampaign?.status !== "draft") {
    return (
      <div className="w-full p-6 space-y-6">
        <h2 className="text-3xl font-bold text-gray-800">Campaign Brief</h2>

        <div className="grid grid-cols-1 gap-8">
          {/* Brand Information Card */}
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              Brand Information
            </h3>

            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-700">
                  Brand Name
                </dt>
                <dd className="mt-1 text-gray-600">
                  {currentCampaign.company_name}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-700">
                  Brand Website
                </dt>
                <dd className="mt-1 text-gray-600">
                  {currentCampaign.website}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-700">
                  Brand Description
                </dt>
                <dd className="mt-1 text-gray-600">
                  {currentCampaign.company_description}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-700">
                  Representative Name
                </dt>
                <dd className="mt-1 text-gray-600">
                  {currentCampaign.rep_name}
                </dd>
              </div>
            </dl>
          </div>

          {/* Campaign Information Card */}
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              Campaign Information
            </h3>

            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-700">
                  Campaign Name
                </dt>
                <dd className="mt-1 text-gray-600">{currentCampaign.name}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-700">
                  Posting Date
                </dt>
                <dd className="mt-1 text-gray-600">{currentCampaign.date}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-700">Channels</dt>
                <dd className="mt-1 text-gray-600">
                  {currentCampaign.niches.join(", ")}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-700">
                  Per-Influencer Budget
                </dt>
                <dd className="mt-1 text-gray-600">
                  {currentCampaign.per_influencer_budget.join(", ")}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-700">Brief URL</dt>
                <dd className="mt-1">
                  <a
                    href={currentCampaign.brief_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-500 hover:text-orange-600 hover:underline transition-colors"
                  >
                    View Brief
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-black mb-6">Campaign Brief</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <h3 className="text-2x font-bold text-black mb-6">Brand Information</h3>

        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-black-200">
            Brand Name
          </label>
          <input
            type="text"
            value={formData.company_name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, company_name: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            placeholder="e.g. Hotslicer Media"
            required
          />
        </div>

        {/* Brand Website */}
        <div>
          <label className="block text-sm font-medium text-black-200">
            Brand Website
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, website: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            placeholder="e.g., https://www.acmecorp.com"
            required
          />
        </div>

        {/* Brand Description */}
        <div>
          <label className="block text-sm font-medium text-black-200">
            Brand Description (Will be shown to influencers)
          </label>
          <textarea
            value={formData.company_description}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                company_description: e.target.value,
              }))
            }
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            placeholder="e.g., Acme Corp is a leading provider of innovative solutions..."
            required
          />
          <p className="text-sm text-black-400 mt-1">
            This will be shown to influencers, so make sure it represents your
            brand!
          </p>
        </div>

        {/* Representative Name */}
        <div>
          <label className="block text-sm font-medium text-black-200">
            Representative Name
          </label>
          <input
            type="text"
            value={formData.rep_name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, rep_name: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            placeholder="e.g., John Doe"
            required
          />
        </div>

        <br />
        <h3 className="text-2x font-bold text-black mb-6">
          Campaign Information
        </h3>

        {/* Campaign Name */}
        <div>
          <label className="block text-sm font-medium text-black-200">
            Campaign Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[a-zA-Z0-9 ]*$/.test(value)) {
                setFormData((prev) => ({ ...prev, name: value }));
                setError("");
              } else {
                setError(
                  "Campaign name can only contain letters, numbers, and spaces."
                );
              }
            }}
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            placeholder="e.g. Summer 2023 Product Launch"
            required
          />
          <p className="text-sm text-black-400 mt-1">
            Should be something descriptive, only containing letters, numbers,
            and spaces.
          </p>
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>

        {/* Brief URL */}
        <div>
          <label className="block text-sm font-medium text-black-200">
            Brief URL
          </label>
          <input
            type="url"
            value={formData.brief_url}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, brief_url: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            placeholder="e.g., https://docs.google.com/document/d/1xAh64H5T87aQ7JCEuiBbQEYxNg9lNJ5DR7gKX-13Je0/edit?usp=sharing"
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
          <label className="block text-sm font-medium text-black-200">
            Posting Date
          </label>

          <select
            value={formData.date}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, date: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            required
          >
            <option value="date">Set Date</option>
            <option value="flexible">
              Flexible (influencers can post according to their upload schedule)
            </option>
          </select>

          {formData.date !== "flexible" && (
            <div>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
                required
              />
              <label className="text-sm text-black-400 mt-1">
                This should be the latest date you want videos out
              </label>
            </div>
          )}
        </div>

        {/* Niches */}
        <div>
          {clientServers.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-black-200">
                Select Server
              </label>
              <select
                value={selectedServer || ""}
                onChange={(e) => {
                  setSelectedServer(e.target.value);
                }}
                className="mt-1 block w-full rounded-md border-gray-700 bg-white text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
                required
              >
                <option value="">Select a server</option>
                {clientServers.map((serverId, index) => (
                  <option key={index} value={serverId}>
                    {serverId}{" "}
                    {/* You might want to display a more user-friendly name if available */}
                  </option>
                ))}
              </select>
            </div>
          )}

          <label className="block text-sm font-medium text-black-200 mb-2">
            Channels
          </label>
          <div className="flex flex-wrap gap-2">
            {niches
              .filter((niche) => niche !== null)
              .map((niche) => (
                <button
                  key={niche.name}
                  type="button"
                  onClick={() => handleNicheToggle(niche.name!)}
                  className={`px-4 py-2 rounded-full transition-all duration-200 border
                  ${
                    formData.niches.includes(niche.name!)
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "bg-white border-gray-300 text-black hover:bg-gray-50"
                  }`}
                >
                  <span className="text-sm font-medium">{niche.name}</span>
                </button>
              ))}
          </div>
        </div>

        {/* Influencer Size */}
        {Array.isArray(roles) && roles.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-black-200 mb-2">
              Influencer Types
            </label>
            <div className="grid grid-cols-2 gap-4">
              {roles.map((role) => (
                <div
                  key={role.id}
                  onClick={() => handleRoleToggle(role.id)} // Use the role key for toggle
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200
            ${
              formData.per_influencer_budget.includes(role.id)
                ? "border-orange-500 bg-orange-50 shadow-orange-sm"
                : "border-gray-200 bg-white hover:border-orange-300"
            }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-black font-medium">{role.title}</span>
                    <div
                      className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors
                ${
                  formData.per_influencer_budget.includes(role.id)
                    ? "bg-orange-500"
                    : "bg-gray-100 border-2 border-gray-300"
                }`}
                    >
                      {formData.per_influencer_budget.includes(role.id) && (
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
                    {role.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-black-200 mb-2">
            Pricing Model
          </label>
          <div className="grid grid-cols-3 gap-4">
            {/* Flat-rate Card */}
            <div
              onClick={() => handlePricingToggle("Flat-rate")}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200
        ${
          formData.desired_pricing_model.includes("Flat-rate")
            ? "border-orange-500 bg-orange-50 shadow-orange-sm"
            : "border-gray-200 bg-white hover:border-orange-300"
        }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-black font-medium">Flat-rate</span>
                <div
                  className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors
          ${
            formData.desired_pricing_model.includes("Flat-rate")
              ? "bg-orange-500"
              : "bg-gray-100 border-2 border-gray-300"
          }`}
                >
                  {formData.desired_pricing_model.includes("Flat-rate") && (
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
              onClick={() => handlePricingToggle("CPM (first 30d)")}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200
        ${
          formData.desired_pricing_model.includes("CPM (first 30d)")
            ? "border-orange-500 bg-orange-50 shadow-orange-sm"
            : "border-gray-200 bg-white hover:border-orange-300"
        }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-black font-medium">CPM (first 30d)</span>
                <div
                  className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors
          ${
            formData.desired_pricing_model.includes("CPM (first 30d)")
              ? "bg-orange-500"
              : "bg-gray-100 border-2 border-gray-300"
          }`}
                >
                  {formData.desired_pricing_model.includes(
                    "CPM (first 30d)"
                  ) && (
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
              onClick={() => handlePricingToggle("Hybrid")}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200
        ${
          formData.desired_pricing_model.includes("Hybrid")
            ? "border-orange-500 bg-orange-50 shadow-orange-sm"
            : "border-gray-200 bg-white hover:border-orange-300"
        }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-black font-medium">Hybrid</span>
                <div
                  className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors
          ${
            formData.desired_pricing_model.includes("Hybrid")
              ? "bg-orange-500"
              : "bg-gray-100 border-2 border-gray-300"
          }`}
                >
                  {formData.desired_pricing_model.includes("Hybrid") && (
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
              onClick={() => handleSponsorshipFormatToggle("30s")}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200
        ${
          formData.sponsorship_format.includes("30s")
            ? "border-orange-500 bg-orange-50 shadow-orange-sm"
            : "border-gray-200 bg-white hover:border-orange-300"
        }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-black font-medium">30s Integration</span>
                <div
                  className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors
          ${
            formData.sponsorship_format.includes("30s")
              ? "bg-orange-500"
              : "bg-gray-100 border-2 border-gray-300"
          }`}
                >
                  {formData.sponsorship_format.includes("30s") && (
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
              onClick={() => handleSponsorshipFormatToggle("60s")}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200
        ${
          formData.sponsorship_format.includes("60s")
            ? "border-orange-500 bg-orange-50 shadow-orange-sm"
            : "border-gray-200 bg-white hover:border-orange-300"
        }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-black font-medium">60s Integration</span>
                <div
                  className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors
          ${
            formData.sponsorship_format.includes("60s")
              ? "bg-orange-500"
              : "bg-gray-100 border-2 border-gray-300"
          }`}
                >
                  {formData.sponsorship_format.includes("60s") && (
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
              onClick={() => handleSponsorshipFormatToggle("Shortform")}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200
        ${
          formData.sponsorship_format.includes("Shortform")
            ? "border-orange-500 bg-orange-50 shadow-orange-sm"
            : "border-gray-200 bg-white hover:border-orange-300"
        }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-black font-medium">Shortform</span>
                <div
                  className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors
          ${
            formData.sponsorship_format.includes("Shortform")
              ? "bg-orange-500"
              : "bg-gray-100 border-2 border-gray-300"
          }`}
                >
                  {formData.sponsorship_format.includes("Shortform") && (
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
                A short-form (scrolling) format video about your product or
                service
              </p>
            </div>
            {/*Dedicated */}
            <div
              onClick={() => handleSponsorshipFormatToggle("Dedicated")}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200
        ${
          formData.sponsorship_format.includes("Dedicated")
            ? "border-orange-500 bg-orange-50 shadow-orange-sm"
            : "border-gray-200 bg-white hover:border-orange-300"
        }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-black font-medium">Dedicated Video</span>
                <div
                  className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors
          ${
            formData.sponsorship_format.includes("Dedicated")
              ? "bg-orange-500"
              : "bg-gray-100 border-2 border-gray-300"
          }`}
                >
                  {formData.sponsorship_format.includes("Dedicated") && (
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
      <p className="text-sm text-gray-600 mt-2">
        <b>Missing options, or want something more complex?</b> We can help!
        Submit an inquiry to our parent agency, Hotslicer Media:{" "}
        <Link
          className="text-blue-500 underline hover:text-blue-700"
          to="https://forms.gle/hs33XS3Ay3i14jqC7"
        >
          CLICK HERE
        </Link>
      </p>
    </div>
  );
}

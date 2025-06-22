/* ================ [ IMPORTS ] ================ */

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { useCampaignStore } from "../../store/campaignStore";
import { supabase } from "../../lib/supabase";
import { CampaignInfo } from "../../components/dashboard/CampaignInfo";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { TextArea } from "../../components/ui/TextArea";
import { RadioGroup, RadioGroupItem } from "../../components/ui/RadioGroup";
import MultiSelectChips from "../../components/ui/MultiselectChips";
import SelectableCard from "../../components/ui/SelectableCard";

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
  server_id: "",
  brief_url: "",
};

/* ================ [ BRIEF FORM ] ================ */

export function BriefForm() {
  // Helper functions
  const { currentCampaign, setCurrentCampaign } = useCampaignStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [hasHydrated, setHasHydrated] = useState(false);

  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "saving" | "unsaved" | "idle"
  >("idle");

  // State variables
  const [formData, setFormDataState] = useState(contents);
  const [niches, setNiches] = useState<
    { name: string | null; discord_webhook_url: string }[]
  >([]);
  const [roles, setRoles] = useState<{ value: string | null; key: string }[]>(
    [],
  );
  const [error, setError] = useState("");
  const [clientServers, setClientServers] = useState<string[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<
    Partial<typeof contents>
  >({});

  const setFormData = (
    updater:
      | Partial<typeof contents>
      | ((prev: typeof contents) => Partial<typeof contents>),
  ) => {
    setFormDataState((prev) => {
      const updates = typeof updater === "function" ? updater(prev) : updater;
      const merged = { ...prev, ...updates };

      const changed: Partial<typeof contents> = {};
      for (const key in updates) {
        if (updates[key] !== prev[key]) {
          changed[key] = updates[key];
        }
      }

      if (Object.keys(changed).length > 0) {
        setPendingUpdates((prev) => ({ ...prev, ...changed }));
      }

      return merged;
    });
  };

  useEffect(() => {
    const fetchClientServers = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("clients")
        .select("servers")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching client servers:", error);
      } else {
        const serversArray = data?.servers || [];
        setClientServers(serversArray);
        if (serversArray.length === 1) {
          setFormData((prev) => ({ ...prev, server_id: serversArray[0] }));
        }
      }
    };

    fetchClientServers();

    const fetchCampaign = async () => {
      if (!currentCampaign?.id || hasHydrated) return;

      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", currentCampaign.id)
        .single();

      if (error) {
        console.error("Failed to fetch campaign:", error);
        return;
      }

      // Hydrate form from Supabase data
      setFormDataState({
        company_name: data.company_name || "",
        website: data.website || "",
        company_address: data.company_address || "",
        company_description: data.company_description || "",
        company_phone: data.company_phone || "",
        name: data.name || "",
        rep_name: data.rep_name || "",
        date: data.date || "",
        server_id: data.server_id || clientServers[0],
        per_influencer_budget: data.per_influencer_budget,
        desired_pricing_model: data.desired_pricing_model || [],
        sponsorship_format: data.sponsorship_format || [],
        niches: Array.isArray(data.niches) ? data.niches : [],
        brief_url: data.brief_url || "",
      });
      console.log(formData);

      setHasHydrated(true);
    };

    fetchCampaign();
  }, [hasHydrated]);

  useEffect(() => {
    setHasHydrated(false);
  }, [currentCampaign?.id]);

  useEffect(() => {
    if (
      !autosaveEnabled ||
      Object.keys(pendingUpdates).length === 0 ||
      !currentCampaign?.id
    )
      return;

    setSaveStatus("saving");

    const timeout = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from("campaigns")
          .update(pendingUpdates)
          .eq("id", currentCampaign.id);

        if (error) {
          console.error("Failed to update campaign:", error);
          setSaveStatus("unsaved");
        } else {
          setPendingUpdates({});
          setSaveStatus("saved");
        }
      } catch (err) {
        console.error("Error syncing updates:", err);
        setSaveStatus("unsaved");
      }
    }, 500); // debounce

    return () => clearTimeout(timeout);
  }, [pendingUpdates, autosaveEnabled, currentCampaign?.id]);

  const handleManualSave = async () => {
    if (!currentCampaign?.id || Object.keys(pendingUpdates).length === 0)
      return;

    setSaveStatus("saving");

    const { error } = await supabase
      .from("campaigns")
      .update(pendingUpdates)
      .eq("id", currentCampaign.id);

    if (error) {
      console.error("Manual save failed:", error);
      setSaveStatus("unsaved");
    } else {
      setPendingUpdates({});
      setSaveStatus("saved");
    }
  };

  // Fetch niche types
  const fetchNiches = async (serverId: string | null) => {
    if (!serverId) return;

    const { data, error } = await supabase
      .from("niches")
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
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .eq("server_id", serverId);
    if (error) console.error("Error fetching roles:", error);
    else setRoles(data || []);
  };

  useEffect(() => {
    console.log(formData.server_id);
    fetchNiches(formData.server_id);
    fetchRoles(formData.server_id);
    // setFormData((prev) => ({ ...prev, niches: [] }));
  }, [formData.server_id]);

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
        server_id: formData.server_id, // Keeping this from the second function
      };

      if (!currentCampaign) {
        setError("Campaign not found.");
        return;
      }

      const campaignInfo = {
        ...currentCampaign,
        ...formData,
        status: "brief_submitted",
      };

      if (Object.keys(pendingUpdates).length > 0) {
        await supabase
          .from("campaigns")
          .update(pendingUpdates)
          .eq("id", currentCampaign.id);
        setPendingUpdates({});
      }

      const { error } = await supabase
        .from("campaigns")
        .update({ status: "brief_submitted" })
        .eq("id", currentCampaign.id);

      if (error) {
        console.error("Update failed:", error.message);
      }

      setCurrentCampaign(campaignInfo);

      await axios
        .post("/api/campaigns/init-category", {
          campaignId: campaignInfo.id,
        })
        .catch((err) => {
          console.warn("Silent fail on one-way call:", err.message);
        });

      const baseUrl = window.location.origin; // Dynamically get the base URL
      let formattedMessage = "";
      for (const role of roles) {
        if (
          formData.per_influencer_budget.includes(role.id) &&
          formData.server_id == role.server_id
        )
          formattedMessage += role.value + " \n";
      }

      const getJoinCode = async (campaignId: string): Promise<string> => {
        const res = await fetch(
          `/api/joincodes/encode?campaignId=${encodeURIComponent(campaignId)}`,
        );

        if (!res.ok) throw new Error("Failed to get join code");
        const data = await res.json();
        return data.code;
      };

      // Usage:
      const joinCode = await getJoinCode("" + currentCampaign.id);

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

## **To Declare Your Commitment React Below and Follow our Bot's Instructions** 
### Have DMs off? Alternative ways to sign up:
- Get your personalized invite link using /getlink with join code **${joinCode}**
- use the [general invite](${baseUrl}/creator-form?joinCode=${encodeURIComponent(joinCode)}) (use /id for your discord ID)
- use the /join command. The join code is: **${joinCode}**
`;

      // Send to selected niches' webhooks
      const selectedNiches = niches.filter(
        (niche) =>
          formData.niches.includes(niche.name!) &&
          formData.server_id == niche.server_id,
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
        (niche) => niche.name === null,
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
          "No webhook found for NULL niche, could not post to the all sponsorships channel.",
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
    value: "Flat-rate" | "CPM (first 30d)" | "Hybrid",
  ) => {
    setFormData((prev) => ({
      ...prev,
      desired_pricing_model: prev.desired_pricing_model.includes(value)
        ? prev.desired_pricing_model.filter((v) => v !== value)
        : [...prev.desired_pricing_model, value],
    }));
  };

  const handleSponsorshipFormatToggle = (
    value:
      | "30s Longform Integration"
      | "60s Longform Integration"
      | "Shortform"
      | "Dedicated Video",
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
    return <CampaignInfo campaignId={"" + currentCampaign.id} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-black">Campaign Brief</h2>
      <Card className="max-w-2xl mx-auto space-y-4">
        {/* Autosave status and manual save button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutosaveEnabled(!autosaveEnabled)}
            className="text-sm font-medium text-blue-600 hover:underline focus:outline-none"
          >
            {autosaveEnabled ? "Autosave enabled" : "Autosave disabled"}
          </button>

          <span className="text-gray-400">·</span>

          <span className="text-sm text-gray-600">
            {
              {
                saving: "Saving...",
                saved: "Saved",
                unsaved: "Unsaved changes",
                idle: "No changes",
              }[saveStatus]
            }
          </span>

          <span className="text-gray-400">·</span>

          <button
            onClick={handleManualSave}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs"
          >
            Save now
          </button>
        </div>
      </Card>

      {/* Campaign Brief Title */}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="max-w-2xl mx-auto space-y-4 p-6">
          <h3 className="text-2xl font-bold text-black mb-6">
            Brand Information
          </h3>

          {/* Company Name */}
          <div>
            <Label weight="bold" htmlFor="company_name">
              Brand Name
            </Label>
            <Input
              id="company_name"
              type="text"
              value={formData.company_name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  company_name: e.target.value,
                }))
              }
              placeholder="e.g. Hotslicer Media"
              required
              className="mt-1"
            />
          </div>

          {/* Brand Website */}
          <div>
            <Label weight="bold" htmlFor="website">
              Brand Website
            </Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, website: e.target.value }))
              }
              placeholder="e.g., https://warm.hotslicer.com"
              required
              className="mt-1"
            />
          </div>

          {/* Brand Description */}
          <div>
            <Label weight="bold" htmlFor="company_description">
              Brand Description (Will be shown to influencers)
            </Label>
            <TextArea
              id="company_description"
              value={formData.company_description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  company_description: e.target.value,
                }))
              }
              placeholder="e.g., Warm by Hotslicer Media is a novel system for..."
              required
              className="mt-1"
              rows={4}
            />
            <p className="text-sm text-black-400 mt-1">
              This will be shown to influencers, so make sure it represents your
              brand!
            </p>
          </div>

          {/* Representative Name */}
          <div>
            <Label weight="bold" htmlFor="rep_name">
              Representative Name
            </Label>
            <Input
              id="rep_name"
              type="text"
              value={formData.rep_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, rep_name: e.target.value }))
              }
              placeholder="e.g., John Doe"
              required
              className="mt-1"
            />
          </div>
        </Card>

        <Card className="max-w-2xl mx-auto space-y-4">
          <h3 className="text-2xl font-bold text-black mb-6">
            Campaign Information
          </h3>

          {/* Campaign Name */}
          <div>
            <Label weight="bold" htmlFor="campaign_name">
              Campaign Name
            </Label>
            <Input
              id="campaign_name"
              type="text"
              value={formData.name}
              onChange={(e) => {
                const value = e.target.value;
                if (/^[a-zA-Z0-9 ]*$/.test(value)) {
                  setFormData((prev) => ({ ...prev, name: value }));
                  setError("");
                } else {
                  setError(
                    "Campaign name can only contain letters, numbers, and spaces.",
                  );
                }
              }}
              placeholder="e.g. Summer 2023 Product Launch"
              required
              className="mt-1"
            />
            <p className="text-sm text-black-400 mt-1">
              Should be something descriptive, only containing letters, numbers,
              and spaces.
            </p>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>

          {/* Brief URL */}
          <div>
            <Label weight="bold" htmlFor="brief_url">
              Brief URL
            </Label>
            <Input
              id="brief_url"
              type="url"
              value={formData.brief_url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, brief_url: e.target.value }))
              }
              placeholder="e.g., https://docs.google.com/document/d/..."
              required
              className="mt-1"
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
            <Label>Posting Date</Label>
            <RadioGroup
              value={formData.date === "flexible" ? "flexible" : "set_date"}
              onValueChange={(value) => {
                if (value === "flexible") {
                  setFormData((prev) => ({ ...prev, date: "flexible" }));
                } else {
                  // default to today if switching back from flexible
                  setFormData((prev) => ({
                    ...prev,
                    date:
                      prev.date === "flexible"
                        ? new Date().toISOString().slice(0, 10)
                        : prev.date,
                  }));
                }
              }}
              className="mt-1"
              aria-label="Posting Date options"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="flexible" id="flexible" />
                <Label
                  weight="bold"
                  htmlFor="flexible"
                  className="cursor-pointer select-none"
                >
                  Flexible (influencers can post according to their upload
                  schedule)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="set_date" id="set_date" />
                <Label
                  weight="bold"
                  htmlFor="set_date"
                  className="cursor-pointer select-none"
                >
                  Set Date
                </Label>
              </div>
            </RadioGroup>

            {formData.date !== "flexible" && (
              <div className="mt-4">
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  required
                  className="mt-1"
                />
                <p className="text-sm text-black-400 mt-1">
                  This should be the latest date you want videos out
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card className="max-w-2xl mx-auto space-y-4">
          <h3 className="text-2xl font-bold text-black mb-6">
            Distribution Options
          </h3>
          {clientServers.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-black-200 mb-2">
                Select Server
              </label>
              <RadioGroup
                value={formData.server_id || ""}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, server_id: value }));
                }}
                className="grid gap-2"
                required
              >
                {clientServers.map((serverId) => (
                  <div key={serverId} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={serverId}
                      id={`server-${serverId}`}
                    />
                    <Label
                      htmlFor={`server-${serverId}`}
                      className="cursor-pointer"
                    >
                      {serverId}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
          <div>
            {/* Niches */}
            <label className="block text-sm font-medium text-black-200 mb-2">
              Channels
            </label>
            <MultiSelectChips
              options={niches.filter((n) => n !== null).map((n) => n.name!)}
              selected={formData.niches}
              onToggle={handleNicheToggle}
            />
          </div>

          {/* Influencer Size */}
          {Array.isArray(roles) && roles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-black-200 mb-2">
                Influencer Types
              </label>
              <div className="grid grid-cols-2 gap-4">
                {roles.map((role) => {
                  // Ensure we're using the correct ID comparison
                  // Convert both to strings for comparison
                  const isSelected =
                    formData.per_influencer_budget
                      ?.map(String) // Convert budget items to strings
                      .includes(String(role.id)) ?? false; // Convert role.id to string
                  return (
                    <SelectableCard
                      key={role.id}
                      selected={isSelected}
                      onClick={() => handleRoleToggle(role.id)}
                      title={role.title}
                      description={role.description}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Pricing Model */}
          <div>
            <label className="block text-sm font-medium text-black-200 mb-2">
              Pricing Model
            </label>
            <div className="grid grid-cols-3 gap-4">
              <SelectableCard
                selected={formData.desired_pricing_model.includes("Flat-rate")}
                onClick={() => handlePricingToggle("Flat-rate")}
                title="Flat-rate"
                description="Fixed payment for the campaign"
              />
              <SelectableCard
                selected={formData.desired_pricing_model.includes(
                  "CPM (first 30d)",
                )}
                onClick={() => handlePricingToggle("CPM (first 30d)")}
                title="CPM (first 30d)"
                description="Cost per thousand views for the first 30 days"
              />
              <SelectableCard
                selected={formData.desired_pricing_model.includes("Hybrid")}
                onClick={() => handlePricingToggle("Hybrid")}
                title="Hybrid"
                description="Combination of flat-rate and CPM pricing"
              />
            </div>
          </div>

          {/* Sponsorship Types */}
          <div>
            <label className="block text-sm font-medium text-black-200 mb-2">
              Sponsorship Types
            </label>
            <div className="grid grid-cols-4 gap-4">
              <SelectableCard
                selected={formData.sponsorship_format.includes(
                  "30s Longform Integration",
                )}
                onClick={() =>
                  handleSponsorshipFormatToggle("30s Longform Integration")
                }
                title="30s Integration"
                description="30 second sponsored segment in a long form video"
              />
              <SelectableCard
                selected={formData.sponsorship_format.includes(
                  "60s Longform Integration",
                )}
                onClick={() =>
                  handleSponsorshipFormatToggle("60s Longform Integration")
                }
                title="60s Integration"
                description="60 second sponsored segment in a long form video"
              />
              <SelectableCard
                selected={formData.sponsorship_format.includes("Shortform")}
                onClick={() => handleSponsorshipFormatToggle("Shortform")}
                title="Shortform"
                description="A short-form (scrolling) format video about your product or service"
              />
              <SelectableCard
                selected={formData.sponsorship_format.includes(
                  "Dedicated Video",
                )}
                onClick={() => handleSponsorshipFormatToggle("Dedicated Video")}
                title="Dedicated Video"
                description="A full length video about your product or service!"
              />
            </div>
          </div>
        </Card>

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

import { useEffect, useState } from "react";
import axios from "axios";
import { useCampaignStore } from "../../store/campaignStore";
import { DocusealForm } from "@docuseal/react";
import { SUPABASE_CLIENT } from "../../lib/supabase";

export const Contract = () => {
  const { currentCampaign } = useCampaignStore();

  if (
    currentCampaign?.status !== "creators_selected" &&
    currentCampaign?.status !== "contract_signed"
  ) {
    return (
      <div className="max-w-screen-xl mx-auto p-4 bg-gray-50 rounded-md">
        <h2 className="text-2xl font-bold text-black">Contract</h2>
        <p className="text-black">
          This feature is not currently available to you
          <br />
          Contact support if you think this is a mistake.
        </p>
      </div>
    );
  }

  const [email, setEmail] = useState("");
  const [selectedOption, setSelectedOption] = useState("fully_managed"); // Default to fully managed
  const [responseData, setResponseData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch contract_email and fully_managed from Supabase
  useEffect(() => {
    const fetchCampaignData = async () => {
      if (!currentCampaign?.id) return;
      const { data, error } = await SUPABASE_CLIENT.from("campaigns")
        .select("contract_email, fully_managed")
        .eq("id", currentCampaign.id)
        .single();

      if (error) {
        console.error("Error fetching campaign data:", error);
        return;
      }

      if (data) {
        setEmail(data.contract_email || "");
        setSelectedOption(
          data.fully_managed ? "fully_managed" : "self_service"
        );
      }
    };

    const askResponse = async () => {
      try {
        const response = await axios.get("/api/contracts/client-form", {
          params: { campaign_id: currentCampaign.id },
        });
        setResponseData(response.data); // Set response.data instead of response
      } catch (error) {
        console.error("Error fetching contract:", error);
      }
    };

    fetchCampaignData();
    askResponse();
  }, [currentCampaign]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      const fullyManaged = selectedOption === "fully_managed";

      const response = await axios.get("/api/contracts/client-form", {
        params: {
          campaign_id: currentCampaign?.id,
          signer_email: email,
          fully_managed: fullyManaged,
        },
      });
      setResponseData(response.data);

      await SUPABASE_CLIENT.from("campaigns")
        .update({ fully_managed: fullyManaged, contract_email: email })
        .eq("id", currentCampaign.id);
    } catch (error) {
      console.error("Error initializing client form:", error);
      setError("Failed to initialize client form");
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto p-4 bg-gray-100 rounded-md">
      <h2 className="text-2xl font-bold text-black mb-6">
        Initialize Client Form
      </h2>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label className="block text-black mb-2" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded-md border border-gray-400"
            required
            disabled={!!responseData} // Disable input if response exists
          />
        </div>

        {/* Additional Options */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-black mb-2">
            Additional Options
          </h3>
          <div className="bg-white p-4 rounded-md shadow-md">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="additional-options"
                value="fully_managed"
                checked={selectedOption === "fully_managed"}
                onChange={() => setSelectedOption("fully_managed")}
                className="mt-1"
                disabled={!!responseData} // Disable selection if response exists
              />
              <div>
                <h4 className="text-lg font-medium text-black">
                  Fully Managed Service
                </h4>
                <p className="text-gray-600 text-sm">
                  Our team will handle all aspects of the campaign for you.
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer mt-4">
              <input
                type="radio"
                name="additional-options"
                value="self_service"
                checked={selectedOption === "self_service"}
                onChange={() => setSelectedOption("self_service")}
                className="mt-1"
                disabled={!!responseData} // Disable selection if response exists
              />
              <div>
                <h4 className="text-lg font-medium text-black">Self-Service</h4>
                <p className="text-gray-600 text-sm">
                  You will manage the campaign on your own with our platform.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Hide submit button if responseData exists */}
        {!responseData && (
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-md"
          >
            Submit
          </button>
        )}
      </form>
      {error && <div className="text-red-500">{error}</div>}

      {/* Conditional rendering for contract form or placeholder */}
      {responseData ? (
        <div className="bg-white h-[500px] max-h-[80vh] overflow-auto border rounded-md shadow-md">
          <DocusealForm
            src={responseData.embed_src}
            withTitle={false}
            externalId={responseData.external_id || null}
            onComplete={async () => {
              await axios.post("/api/campaigns/setup-discord", {
                campaignId: currentCampaign.id,
              });
              currentCampaign.status = "contract_signed";
              await SUPABASE_CLIENT.from("campaigns")
                .update({ status: "contract_signed" })
                .eq("id", currentCampaign.id);

              if (selectedOption === "fully_managed") {
                await axios.post("/api/messages/sendDM", {
                  message: `FULLY MANAGED CAMPAIGN SIGNED: ${currentCampaign.name}`,
                  id: currentCampaign.id,
                  type: "staff",
                });
              }
            }}
          />
        </div>
      ) : (
        <div className="bg-gray-200 h-[500px] max-h-[80vh] flex items-center justify-center border rounded-md shadow-md">
          <p className="text-gray-600 text-lg">
            Please submit your email to proceed with the contract.
          </p>
        </div>
      )}
    </div>
  );
};

export default Contract;

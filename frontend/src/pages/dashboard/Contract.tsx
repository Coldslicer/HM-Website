/* ================ [ IMPORTS ] ================ */

import { useEffect, useState } from "react";
import axios from "axios";
import { useCampaignStore } from "../../store/campaignStore";
import { DocusealForm } from "@docuseal/react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { Label } from "recharts";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { RadioGroup } from "../../components/ui/RadioGroup";

/* ================ [ CONTRACT ] ================ */

const Contract = () => {
  const { currentCampaign } = useCampaignStore();
  const navigate = useNavigate();

  if (
    currentCampaign?.status !== "creators_selected" &&
    currentCampaign?.status !== "contract_signed"
  ) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Contract</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600">
            This feature is not currently available to you
            <br />
            Contact support if you think this is a mistake.
          </p>
        </div>
      </div>
    );
  }

  const [email, setEmail] = useState("");
  const [selectedOption, setSelectedOption] = useState("fully_managed");
  const [responseData, setResponseData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCampaignData = async () => {
      if (!currentCampaign?.id) return;
      const { data, error } = await supabase
        .from("campaigns")
        .select("contract_email, fully_managed")
        .eq("id", currentCampaign.id)
        .single();

      if (error) return;
      if (data) {
        setEmail(data.contract_email || "");
        setSelectedOption(
          data.fully_managed ? "fully_managed" : "self_service",
        );
      }
    };

    const askResponse = async () => {
      try {
        const response = await axios.get("/api/contracts/client-form", {
          params: { campaign_id: currentCampaign.id },
        });
        setResponseData(response.data);
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
      const response = await axios.get("/api/contracts/client-form", {
        params: {
          campaign_id: currentCampaign?.id,
          signer_email: email,
          fully_managed: selectedOption === "fully_managed",
        },
      });
      setResponseData(response.data);

      await supabase
        .from("campaigns")
        .update({
          fully_managed: selectedOption === "fully_managed",
          contract_email: email,
        })
        .eq("id", currentCampaign.id);
    } catch (error) {
      setError("Failed to initialize client form");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Contract</h1>

      <Card className="p-6 mb-6">
        <form onSubmit={handleSubmit}>
          {/* Service Type Selection */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Service Type
            </h3>
            <RadioGroup className="space-y-4">
              <label className="flex items-start p-4 rounded-md border border-gray-200 hover:border-orange-300 cursor-pointer">
                <input
                  type="radio"
                  name="additional-options"
                  value="fully_managed"
                  checked={selectedOption === "fully_managed"}
                  onChange={() => setSelectedOption("fully_managed")}
                  className="mt-1 mr-3 h-4 w-4 accent-orange-500 border-gray-300"
                  disabled={!!responseData}
                />
                <div>
                  <h4 className="text-base font-medium text-gray-800">
                    Fully Managed Service
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Our team will handle all aspects of the campaign for you.
                  </p>
                </div>
              </label>

              <label className="flex items-start p-4 rounded-md border border-gray-200 hover:border-orange-300 cursor-pointer">
                <input
                  type="radio"
                  name="additional-options"
                  value="self_service"
                  checked={selectedOption === "self_service"}
                  onChange={() => setSelectedOption("self_service")}
                  className="mt-1 mr-3 h-4 w-4 accent-orange-500 border-gray-300"
                  disabled={!!responseData}
                />
                <div>
                  <h4 className="text-base font-medium text-gray-800">
                    Self-Service
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    You will manage the campaign on your own with our platform.
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* Email Input */}
          <div>
            <Label className="mb-2 block text-sm font-medium text-gray-700">
              Email
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              disabled={!!responseData}
            />
          </div>

          {/* Submit Button */}
          {!responseData && (
            <Button
              type="submit"
              className="w-full mt-4 py-3 text-lg"
              disabled={!!responseData}
            >
              Continue to Contract
            </Button>
          )}
        </form>

        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      </Card>

      {/* Contract Embed */}
      {responseData ? (
        <Card className="p-6">
          <div className="bg-gray-50 rounded-lg shadow-inner p-4 h-[800px] overflow-y-auto">
            <DocusealForm
              src={responseData.embed_src}
              withTitle={false}
              externalId={responseData.external_id || null}
              onComplete={async () => {
                currentCampaign.status = "contract_signed";
                await supabase
                  .from("campaigns")
                  .update({ status: "contract_signed" })
                  .eq("id", currentCampaign.id);

                await axios.post("/api/contracts/creator-forms", {
                  campaign_id: currentCampaign.id,
                });

                if (selectedOption === "fully_managed") {
                  await axios.post("/api/messages/sendDM", {
                    message: `FULLY MANAGED CAMPAIGN SIGNED: ${currentCampaign.name}`,
                    id: currentCampaign.id,
                    type: "staff",
                  });
                }

                navigate("/dashboard/messaging");
              }}
            />
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center text-gray-500">
          Please provide your email and service preference to access the
          contract
        </Card>
      )}
    </div>
  );
};

/* ================ [ EXPORTS ] ================ */

export default Contract;

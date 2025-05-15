/* ================ [ IMPORTS ] ================ */

// React components
import { useState } from "react";

// UI components
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { TextArea } from "./ui/TextArea";
import { RadioGroup, RadioGroupItem } from "./ui/RadioGroup";

// Supabase client
import { SUPABASE_CLIENT } from "../lib/supabase";

/* ================ [ COMPONENT ] ================ */

// Tester application component
function TesterApplication() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    discordTag: "",
    companyName: "",
    interest: "",
    agreement: "",
  });

  // Validate the current step
  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.email.includes("@") && formData.email.includes(".");
      case 2:
        return formData.discordTag.trim() !== "";
      case 3:
        return formData.companyName.trim() !== "";
      case 4:
        return formData.interest.trim() !== "";
      case 5:
        return formData.agreement === "yes";
      default:
        return false;
    }
  };

  // Handle next step
  const handleNext = () => {
    if (isStepValid() && step < 5) {
      setStep(step + 1);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (isStepValid()) {
      try {
        const { error } = await SUPABASE_CLIENT.from(
          "tester_applications",
        ).insert([
          {
            email: formData.email,
            discord_id: formData.discordTag,
            company_name: formData.companyName,
            statement: formData.interest,
            agreed: formData.agreement === "yes",
          },
        ]);

        if (error) {
          console.error("Supabase error:", error);
          alert("Failed to submit tester application");
        } else {
          console.log("Tester application submitted:", formData.email);
          alert("Tester application submitted successfully");
        }
      } catch (error) {
        console.error("Error submitting tester application:", error);
        alert("Error submitting tester application");
      }

      // Close the dialog
      setIsDialogOpen(false);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Render the current step
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="grid gap-4">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
        );
      case 2:
        return (
          <div className="grid gap-4">
            <Label htmlFor="discordTag">Discord Tag</Label>
            <Input
              id="discordTag"
              value={formData.discordTag}
              onChange={(e) =>
                setFormData({ ...formData, discordTag: e.target.value })
              }
              required
            />
          </div>
        );
      case 3:
        return (
          <div className="grid gap-4">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
              required
            />
          </div>
        );
      case 4:
        return (
          <div className="grid gap-4">
            <Label htmlFor="interest">
              Why are you interested in beta testing?
            </Label>
            <TextArea
              id="interest"
              value={formData.interest}
              onChange={(e) =>
                setFormData({ ...formData, interest: e.target.value })
              }
              required
            />
          </div>
        );
      case 5:
        return (
          <div className="grid gap-4">
            <Label>
              I agree to be an active contributor, point out bugs, and recommend
              features to our team
            </Label>
            <RadioGroup
              value={formData.agreement}
              onValueChange={(value) =>
                setFormData({ ...formData, agreement: value })
              }
              required
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="yes" />
                <Label htmlFor="yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no">No</Label>
              </div>
            </RadioGroup>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 max-w-2xl text-center min-h-[calc(100vh-200px)] flex flex-col justify-between">
      <div>
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WARM%20Transparent-7Qk6aLp8aveeijQInp4caIaejfpZqP.png"
          alt="Warm Logo"
          width={80}
          height={80}
          className="mx-auto mb-8"
          loading="lazy"
        />
        <h1 className="text-4xl font-bold mb-4">Join Warm</h1>
        <p className="text-xl text-gray-600 mb-12">
          Help us revolutionize Influencer Marketing.
        </p>
        <Button
          className="w-full max-w-md bg-gray-400 hover:bg-gray-400/90 mb-4 cursor-not-allowed"
          disabled={true}
        >
          Beta Tester Applications are Closed
        </Button>
        <div className="mt-4 text-sm text-gray-500">
          By continuing, you agree to Warm's{" "}
          <a
            href="https://hotslicer.com/warmtos/"
            className="text-[#FF6100] hover:underline"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="https://hotslicer.com/warmprivacypolicy/"
            className="text-[#FF6100] hover:underline"
          >
            Privacy Policy
          </a>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Beta Tester Application</DialogTitle>
            <div className="text-sm text-gray-500">Step {step} of 5</div>
          </DialogHeader>
          <div className="py-4">{renderStep()}</div>
          <div className="flex justify-between mt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={step === 1}
            >
              Previous
            </Button>
            <Button
              onClick={step === 5 ? handleSubmit : handleNext}
              disabled={!isStepValid()}
            >
              {step === 5 ? "Submit" : "Next"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================ [ EXPORTS ] ================ */

export { TesterApplication };

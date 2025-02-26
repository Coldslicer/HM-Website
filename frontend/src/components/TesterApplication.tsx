/* ================ [ IMPORTS ] ================ */

// React components
import React, { useState } from "react";

// UI components
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { RadioGroup, RadioGroupItem } from "./ui/RadioGroup";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";

/* ================ [ COMPONENT ] ================ */

// Tester application component
function TesterApplication() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    channelName: "",
    channelLink: "",
    deliverables: "",
    deliverablesRate: "",
    agreement: "",
  });

  // Validate the current step
  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.name.trim() !== "";
      case 2:
        return formData.channelName.trim() !== "";
      case 3:
        return formData.channelLink.trim() !== "";
      case 4:
        return formData.deliverables.trim() !== "";
      case 5:
        return formData.deliverablesRate.trim() !== "";
      case 6:
        return formData.agreement === "yes";
      default:
        return false;
    }
  };

  // Handle next step
  const handleNext = () => {
    if (isStepValid() && step < 6) {
      setStep(step + 1);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (isStepValid()) {
      try {
        const response = await fetch("http://localhost:3000/api/testers/submit-tester-application", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            channel_name: formData.channelName,
            channel_link: formData.channelLink,
            deliverables: formData.deliverables,
            deliverables_rate: formData.deliverablesRate,
            agreed: formData.agreement === "yes",
          }),
        });

        if (response.ok) {
          console.log("Tester application submitted successfully");
        } else {
          console.error("Failed to submit tester application");
        }
      } catch (error) {
        console.error("Error submitting tester application:", error);
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
            <Label htmlFor="name">Name (First, Last) - Ex. Shreyan Phadke</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
        );
      case 2:
        return (
          <div className="grid gap-4">
            <Label htmlFor="channelName">Your Channel Name - Ex. Hotslicer</Label>
            <Input
              id="channelName"
              value={formData.channelName}
              onChange={(e) => setFormData({ ...formData, channelName: e.target.value })}
              required
            />
          </div>
        );
      case 3:
        return (
          <div className="grid gap-4">
            <Label htmlFor="channelLink">Your Channel Link - https://www.youtube.com/@Hotslicer</Label>
            <Input
              id="channelLink"
              value={formData.channelLink}
              onChange={(e) => setFormData({ ...formData, channelLink: e.target.value })}
              required
            />
          </div>
        );
      case 4:
        return (
          <div className="grid gap-4">
            <Label htmlFor="deliverables">Deliverables (Available options are listed on discord)</Label>
            <Select
              value={formData.deliverables}
              onValueChange={(value) => setFormData({ ...formData, deliverables: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a deliverable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Longform Integration (30s)">Longform Integration (30s)</SelectItem>
                <SelectItem value="Longform Integration (60s)">Longform Integration (60s)</SelectItem>
                <SelectItem value="Shortform Video">Shortform Video</SelectItem>
                <SelectItem value="Dedicated Longform">Dedicated Longform</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 5:
        return (
          <div className="grid gap-4">
            <Label htmlFor="deliverablesRate">Deliverables Rate - Ex. $X, $XCPM, or $X + $XCPM</Label>
            <Input
              id="deliverablesRate"
              value={formData.deliverablesRate}
              onChange={(e) => setFormData({ ...formData, deliverablesRate: e.target.value })}
              required
            />
            <p className="text-sm text-gray-500">
              You can put whatever rate you want, but if it's too high clients may not select you.
            </p>
          </div>
        );
      case 6:
        return (
          <div className="grid gap-4">
            <Label>I agree to the following terms</Label>
            <RadioGroup
              value={formData.agreement}
              onValueChange={(value) => setFormData({ ...formData, agreement: value })}
              required
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="yes" />
                <Label htmlFor="yes">Yes</Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-gray-500">
              1. I will follow through with the listed rates and deliverables to the best of my ability<br />
              2. I understand that this sponsorship is not guaranteed and is up to the brands.<br />
              3) Hotslicer Media will take 15% cut from the sponsorship
            </p>
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
        <p className="text-xl text-gray-600 mb-12">Help us revolutionize Influencer Marketing.</p>
        <Button
          className="w-full max-w-md bg-[#FF6100] hover:bg-[#FF6100]/90 mb-4"
          onClick={() => setIsDialogOpen(true)}
        >
          Become a Beta Tester
        </Button>
        <div className="mt-4 text-sm text-gray-500">
          By continuing, you agree to Warm's{" "}
          <a href="/terms" className="text-[#FF6100] hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-[#FF6100] hover:underline">
            Privacy Policy
          </a>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Beta Tester Application</DialogTitle>
            <div className="text-sm text-gray-500">Step {step} of 6</div>
          </DialogHeader>
          <div className="py-4">{renderStep()}</div>
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={handlePrevious} disabled={step === 1}>
              Previous
            </Button>
            <Button onClick={step === 6 ? handleSubmit : handleNext} disabled={!isStepValid()}>
              {step === 6 ? "Submit" : "Next"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================ [ EXPORTS ] ================ */

export { TesterApplication };
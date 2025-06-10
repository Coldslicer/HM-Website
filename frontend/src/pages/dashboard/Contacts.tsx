import React, { useState, useEffect } from "react";
import { SUPABASE_CLIENT } from "../../lib/supabase";
import MessagingComponent from "../../components/dashboard/MessagingComponent";

const Contacts = () => {
  const [staffChatChannelId, setStaffChatChannelId] = useState("");

  // Fetch the staff chat channel ID
  useEffect(() => {
    const fetchStaffChannel = async () => {
      try {
        // For simplicity, we'll use a hardcoded channel ID for the staff channel
        // In a real implementation, this would be fetched from the database
        setStaffChatChannelId("staff-channel-id");
      } catch (error) {
        console.error("Error fetching staff channel:", error);
      }
    };

    fetchStaffChannel();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Contact Us</h1>

        <div className="space-y-6 w-full">
          {/* Contact Information */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="font-semibold w-24">Email:</span>
                <a
                  href="mailto:example@example.example"
                  className="text-orange-500 hover:text-orange-600"
                >
                  example@example.example
                </a>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-24">Phone:</span>
                <a
                  href="tel:+10000000000"
                  className="text-orange-500 hover:text-orange-600"
                >
                  000-000-0000
                </a>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-24">Address:</span>
                <span>123 Example St, Example City, EX 00000</span>
              </div>
            </div>
          </div>

          {/* Talk with CEO Widget */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              Schedule a Call with our CEO
            </h2>
            <div className="rounded-lg overflow-hidden border border-gray-300 shadow-md relative invert-calcom w-full">
              <div className="invert-calcom">
                <iframe
                  src="https://cal.com/hotslicer/30min"
                  className="w-full h-[600px]"
                  title="Schedule a Call"
                ></iframe>
              </div>
            </div>
          </div>

          <style>
            {`
              .invert-calcom {
                background-color: black;
                color: white;
              }
              .invert-calcom *:not(img):not(video):not(iframe) {
                filter: invert(1) hue-rotate(180deg);
              }
            `}
          </style>

          {/* Staff Channel Messaging */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Chat with our Staff</h2>
            {staffChatChannelId ? (
              <div className="h-[60vh] border border-gray-200 rounded-lg overflow-hidden">
                <MessagingComponent
                  channelId={staffChatChannelId}
                  channelType="staff"
                  campaignId="contact-page"
                  campaignRepName="Visitor"
                  campaignCompanyName="Contact Page"
                />
              </div>
            ) : (
              <p className="text-gray-600">Loading staff channel...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contacts;

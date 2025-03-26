/* ================ [ IMPORTS ] ================ */

import { NavLink } from "react-router-dom";

/* ================ [ WELCOME ] ================ */

const Welcome = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Welcome to Your Campaign
        </h1>

        <div className="space-y-6 w-full">
          {/* Step 1: Watch Video */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              Watch the Introduction - 1 / 5
            </h2>
            <div className="aspect-video w-full">
              <iframe
                className="w-full h-full rounded-md"
                src="https://www.youtube.com/embed/S3SmtyzTv98"
                title="Introduction Video"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          {/* Step 2: Schedule a Call */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              Optionally Talk with our CEO - 2 / 5
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

          {/* Step 3: Write a Brief */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              Write your campaign brief - 3 / 5
            </h2>
            <p className="mb-4">
              Start by drafting your campaign requirements using our simple
              template. This will help clarify your goals and expectations.
            </p>
            <a
              href="https://docs.google.com/document/d/1xAh64H5T87aQ7JCEuiBbQEYxNg9lNJ5DR7gKX-13Je0/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 inline-block"
            >
              Open template
            </a>
          </div>

          {/* Step 4: Enter Campaign Details */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              Fill out our brief form - 4 / 5
            </h2>
            <p className="mb-4">
              Submit your finalized brief through our form to begin matching
              with creators. Include key details about your brand and campaign
              vision.
            </p>
            <NavLink
              to="/dashboard/brief"
              className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 inline-block"
            >
              Open brief form
            </NavLink>
          </div>

          {/* Step 5: Ready to See Creators */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              Explore potential creators - 5 / 5
            </h2>
            <p className="mb-4">
              Once your brief is approved, discover and connect with creators
              who match your campaign requirements and audience.
            </p>
            <NavLink
              to="/dashboard/creators"
              className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 inline-block"
            >
              Open creator selection
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================ [ EXPORTS ] ================ */

export default Welcome;

import { NavLink } from 'react-router-dom';

export const WelcomePage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome to Your Campaign Journey</h1>
      
      <div className="w-full max-w-2xl space-y-6">
        {/* Step 1: Watch Video */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Step 1: Watch the Introduction</h2>
          <div className="aspect-w-16 aspect-h-9">
            <iframe 
              className="w-full h-64 rounded-md" 
              src="https://www.youtube.com/embed/S3SmtyzTv98" 
              title="Introduction Video" 
              allowFullScreen>
            </iframe>
          </div>
        </div>
        
{/* Step 2: Schedule a Call */}
<div className="bg-white p-6 rounded-lg shadow-md">
  <h2 className="text-xl font-semibold mb-2">Step 2 (Optional): Talk with the CEO</h2>
  <div className="rounded-lg overflow-hidden border border-gray-300 shadow-md relative invert-calcom">
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
  background-color: black; /* Ensures contrast */
  color: white; /* Adjust text color */
}

.invert-calcom *:not(img):not(video):not(iframe) {
  filter: invert(1) hue-rotate(180deg);
}


  `}
</style>




        
        {/* Step 3: Write a Brief */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Step 3: Write Your Brief</h2>
          <p className="mb-2">Use our template to draft your campaign brief.</p>
          <a 
            href="https://docs.google.com/document/d/1xAh64H5T87aQ7JCEuiBbQEYxNg9lNJ5DR7gKX-13Je0/edit?usp=sharing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 underline hover:text-blue-700"
          >
            Open Brief Template
          </a>
        </div>
        
        {/* Step 4: Enter Campaign Details */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Step 4: Fill Out Your Campaign Brief</h2>
          <p>Enter your brand information, creator preferences, and your creative brief.</p>
          <NavLink to="/dashboard/brief" className="text-blue-500 underline hover:text-blue-700">
            Go to Campaign Brief
          </NavLink>
        </div>
        
        {/* Step 5: Ready to See Creators */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Step 5: You're Ready to See Creators!</h2>
          <p>Now that your brief is complete, you can explore potential creators for your campaign.</p>
        </div>
      </div>
    </div>
  );
}

export default WelcomePage;

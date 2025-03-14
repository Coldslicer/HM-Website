/* ================ [ IMPORTS ] ================ */

// Icons
import { ClipboardList, Send, CheckCircle } from "lucide-react";

/* ================ [ COMPONENT ] ================ */

// Features component
function Features() {
  return (
    <section className="py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl md:text-[3.25rem] font-bold text-center mb-4">
          Reach the Right Creators <span className="text-[#FF6100]">Fast</span>
        </h2>
        <p className="text-xl text-center mb-16 text-gray-600">
          Warm sends your casting calls to hundreds of vetted influencers on{" "}
          <span className="text-[#7289DA]">Discord</span>
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#FF6100]/10 flex items-center justify-center">
              <ClipboardList className="w-10 h-10 text-[#FF6100]" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Step 1</h3>
            <p className="text-gray-600 font-medium text-lg">Submit Brief</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#FF6100]/10 flex items-center justify-center">
              <Send className="w-10 h-10 text-[#FF6100]" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Step 2</h3>
            <p className="text-gray-600 font-medium text-lg">We Ping, Influencers Apply</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#FF6100]/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-[#FF6100]" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Step 3</h3>
            <p className="text-gray-600 font-medium text-lg">Select Influencers & Run</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================ [ EXPORTS ] ================ */

export { Features };

import React from "react";

export default function Popup({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999]" />
      <div
        className="fixed top-1/2 left-1/2 z-[10000]
          w-[min(600px,90vw)] 
          -translate-x-1/2 -translate-y-1/2
          rounded-2xl bg-white shadow-xl"
      >
        {children}
      </div>
    </>
  );
}

export { Popup };

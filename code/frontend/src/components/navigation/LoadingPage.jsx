export const LoadingPage = () => (
  <div className="fixed inset-0 bg-spidhive-white z-50 flex flex-col items-center justify-center gap-10">
    <div className="flex items-center mb-3 mt-16 scale-120">
      <img alt="" src="/logo512.png" width="70" height="70" />
      <span className="flex flex-col">
        <span className="font-audiowide text-spidhive-black text-xl">
          SPIDHIVE
        </span>
        <span className="font-albert-sans text-spidhive-black text-tiny font-light">
          powered by SpidTech+
        </span>
      </span>
    </div>
    <div className="animate-spin rounded-full size-16 border-t-4 border-spidhive-light-green border-opacity-75"/>
  </div>
);

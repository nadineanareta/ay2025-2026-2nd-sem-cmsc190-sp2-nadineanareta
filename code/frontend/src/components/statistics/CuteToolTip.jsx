const CuteTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0].payload;
    const displayName = dataItem.crop || dataItem.name || dataItem.date || dataItem.location_name || label;
    return (
      <div className="bg-white px-2 py-1.5 border border-gray-100 shadow-sm rounded-md text-[10px] md:text-xs flex items-center gap-1.5">
        <span className="font-semibold text-spidhive-black">{displayName}:</span>
        <span className="text-[#22c55e] font-bold">{payload[0].value}</span>
      </div>
    );
  }
  return null;
};

export default CuteTooltip;
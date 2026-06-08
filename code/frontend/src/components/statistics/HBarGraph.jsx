import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import CuteTooltip from './CuteToolTip';
const HBargraph = ({data}) => {
  return (
    <div className="h-72 md:h-80 w-full overflow-x-auto overflow-y-hidden scrollbar-hide">
      <div className="min-w-[320px] md:min-w-full h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 50, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
            <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} hide />
            <YAxis dataKey="crop" type="category" fontSize={11} tickLine={false} axisLine={false} width={100} interval={0} className="font-semibold" />
            <Tooltip content={<CuteTooltip />} cursor={{ fill: '#f9fafb' }} />
            <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={20}>
              <LabelList dataKey="count" position="right" fontSize={10} fill="#6b7280" fontWeight="bold" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default HBargraph;
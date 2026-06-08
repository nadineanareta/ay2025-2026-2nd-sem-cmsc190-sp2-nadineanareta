import { Card } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import CuteTooltip from "./CuteToolTip";

const Trend = ({title, desc, data, viewType, setViewType, currentMonth, setCurrentMonth, currentYear, setCurrentYear}) => {
	return (
		<Card className="bg-white border-none shadow-sm p-4 sm:p-6 w-full overflow-hidden -gap-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
				<div>
					<h3 className="text-lg font-bold text-spidhive-black mb-1 uppercase">{title}</h3>
					<p className="text-xs text-gray-500">{desc}</p>
				</div>            
				<div className="flex flex-row items-center gap-2 md:gap-4 w-full sm:w-auto justify-between sm:justify-end">              
					{viewType === "monthly" && (
						<Select value={currentMonth.toString()} onValueChange={(val) => setCurrentMonth(parseInt(val))}>
							<SelectTrigger className="w-[90px] md:w-[100px] h-8 text-[10px] md:text-xs bg-gray-50 focus-visible:ring-2 focus-visible:ring-spidhive-light-green focus-visible:ring-offset-2">
								<SelectValue placeholder="Month" />
							</SelectTrigger>
							<SelectContent>
								{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
									<SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
					{viewType !== "all-time" && (
						<Select value={currentYear.toString()} onValueChange={(val) => setCurrentYear(parseInt(val))}>
							<SelectTrigger className="w-[80px] md:w-[90px] h-8 text-[10px] md:text-xs bg-gray-50 focus-visible:ring-2 focus-visible:ring-spidhive-light-green focus-visible:ring-offset-2">
								<SelectValue placeholder="Year" />
							</SelectTrigger>
							<SelectContent>
								{Array.from(
									{ length: new Date().getFullYear() - 2024 + 1 }, 
									(_, i) => (2024 + i).toString()
								).map(year => (
									<SelectItem key={year} value={year}>{year}</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
					<Select value={viewType} onValueChange={setViewType}>
						<SelectTrigger className="w-[100px] md:w-[110px] h-8 text-[10px] md:text-xs bg-gray-50 focus-visible:ring-2 focus-visible:ring-spidhive-light-green focus-visible:ring-offset-2">
							<SelectValue placeholder="Select view" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all-time">All-Time</SelectItem>
							<SelectItem value="yearly">Yearly</SelectItem>
							<SelectItem value="monthly">Monthly</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>          
			<div className="h-[240px] sm:h-[300px] w-full min-w-0">
				<ResponsiveContainer width="100%" height="100%">
					<LineChart data={data?.trendsTime} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
						<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
						<XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
						<YAxis fontSize={10} tickLine={false} axisLine={false} width={50} />
						<Tooltip 
							content={<CuteTooltip />}
							cursor={{ stroke: '#f9fafb', strokeWidth: 2 }}
						/>
						<Line type="monotone" name="Images" dataKey="count" stroke="#880000" strokeWidth={3} dot={{ r: 3, fill: "#880000" }} activeDot={{ r: 6 }} />
					</LineChart>
				</ResponsiveContainer>
			</div>
		</Card>
	);
}

export default Trend;
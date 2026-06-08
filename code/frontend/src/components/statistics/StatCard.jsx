import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
const StatCard = ({ title, value, icon, desc }) => (
    <Card className="bg-white border-none shadow-sm -gap-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-bold text-gray-400 uppercase">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-5xl font-black">{value || 0}</div>
        <p className="text-[10px] text-gray-400 mt-1 uppercase">{desc}</p>
      </CardContent>
    </Card>
  );

export default StatCard;
import { Skeleton } from "@/components/ui/skeleton";

export const AIModelsSkeleton = () => (
  <div className="flex justify-center w-full mt-[20vh]">
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[125px] w-[250px] rounded-xl bg-spidhive-black/30" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px] bg-spidhive-black/10" />
        <Skeleton className="h-4 w-[200px] bg-spidhive-black/10" />
      </div>
    </div>
  </div>
);
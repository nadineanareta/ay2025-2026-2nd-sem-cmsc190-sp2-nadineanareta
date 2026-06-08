import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PaginationComponent from "../image-library/PaginationComponent";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AIModelsSkeleton } from "../ai/AIModelsSkeleton";

const MyImages = () => {
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ rows: [], totalPages: 1, totalImages: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      try {
        const cookie = Cookies.get("cdexuser");
        const res = await fetch(`http://localhost:3001/image-data/my-images?page=${page}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${cookie}` },
        });
        if (res.ok) {
          const result = await res.json();
          setData({ rows: result.images.rows, totalPages: result.totalPages, totalImages: result.totalImages });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, [page]);

  if (loading) return <AIModelsSkeleton />;

  return (
    <div className="space-y-4">
      {data.totalImages > 0 ? (
        <>
        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-500">Total Uploads: <span className="text-spidhive-black font-bold">{data.totalImages}</span></span>
          </div>   

          <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {data.rows.map((image) => (
              <Dialog key={image.id}>
                <DialogTrigger asChild>
                  <div className="aspect-square relative rounded-xl overflow-hidden group cursor-pointer border border-gray-100 shadow-sm hover:scale-[1.02] transition-transform">
                    <img src={`https://www.api.spidhive.net/image-data${image.url}`} className="object-cover w-full h-full" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center text-white text-xs gap-1">
                      <span className="font-bold">{image.date}</span>
                      <span className={image.validity === 1 ? "text-green-400" : "text-amber-400"}>
                        {image.validity === 1 ? "Valid" : "Pending"}
                      </span>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-white p-2">
                  <img src={`https://www.api.spidhive.net/image-data${image.url}`} className="w-full h-auto rounded-lg" />
                </DialogContent>
              </Dialog>
            ))}
          </div>

          <div className="flex justify-center items-center pt-4 border-t bg-white">
              <PaginationComponent 
                currentPage={page}
                numberOfPages={data.totalPages}
                setCurrentPage={setPage}
              />
          </div>
        </div>
      </>
      ) : (
        <div className="flex justify-center items-center h-64 text-gray-400 font-medium text-lg border-2 border-dashed rounded-lg text-center px-4">
          You haven't uploaded any images yet.
        </div>
      )}
    </div>
  );
};

export default MyImages;
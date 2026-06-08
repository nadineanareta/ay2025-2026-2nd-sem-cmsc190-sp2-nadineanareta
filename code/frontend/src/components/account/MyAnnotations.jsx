import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Fullscreen } from "lucide-react";
import ImageWithAnnotationComponent from "./ImageWithAnnotationComponent";
import PaginationComponent from "../image-library/PaginationComponent";
import { motion } from "framer-motion";
import { AIModelsSkeleton } from "../ai/AIModelsSkeleton";

const MyAnnotations = () => {
  const [totalPages, setTotalPages] = useState(1);
  const [totalAnnotations, setTotalAnnotations] = useState(0);
  const [page, setPage] = useState(1);
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAnnotations = async () => {
      setLoading(true);
      try {
        const cookie = Cookies.get("cdexuser");
        const response = await fetch(
          `http://localhost:3001/annotations/my-annotations?page=${page}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cookie}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch images");
        }

        const data = await response.json();
        setAnnotations(data.annotations.rows); 
        setTotalPages(data.totalPages); 
        setTotalAnnotations(data.totalAnnotations); 
      } catch (error) {
        console.error("Error fetching annotations:", error);
      } finally {
        setLoading(false); 
      }
    };
    fetchAnnotations();
  }, [page]);

  if (loading) return <AIModelsSkeleton />;
  if (annotations.length === 0) return <div className="p-10 text-center text-gray-500">You have not made any annotations yet.</div>;

  return (
    <>
      <motion.h1
        className="text-spidhive-black text-2xl font-semibold text-center md:text-left mx-4 md:ml-28 my-6"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{
          delay: 0.5,
          duration: 0.5,
          ease: "easeIn",
        }}
      >
        My Annotations
      </motion.h1>
      <motion.p className="text-spidhive-black/80 text-center md:text-left mx-4 md:ml-28 my-2"
      initial={{ opacity: 0, y:20 }}
      animate={{ opacity: 1, y:0 }}
      transition={{ duration: 0.5, delay: 1.5 }}
      >Total Annotations: {totalAnnotations}
      </motion.p>
      
      <motion.div className="mx-4 md:mx-28 mb-12 border-1 border-t-0 rounded-2xl bg-spidhive-white overflow-hidden"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          delay: 0.8,
          duration: 0.5,
          ease: "easeInOut"}}>
        
        <div className="overflow-x-auto w-full">
          <Table className="table-fixed w-full min-w-[1000px] md:min-w-full">
            <TableHeader className="bg-gradient-to-r from-spidhive-dark-green to-[#65BE6C] text-spidhive-white">
              <TableRow className="hover:bg-transparent font-semibold text-center border-none">
                <TableCell className="py-4 rounded-tl-2xl whitespace-nowrap">Image ID</TableCell>
                <TableCell className="py-4 whitespace-nowrap">Label</TableCell>
                <TableCell className="py-4 whitespace-nowrap">Label Type</TableCell>
                <TableCell className="py-4 whitespace-nowrap">Created At</TableCell>
                <TableCell className="py-4 whitespace-nowrap">Updated At</TableCell>
                <TableCell className="py-4 rounded-tr-2xl whitespace-nowrap">Status</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {annotations.map((annotation) => (
                <TableRow key={annotation.id} className="text-center">
                  <TableCell className="py-4 text-start">
                    <Dialog>
                      <DialogTrigger>
                        <Fullscreen className="inline mx-8 text-spidhive-dark-green cursor-pointer hover:scale-110" />
                      </DialogTrigger>
                      <DialogContent className="bg-spidhive-white w-90">
                        <DialogHeader>
                          <DialogTitle>
                            Image ID: {annotation.image_data_id}
                          </DialogTitle>
                          <DialogDescription>
                            <ImageWithAnnotationComponent
                              imageUrl={`https://www.api.spidhive.net/image-data/retrieve-image?id=${annotation.image_data_id}`}
                              boxCoordinates={[
                                annotation.rect_left,
                                annotation.rect_top,
                                annotation.rect_right,
                                annotation.rect_bottom,
                              ]}
                            />
                            <span className="mt-4">
                              Label: {annotation.pest_disease_label} <br/>
                            </span>
                            <span className="mt-2">
                              Label Type: {annotation.label_type}
                            </span>
                          </DialogDescription>
                        </DialogHeader>
                      </DialogContent>
                    </Dialog>
                    <span className="ml-2 md:ml-8">{annotation.image_data_id}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    {annotation.pest_disease_label}
                  </TableCell>
                  <TableCell className="py-4 capitalize">
                    {annotation.label_type}
                  </TableCell>
                  <TableCell className="py-4 whitespace-nowrap">
                    {new Date(annotation.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="py-4 whitespace-nowrap">
                    {new Date(annotation.updatedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${annotation.is_deleted ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {annotation.is_deleted ? "Deleted" : "Saved"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex justify-center items-center py-6 border-t bg-white">
          <PaginationComponent 
            currentPage={page}
            numberOfPages={totalPages}
            setCurrentPage={setPage}
          />
        </div>
      </motion.div>
    </>
  );
};

export default MyAnnotations;
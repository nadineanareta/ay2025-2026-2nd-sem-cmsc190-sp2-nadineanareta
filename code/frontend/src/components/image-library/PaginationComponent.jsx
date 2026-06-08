import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

const PaginationComponent = ({ currentPage, numberOfPages, setCurrentPage }) => {
  if (numberOfPages <= 1) return null;

  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(numberOfPages, currentPage + 2);

  if (currentPage <= 3) {
    endPage = Math.min(5, numberOfPages);
  } else if (currentPage >= numberOfPages - 2) {
    startPage = Math.max(1, numberOfPages - 4);
  }

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center gap-1 md:gap-2">
      <Button
        variant="outline"
        className="w-8 h-8 md:w-9 md:h-9 p-0 bg-white shrink-0"
        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="w-4 h-4 text-gray-600" />
      </Button>

      {startPage > 1 && (
        <>
          <Button variant="outline" className="w-8 h-8 md:w-9 md:h-9 p-0 text-xs md:text-sm bg-white shrink-0" onClick={() => setCurrentPage(1)}>1</Button>
          {startPage > 2 && <MoreHorizontal className="w-4 h-4 text-gray-400 shrink-0" />}
        </>
      )}

      {pages.map((i) => (
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          className={`w-8 h-8 md:w-9 md:h-9 p-0 text-xs md:text-sm shrink-0 ${currentPage === i ? 'bg-spidhive-dark-green hover:bg-spidhive-dark-green/90 text-white' : 'bg-white text-gray-600'}`}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Button>
      ))}

      {endPage < numberOfPages && (
        <>
          {endPage < numberOfPages - 1 && <MoreHorizontal className="w-4 h-4 text-gray-400 shrink-0" />}
          <Button variant="outline" className="w-8 h-8 md:w-9 md:h-9 p-0 text-xs md:text-sm bg-white shrink-0" onClick={() => setCurrentPage(numberOfPages)}>{numberOfPages}</Button>
        </>
      )}

      <Button
        variant="outline"
        className="w-8 h-8 md:w-9 md:h-9 p-0 bg-white shrink-0"
        onClick={() => setCurrentPage(Math.min(numberOfPages, currentPage + 1))}
        disabled={currentPage === numberOfPages}
      >
        <ChevronRight className="w-4 h-4 text-gray-600" />
      </Button>
    </div>
  );
};

export default PaginationComponent;
import React, { useRef, useEffect, useState } from "react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
const PaginationComponent = ({
  currentPage,
  numberOfPages,
  setCurrentPage,
}) => {
  const [paginationArray, setPaginationArray] = useState([]);

  useEffect(() => {
    const maxVisiblePages = 9;

    var firstVisiblePage = Math.max(
      currentPage - Math.floor(maxVisiblePages / 2),
      1
    );
    var lastVisiblePage = firstVisiblePage + maxVisiblePages - 1;

    if (lastVisiblePage > numberOfPages) {
      lastVisiblePage = numberOfPages;
      firstVisiblePage = Math.max(lastVisiblePage - maxVisiblePages + 1, 1);
    }

    let items = [];

    for (let number = firstVisiblePage; number <= lastVisiblePage; number++) {
      items.push(
        <PaginationItem
          className="cursor-pointer text-spidhive-maroon "
          key={number}
          
        >
          <Button
            variant={
              number === currentPage
                ? "disabled"
                : "link"
            }
            className={
              number === currentPage
                ? "text-xl font-bold text-spidhive-maroon"
                : "text-spidhive-black"
            }
            onClick={() => {
              setCurrentPage(number);
            }}
          >
            {number}
          </Button>
        </PaginationItem>
      );
    }
    setPaginationArray(items);
  }, [currentPage, numberOfPages]);

  return (
    <Pagination>
		      <PaginationPrevious
        className="cursor-pointer text-spidhive-black hover:text-spidhive-maroon select-none"
        onClick={() => {
          setCurrentPage(Math.max(1, currentPage - 1));
        }}
      />
      <PaginationContent>{paginationArray}</PaginationContent>
	        <PaginationNext
        className="cursor-pointer text-spidhive-black hover:text-spidhive-maroon select-none"
        onClick={() => {
          setCurrentPage(Math.min(numberOfPages, currentPage + 1));
        }}
      />
    </Pagination>
  );
};

export default PaginationComponent;

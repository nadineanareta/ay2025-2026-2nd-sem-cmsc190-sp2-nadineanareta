import React, { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Cookies from "js-cookie";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
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
import { Check, X } from "lucide-react";
import { motion } from "framer-motion";

const RegistrationApprovalPage = () => {
  const maxItemsPerPage = 5;
  const maxVisiblePages = 3;
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [data, setData] = useState([]);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(maxItemsPerPage - 1);
  const [paginationGroup, setPaginationGroup] = useState(0);
  const [isBulkApproval, setIsBulkApproval] = useState(false);

  const fetchData = async () => {
    try {
      const cookie = Cookies.get("cdexuser");
      const response = await fetch(
        "http://localhost:3001/users/get-pending-users",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${cookie}`,
            "Content-Type": "application/json",
          },
        }
      );
      const jsonData = await response.json();
      setData(jsonData.pending_users);
      const totalItems = jsonData.pending_users.length;
      setTotalPages(Math.ceil(totalItems / maxItemsPerPage));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const approveUser = async (userId) => {
    const cookie = Cookies.get("cdexuser");
    try {
      await fetch("http://localhost:3001/users/approve-user", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cookie}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
      await fetchData();
      adjustPagination();
    } catch (error) {
      console.error("Error approving user:", error);
    }
  };

  const disapproveUser = async (userId) => {
    const cookie = Cookies.get("cdexuser");
    try {
      await fetch(
        "http://localhost:3001/users/disapprove-user",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cookie}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        }
      );
      await fetchData();
      adjustPagination();
    } catch (error) {
      console.error("Error disapproving user:", error);
    }
  };

  const adjustPagination = () => {
    if (page === totalPages && startIndex === endIndex) {
      handlePageChange(page - 1);
      setEndIndex(endIndex - 1);
      setTotalPages(totalPages - 1);
    } else if (page === totalPages) {
      setEndIndex(endIndex - 1);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    const newStartIndex = (newPage - 1) * maxItemsPerPage;
    const newEndIndex = Math.min(
      newStartIndex + maxItemsPerPage - 1,
      data.length - 1
    );
    setStartIndex(newStartIndex);
    setEndIndex(newEndIndex);
    setPaginationGroup(
      Math.floor(newStartIndex / (maxItemsPerPage * maxVisiblePages))
    );
  };

  const approveAllUsers = async () => {
    setIsBulkApproval(true);
    try {
      if (data.length === 0) return;
      const usersToApprove = data.slice(startIndex, endIndex + 1);
      for (const user of usersToApprove) {
        await approveUser(user.id);
      }
      await fetchData();
    } catch (error) {
      console.error("Error approving all users:", error);
    } finally {
      setIsBulkApproval(false);
    }
  };

  const disapproveAllUsers = async () => {
    setIsBulkApproval(true);
    try {
      if (data.length === 0) return;
      const usersToApprove = data.slice(startIndex, endIndex + 1);
      for (const user of usersToApprove) {
        await disapproveUser(user.id);
      }
      await fetchData();
    } catch (error) {
      console.error("Error disapproving all users:", error);
    } finally {
      setIsBulkApproval(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between mx-6 md:mx-28 my-6 gap-4">
        <motion.h1
          className="text-spidhive-black text-2xl font-semibold"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5, ease: "easeIn" }}
        >
          Registration Approval
        </motion.h1>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: "easeInOut" }}
        >
          {isBulkApproval ? (
            <span className="italic text-spidhive-black self-center">Processing...</span>
          ) : (
            <>
              <Button
                className="bg-spidhive-maroon text-spidhive-white hover:bg-spidhive-maroon/90 h-11"
                onClick={approveAllUsers}
              >
                <Check className="mr-1.5 size-4" /> Approve Page
              </Button>
              <Button
                className="bg-spidhive-maroon text-spidhive-white hover:bg-spidhive-maroon/90 h-11"
                onClick={disapproveAllUsers}
              >
                <X className="mr-1.5 size-4" /> Disapprove Page
              </Button>
            </>
          )}
        </motion.div>
      </div>

      <motion.div 
        className="mx-4 md:mx-28 rounded-2xl border mb-12 shadow-sm bg-white overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1, ease: "easeInOut" }}
      >
        <div className="overflow-x-auto">
          <Table className="min-w-[800px] md:table-fixed w-full">
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-spidhive-dark-green to-[#65BE6C] hover:from-spidhive-dark-green hover:to-[#65BE6C]">
                <TableHead className="text-center text-spidhive-white py-4 md:rounded-tl-2xl">Name</TableHead>
                <TableHead className="text-center text-spidhive-white py-4">Email</TableHead>
                <TableHead className="text-center text-spidhive-white py-4">Association</TableHead>
                <TableHead className="text-center text-spidhive-white py-4">Role</TableHead>
                <TableHead className="text-center text-spidhive-white py-4 md:rounded-tr-2xl">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(startIndex, endIndex + 1).map((user) => (
                <TableRow key={user.id} className="border-b">
                  <TableCell className="text-center py-4 font-medium">{user.display_name}</TableCell>
                  <TableCell className="text-center py-4">{user.username}</TableCell>
                  <TableCell className="text-center py-4">{user.association}</TableCell>
                  <TableCell className="text-center py-4">{user.access_level}</TableCell>
                  <TableCell className="text-center py-4">
                    <div className="flex justify-center gap-2">
                      <Button
                        size="sm"
                        className="bg-green-500 text-spidhive-white hover:bg-green-600 px-4"
                        onClick={() => approveUser(user.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-500 text-spidhive-white hover:bg-red-600 px-4"
                        onClick={() => disapproveUser(user.id)}
                      >
                        Disapprove
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5} className="py-6 bg-white">
                  {data.length > 0 ? (
                    <div className="flex flex-col items-center gap-4">
                      <span className="text-spidhive-dark-green text-sm">
                        Showing <span className="font-bold">{startIndex + 1}-{Math.min(endIndex + 1, data.length)}</span> of <span className="font-bold">{data.length}</span> users
                      </span>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              className="cursor-pointer"
                              onClick={() => handlePageChange(page - 1)}
                            />
                          </PaginationItem>

                          {[...Array(Math.min(totalPages, maxVisiblePages))].map((_, index) => {
                            const pageNum = index + 1 + (paginationGroup * maxVisiblePages);
                            if (pageNum > totalPages) return null;
                            return (
                              <PaginationItem key={pageNum}>
                                <Button
                                  variant={page === pageNum ? "secondary" : "ghost"}
                                  className={page === pageNum ? "text-spidhive-maroon font-bold" : ""}
                                  onClick={() => handlePageChange(pageNum)}
                                >
                                  {pageNum}
                                </Button>
                              </PaginationItem>
                            );
                          })}

                          {totalPages > (paginationGroup + 1) * maxVisiblePages && <PaginationEllipsis />}

                          <PaginationItem>
                            <PaginationNext
                              className="cursor-pointer"
                              onClick={() => handlePageChange(page + 1)}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  ) : (
                    <div className="text-gray-400 italic text-center py-4">No pending registrations.</div>
                  )}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </motion.div>
    </div>
  );
};

export default RegistrationApprovalPage;
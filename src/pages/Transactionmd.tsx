"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";

export default function MdTransactions() {
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const decoded: any = jwtDecode(token);
      const masterDistributorId = decoded?.data?.master_distributor_id;
      if (!masterDistributorId) {
        setLoading(false);
        return;
      }
      fetchWalletBalance(token, masterDistributorId);
      fetchTransactions(token, masterDistributorId);
    } catch (err) {
      console.error("Token decode error", err);
      setLoading(false);
    }
  }, []);

  const fetchWalletBalance = async (token: string, id: string) => {
    try {
      const res = await axios.get(
        `https://server.paybazaar.in/md/wallet/get/balance/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWalletBalance(res.data?.data?.balance ?? 0);
    } catch (err) {
      console.error("Wallet fetch error:", err);
    }
  };

  const fetchTransactions = async (token: string, id: string) => {
    try {
      const res = await axios.get(
        `https://server.paybazaar.in/md/wallet/get/transactions/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransactions(res.data?.data ?? []);
    } catch (err) {
      console.error("Transactions fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(transactions.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = transactions.slice(indexOfFirstRecord, indexOfLastRecord);

  // Trim remarks text
  const trimRemarks = (text: string) => {
    if (!text) return "";
    return text.length > 50 ? text.slice(0, 50) + "..." : text;
  };

  return (
    <DashboardLayout role="master" walletBalance={walletBalance}>
      <div className="max-w-7xl mx-auto p-8">
        <Card className="shadow-xl border border-gray-200 rounded-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Wallet Transactions
            </CardTitle>
            <CardDescription className="text-gray-600">
              Your recent wallet activity overview
            </CardDescription>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(recordsPerPage)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded-md" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-lg font-medium">
                No transactions found
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-md border border-gray-200 shadow-sm">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                      <tr>
                        <th className="p-3 w-16 text-center">ID</th>
                        <th className="p-3 text-left">Amount</th>
                        <th className="p-3 text-left">Type</th>
                        <th className="p-3 text-left">Service</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Remarks</th>
                      </tr>
                    </thead>

                    <tbody>
                      {currentRecords.map((txn, idx) => (
                        <tr
                          key={txn.transaction_id}
                          className="border-b last:border-none hover:bg-gray-50 transition-colors"
                        >
                          <td className="p-3 text-center font-medium text-gray-800">
                            {indexOfFirstRecord + idx + 1}
                          </td>
                          <td className="p-3 font-semibold text-gray-900">
                            ₹ {txn.amount}
                          </td>
                          <td className="p-3">
                            <Badge
                              className={
                                txn.transaction_type === "CREDIT"
                                  ? "bg-green-600"
                                  : "bg-red-600"
                              }
                            >
                              {txn.transaction_type}
                            </Badge>
                          </td>
                          <td className="p-3 text-gray-700">{txn.transaction_service}</td>
                          <td className="p-3">
                            <Badge className="bg-blue-600">{txn.transaction_status}</Badge>
                          </td>

                          <td className="p-3 text-gray-700">
                            <Dialog>
                              <DialogTrigger asChild>
                                <span
                                  className="cursor-pointer text-blue-600 underline"
                                  title={txn.remarks}
                                >
                                  {trimRemarks(txn.remarks)}
                                </span>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>Remarks</DialogTitle>
                                  <DialogDescription>
                                    {txn.remarks || "No remarks provided"}
                                  </DialogDescription>
                                </DialogHeader>
                              </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center mt-6">
                  <p className="text-sm text-gray-500 font-medium">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

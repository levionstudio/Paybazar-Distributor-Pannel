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

export default function DistributorTransactions() {
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      setLoading(false);
      return;
    }

    let decodedToken;
    try {
      decodedToken = jwtDecode(token);
    } catch (err) {
      setLoading(false);
      return;
    }

    const distributorId = decodedToken?.data?.distributor_id;

    if (!distributorId) {
      setLoading(false);
      return;
    }

    fetchWalletBalance(token, distributorId);
    fetchTransactions(token, distributorId);
  }, []);

  const fetchWalletBalance = async (token, distributorId) => {
    try {
      const res = await axios.get(
        `https://server.paybazaar.in/distributor/wallet/get/balance/${distributorId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setWalletBalance(res.data.data.balance);
    } catch (err) {}
  };

  const fetchTransactions = async (token, distributorId) => {
    try {
      const res = await axios.get(
        `https://server.paybazaar.in/distributor/wallet/get/transactions/${distributorId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setTransactions(res.data.data || []);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = transactions.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );

  const totalPages = Math.ceil(transactions.length / recordsPerPage);

  const trimText = (text) => {
    if (!text) return "";
    return text.length > 40 ? `${text.slice(0, 40)}...` : text;
  };

  return (
    <DashboardLayout role="distributor" walletBalance={walletBalance}>
      <div className="max-w-6xl mx-auto p-6">
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">
              Wallet Transactions
            </CardTitle>
            <CardDescription className="text-gray-500">
              All credits & debits
            </CardDescription>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="h-10 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No transactions found
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-gray-100 text-gray-600 border-b">
                      <tr>
                        <th className="p-3 text-center w-16">ID</th>
                        <th className="p-3 text-left">Amount</th>
                        <th className="p-3 text-left">Type</th>
                        <th className="p-3 text-left">Service</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Remarks</th>
                      </tr>
                    </thead>

                    <tbody>
                      {currentRecords.map((t, index) => (
                        <tr
                          key={t.transaction_id}
                          className="border-b hover:bg-gray-50 transition"
                        >
                          <td className="p-3 font-medium text-gray-800 text-center">
                            {indexOfFirstRecord + index + 1}
                          </td>

                          <td className="p-3 font-semibold text-gray-900">
                            ₹ {t.amount}
                          </td>

                          <td className="p-3">
                            <Badge
                              className={
                                t.transaction_type === "CREDIT"
                                  ? "bg-green-600"
                                  : "bg-red-600"
                              }
                            >
                              {t.transaction_type}
                            </Badge>
                          </td>

                          <td className="p-3">{t.transaction_service}</td>

                          <td className="p-3">
                            <Badge className="bg-blue-600">
                              {t.transaction_status}
                            </Badge>
                          </td>

                          <td className="p-3 text-gray-700">
                            <Dialog>
                              <DialogTrigger asChild>
                                <span className="cursor-pointer text-blue-600 underline">
                                  {trimText(t.remarks)}
                                </span>
                              </DialogTrigger>

                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Remarks</DialogTitle>
                                  <DialogDescription>
                                    {t.remarks || "No remarks provided"}
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
                  <p className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </p>

                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => prev - 1)}
                    >
                      Previous
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => prev + 1)}
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

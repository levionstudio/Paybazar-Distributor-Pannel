"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { DashboardLayout } from "@/components/DashboardLayout";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FundRequest {
  request_unique_id: string;
  requester_unique_id: string;
  requester_name: string;
  requester_type: string;
  amount: string;
  remarks: string;
  request_status: string;
}

interface DecodedToken {
  data: {
    master_distributor_id?: string;
  };
  exp: number;
}

export default function MdFundRequests() {
  const [requests, setRequests] = useState<FundRequest[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [masterDistributorId, setMasterDistributorId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Decode token
  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      setError("Authentication token missing.");
      setLoading(false);
      return;
    }

    try {
      const decoded: DecodedToken = jwtDecode(token);
      const id = decoded?.data?.master_distributor_id;

      if (!id) {
        setError("Master Distributor ID missing in token.");
        setLoading(false);
        return;
      }

      setMasterDistributorId(id);
    } catch (err) {
      setError("Failed to decode token.");
      setLoading(false);
    }
  }, []);

  // ✅ Fetch fund requests + wallet
  useEffect(() => {
    if (!masterDistributorId) return;

    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      try {
        // ✅ Fetch fund requests
        const res = await axios.get(
          `https://server.paybazaar.in/md/get/fund/request/${masterDistributorId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.status === "success") {
          const mapped: FundRequest[] = res.data.data.map((item: any) => ({
            request_unique_id: item.request_unique_id,
            requester_unique_id: item.requester_unique_id,
            requester_name: item.requester_name,
            requester_type: item.requester_type,
            amount: item.amount,
            remarks: item.remarks,
            request_status: item.request_status,
          }));

          setRequests(mapped);
          setError(null);
        } else {
          setRequests([]);
          setError(res.data.message || "Failed to load fund requests.");
        }

        // ✅ Fetch wallet balance
        const walletRes = await axios.get(
          `https://server.paybazaar.in/md/wallet/get/balance/${masterDistributorId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const balance = walletRes.data?.data?.balance;
        setWalletBalance(balance ? Number(balance) : 0);
      } catch (err) {
        console.error(err);
        setError("No fund requests found.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [masterDistributorId]);

  return (
    <DashboardLayout role="master" walletBalance={walletBalance}>
      <div className="px-4 sm:px-6 md:px-8 py-6 space-y-6">

        {/* Loading */}
        {loading && (
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded-md"></div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <p className="text-center text-red-600 py-6">{error}</p>
        )}

        {/* Content */}
        {!loading && !error && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                Fund Requests
              </CardTitle>
            </CardHeader>

            <CardContent>

              {requests.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground">
                  No fund requests found.
                </p>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center w-16">ID</TableHead>
                          <TableHead className="text-center">Request ID</TableHead>
                          <TableHead className="text-center">Requester</TableHead>
                          <TableHead className="text-center">Amount</TableHead>
                          <TableHead className="text-center">Remarks</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {requests.map((r, index) => (
                          <TableRow key={r.request_unique_id}>
                            <TableCell className="text-center font-semibold">
                              {index + 1}
                            </TableCell>
                            <TableCell className="text-center">
                              {r.request_unique_id}
                            </TableCell>

                            <TableCell className="text-center">
                              {r.requester_name}
                            </TableCell>

                            <TableCell className="text-center font-semibold">
                              ₹{parseFloat(r.amount).toLocaleString("en-IN")}
                            </TableCell>

                            <TableCell className="text-center text-gray-600">
                              {r.remarks}
                            </TableCell>

                            <TableCell className="text-center font-semibold">
                              <span
                                className={`px-3 py-1 rounded-md text-white ${
                                  r.request_status === "APPROVED"
                                    ? "bg-green-600"
                                    : r.request_status === "PENDING"
                                    ? "bg-yellow-500"
                                    : "bg-red-600"
                                }`}
                              >
                                {r.request_status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {requests.map((r, index) => (
                      <div
                        key={r.request_unique_id}
                        className="border rounded-lg p-4 shadow-lg"
                      >
                        <p className="font-semibold">#{index + 1}</p>
                        <p><strong>Request ID:</strong> {r.request_unique_id}</p>
                        <p><strong>Name:</strong> {r.requester_name}</p>
                        <p><strong>Amount:</strong> ₹{r.amount}</p>
                        <p><strong>Remarks:</strong> {r.remarks}</p>
                        <p>
                          <strong>Status:</strong>{" "}
                          <span
                            className={`px-2 py-1 rounded-md text-white ${
                              r.request_status === "APPROVED"
                                ? "bg-green-600"
                                : r.request_status === "PENDING"
                                ? "bg-yellow-500"
                                : "bg-red-600"
                            }`}
                          >
                            {r.request_status}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

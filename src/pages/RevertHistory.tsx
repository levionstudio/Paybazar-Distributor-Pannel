import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Loader2, Search, RefreshCw, History } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";

interface TokenData {
  data: {
    admin_id: string;
    master_distributor_id?: string;
    distributor_id?: string;
    [key: string]: any;
  };
  exp: number;
}

interface RevertHistory {
  revert_id: string;
  unique_id: string;
  name: string;
  phone: string;
  amount: string;
  created_at: string;
}

export default function RevertHistoryPage() {
  const token = localStorage.getItem("authToken");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [revertHistory, setRevertHistory] = useState<RevertHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [userRole, setUserRole] = useState<"master" | "distributor">("distributor");
  const [walletBalance, setWalletBalance] = useState(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const itemsPerPage = 10;

  // Decode token and determine role
  useEffect(() => {
    const checkAuth = () => {
      if (!token) {
        toast.error("Authentication required. Please login.");
        window.location.href = "/login";
        return;
      }

      try {
        const decoded: TokenData = jwtDecode(token);

        if (!decoded?.exp || decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem("authToken");
          toast.error("Session expired. Please log in again.");
          window.location.href = "/login";
          return;
        }

        setTokenData(decoded);

        // Determine role based on token
        if (decoded.data.master_distributor_id) {
          setUserRole("master");
        } else if (decoded.data.distributor_id) {
          setUserRole("distributor");
        } else {
          toast.error("Invalid user role");
          window.location.href = "/login";
          return;
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        toast.error("Invalid token. Please login again.");
        window.location.href = "/login";
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [token]);

  // Fetch wallet balance
  useEffect(() => {
    if (!tokenData) return;

    const fetchBalance = async () => {
      if (!token) return;

      try {
        let endpoint = "";
        if (userRole === "master" && tokenData.data.master_distributor_id) {
          endpoint = `${import.meta.env.VITE_API_BASE_URL}/md/wallet/get/balance/${tokenData.data.master_distributor_id}`;
        } else if (userRole === "distributor" && tokenData.data.distributor_id) {
          endpoint = `${import.meta.env.VITE_API_BASE_URL}/distributor/wallet/get/balance/${tokenData.data.distributor_id}`;
        }

        if (endpoint) {
          const response = await fetch(endpoint, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          if (data.status === "success") {
            setWalletBalance(Number(data.data.balance) || 0);
          }
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };

    fetchBalance();
  }, [tokenData, userRole, token]);

  // Fetch revert history by phone number
  const fetchRevertHistory = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    if (!token) {
      toast.error("Authentication required");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const endpoint = userRole === "master"
        ? `${import.meta.env.VITE_API_BASE_URL}/md/revert/get/history/${phoneNumber}`
        : `${import.meta.env.VITE_API_BASE_URL}/distributor/revert/get/history/${phoneNumber}`;

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data && response.data.status === "success" && response.data.data) {
        const historyList = response.data.data.revert_history || [];

        // Sort by created_at (most recent first)
        const sortedHistory = [...historyList].sort((a: RevertHistory, b: RevertHistory) => {
          try {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
            const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
            return timeB - timeA;
          } catch (error) {
            return 0;
          }
        });

        setRevertHistory(sortedHistory);
        setCurrentPage(1);

        if (sortedHistory.length > 0) {
          toast.success(`Found ${sortedHistory.length} revert record${sortedHistory.length > 1 ? 's' : ''}`);
        } else {
          toast.info("No revert history found for this phone number");
        }
      } else {
        setRevertHistory([]);
        toast.info("No revert history found for this phone number");
      }
    } catch (error: any) {
      setRevertHistory([]);

      if (error.response?.status === 404) {
        toast.info("No revert history found for this phone number");
      } else {
        toast.error(
          error.response?.data?.message || "Failed to fetch revert history"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRevertHistory();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount: string) => {
    return parseFloat(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const totalPages = Math.ceil(revertHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHistory = revertHistory.slice(startIndex, endIndex);

  // Generate page numbers to show (max 10 visible page buttons)
  const getPageNumbers = () => {
    const maxVisiblePages = 10;

    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfVisible = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  };

  if (isCheckingAuth) {
    return (
      <DashboardLayout role={userRole} walletBalance={walletBalance}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={userRole} walletBalance={walletBalance}>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <History className="h-6 w-6 md:h-8 md:w-8" />
              Revert History
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Search revert history by phone number (Latest first)
            </p>
          </div>
          {searched && revertHistory.length > 0 && (
            <Button onClick={fetchRevertHistory} variant="outline" size="sm" className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>

        {/* Search Form */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone-input">Phone Number</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="phone-input"
                    type="tel"
                    placeholder="Enter phone number (e.g., 9876543210)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    maxLength={10}
                    className="flex-1"
                    disabled={loading}
                    style={{ fontSize: "16px" }}
                  />
                  <Button type="submit" disabled={loading || !phoneNumber.trim()} className="w-full sm:w-auto">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    <span className="ml-2">Search</span>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter a 10-digit phone number to search revert history
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results Table */}
        {searched && (
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-muted/50 sticky top-0 z-10">
                      <tr>
                        <th className="text-center whitespace-nowrap px-2 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b">
                          Revert ID
                        </th>
                        <th className="text-center whitespace-nowrap px-2 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b">
                          Unique ID
                        </th>
                        <th className="text-center whitespace-nowrap px-2 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b">
                          Name
                        </th>
                        <th className="text-center whitespace-nowrap px-2 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b">
                          Phone Number
                        </th>
                        <th className="text-center whitespace-nowrap px-2 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b">
                          Amount
                        </th>
                        <th className="text-center whitespace-nowrap px-2 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b">
                          Created At
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedHistory.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center text-muted-foreground py-12"
                          >
                            <div className="flex flex-col items-center justify-center">
                              <History className="h-12 w-12 text-muted-foreground/50 mb-3" />
                              <p className="text-base md:text-lg font-medium">No revert history found</p>
                              <p className="text-xs md:text-sm">
                                Try searching with a different phone number
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedHistory.map((record) => (
                          <tr
                            key={record.revert_id}
                            className="border-b hover:bg-muted/30 transition-colors"
                          >
                            <td className="text-center px-2 sm:px-4 py-3">
                              <span className="font-mono text-xs sm:text-sm font-medium break-all">
                                {record.revert_id}
                              </span>
                            </td>
                            <td className="text-center px-2 sm:px-4 py-3">
                              <span className="font-mono text-xs sm:text-sm break-all">
                                {record.unique_id}
                              </span>
                            </td>
                            <td className="text-center px-2 sm:px-4 py-3">
                              <span className="font-medium text-xs sm:text-sm break-words">
                                {record.name}
                              </span>
                            </td>
                            <td className="text-center px-2 sm:px-4 py-3">
                              <span className="font-mono text-xs sm:text-sm">
                                {record.phone}
                              </span>
                            </td>
                            <td className="text-center px-2 sm:px-4 py-3">
                              <span className="font-semibold text-xs sm:text-sm">
                                ₹{formatAmount(record.amount)}
                              </span>
                            </td>
                            <td className="text-center px-2 sm:px-4 py-3 whitespace-nowrap">
                              <span className="text-xs sm:text-sm">
                                {formatDate(record.created_at)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>

            {revertHistory.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 md:px-6 py-4 border-t">
                <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, revertHistory.length)} of{" "}
                  {revertHistory.length} records
                </p>
                <div className="flex gap-2 flex-wrap justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1 flex-wrap">
                    {getPageNumbers().map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 sm:w-10"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

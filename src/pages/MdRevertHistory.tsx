import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, RefreshCw, History } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";

interface TokenData {
  data: {
    admin_id: string;
    master_distributor_id?: string;
    [key: string]: any;
  };
  exp: number;
}

interface Distributor {
  distributor_unique_id: string;
  distributor_id: string;
  distributor_name: string;
  distributor_phone: string;
  distributor_wallet_balance: string;
}

interface Retailer {
  user_unique_id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  user_wallet_balance: string;
}

interface RevertHistory {
  revert_id: string;
  unique_id: string;
  name: string;
  phone: string;
  amount: string;
  created_at: string;
}

export default function MdRevertHistory() {
  const token = localStorage.getItem("authToken");
  const [userType, setUserType] = useState("");
  const [selectedDistributorId, setSelectedDistributorId] = useState("");
  const [selectedRetailerId, setSelectedRetailerId] = useState("");
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [revertHistory, setRevertHistory] = useState<RevertHistory[]>([]);
  const [isLoadingDistributors, setIsLoadingDistributors] = useState(false);
  const [isLoadingRetailers, setIsLoadingRetailers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const itemsPerPage = 10;

  // Decode token and verify Master Distributor role
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

        if (!decoded.data.master_distributor_id) {
          toast.error("Unauthorized access. Master Distributor only.");
          window.location.href = "/login";
          return;
        }

        setTokenData(decoded);
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
        const endpoint = `${import.meta.env.VITE_API_BASE_URL}/md/wallet/get/balance/${tokenData.data.master_distributor_id}`;
        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.status === "success") {
          setWalletBalance(Number(data.data.balance) || 0);
        }
      } catch (error) {
        console.error(" Error fetching balance:", error);
      }
    };

    fetchBalance();
  }, [tokenData, token]);

  // Fetch distributors when user type is selected
  useEffect(() => {
    if (!userType || !tokenData?.data?.master_distributor_id) {
      setDistributors([]);
      setRetailers([]);
      return;
    }

    const fetchDistributors = async () => {
      setIsLoadingDistributors(true);
      
      try {
        const endpoint = `${import.meta.env.VITE_API_BASE_URL}/admin/get/distributors/${tokenData.data.master_distributor_id}`;

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(` HTTP Error ${response.status}:`, errorText);
          toast.error(`Failed to load distributors: ${response.status}`);
          setDistributors([]);
          return;
        }

        const responseText = await response.text();

        if (!responseText || responseText.trim() === '') {
          toast.info("No distributors found");
          setDistributors([]);
          return;
        }

        const data = JSON.parse(responseText);

        let distributorsList: Distributor[] = [];
        
        if (data.status === "success" && data.data) {
          let extractedData = data.data;
          if (Array.isArray(extractedData)) {
            distributorsList = extractedData;
          } else if (extractedData && Array.isArray(extractedData.distributors)) {
            distributorsList = extractedData.distributors;
          }
        } else if (Array.isArray(data)) {
          distributorsList = data;
        }

        setDistributors(distributorsList);

        if (distributorsList.length === 0) {
          toast.info("No distributors found under your account");
        } else {
          toast.success(`Loaded ${distributorsList.length} distributor${distributorsList.length > 1 ? 's' : ''}`);
        }
      } catch (error) {
        console.error("Error fetching distributors:", error);
        toast.error("Failed to load distributors. Please try again.");
        setDistributors([]);
      } finally {
        setIsLoadingDistributors(false);
      }
    };

    fetchDistributors();
  }, [userType, tokenData, token]);

  useEffect(() => {
    if (userType !== "retailer" || !selectedDistributorId) {
      setRetailers([]);
      return;
    }

    const fetchRetailers = async () => {
      setIsLoadingRetailers(true);
      
      try {
        const selectedDist = distributors.find(d => d.distributor_unique_id === selectedDistributorId);
        const distributorId = selectedDist?.distributor_id || selectedDistributorId;
        
   
        
        const endpoint = `${import.meta.env.VITE_API_BASE_URL}/admin/get/users/${distributorId}`;

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(` HTTP Error ${response.status}:`, errorText);
          toast.error(`Failed to load retailers: ${response.status}`);
          setRetailers([]);
          return;
        }

        const responseText = await response.text();

        if (!responseText || responseText.trim() === '') {
          toast.info("No retailers found under this distributor");
          setRetailers([]);
          return;
        }

        const data = JSON.parse(responseText);

        let retailersList: Retailer[] = [];
        
        if (data.status === "success" && data.data) {
          let extractedData = data.data;
          if (Array.isArray(extractedData)) {
            retailersList = extractedData;
          } else if (extractedData && Array.isArray(extractedData.users)) {
            retailersList = extractedData.users;
          }
        } else if (Array.isArray(data)) {
          retailersList = data;
        }

        setRetailers(retailersList);

        if (retailersList.length === 0) {
          toast.info("No retailers found under this distributor");
        } else {
          toast.success(`Loaded ${retailersList.length} retailer${retailersList.length > 1 ? 's' : ''}`);
        }
      } catch (error) {
        toast.error("Failed to load retailers. Please try again.");
        setRetailers([]);
      } finally {
        setIsLoadingRetailers(false);
      }
    };

    fetchRetailers();
  }, [selectedDistributorId, userType, distributors, token]);

  const handleUserTypeChange = (value: string) => {
    setUserType(value);
    setSelectedDistributorId("");
    setSelectedRetailerId("");
    setSearched(false);
    setRevertHistory([]);
    setRetailers([]);
    setCurrentPage(1);
  };

  const handleDistributorChange = (distributorId: string) => {
    setSelectedDistributorId(distributorId);
    setSelectedRetailerId("");
    setSearched(false);
    setRevertHistory([]);
    setCurrentPage(1);
  };

  const handleRetailerChange = (retailerId: string) => {
    setSelectedRetailerId(retailerId);
    setSearched(false);
    setRevertHistory([]);
    setCurrentPage(1);
  };

  // Fetch revert history
  const fetchRevertHistory = async () => {
    if (!userType) {
      toast.error("Please select user type");
      return;
    }

    if (!selectedDistributorId) {
      toast.error("Please select a distributor");
      return;
    }

    if (userType === "retailer" && !selectedRetailerId) {
      toast.error("Please select a retailer");
      return;
    }

    if (!token) {
      toast.error("Authentication required");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      let phoneNumber = "";
      let selectedName = "";

      if (userType === "distributor") {
        const selectedDist = distributors.find(d => d.distributor_unique_id === selectedDistributorId);
        phoneNumber = selectedDist?.distributor_phone || "";
        selectedName = selectedDist?.distributor_name || "";
      } else if (userType === "retailer") {
        const selectedRetailer = retailers.find(r => r.user_unique_id === selectedRetailerId);
        phoneNumber = selectedRetailer?.user_phone || "";
        selectedName = selectedRetailer?.user_name || "";
      }

      if (!phoneNumber) {
        toast.error("Unable to get phone number");
        setLoading(false);
        return;
      }


      const endpoint = `${import.meta.env.VITE_API_BASE_URL}/admin/revert/get/history/${phoneNumber}`;

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
          toast.info("No revert history found");
        }
      } else {
        setRevertHistory([]);
        toast.info("No revert history found");
      }
    } catch (error: any) {
      console.error(" Error fetching history:", error);
      setRevertHistory([]);

      if (error.response?.status === 404) {
        toast.info("No revert history found");
      } else {
        toast.error(
          error.response?.data?.message || "Failed to fetch revert history"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
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

  const getSelectedUserName = () => {
    if (userType === "distributor" && selectedDistributorId) {
      return distributors.find(d => d.distributor_unique_id === selectedDistributorId)?.distributor_name;
    } else if (userType === "retailer" && selectedRetailerId) {
      return retailers.find(r => r.user_unique_id === selectedRetailerId)?.user_name;
    }
    return null;
  };

  if (isCheckingAuth) {
    return (
      <DashboardLayout role="master" walletBalance={walletBalance}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const canSearch = userType === "distributor" ? !!selectedDistributorId : (!!selectedDistributorId && !!selectedRetailerId);

  return (
    <DashboardLayout role="master" walletBalance={walletBalance}>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <History className="h-6 w-6 md:h-8 md:w-8" />
              Revert History
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              View revert history for distributors and retailers
            </p>
          </div>
          {searched && revertHistory.length > 0 && (
            <Button onClick={fetchRevertHistory} variant="outline" size="sm" className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>

        {/* Selection Form */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* User Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="userType">Select User Type</Label>
                <Select value={userType} onValueChange={handleUserTypeChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="--Select User Type--" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distributor">Distributor</SelectItem>
                    <SelectItem value="retailer">Retailer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Distributor Selection */}
              {userType && (
                <div className="space-y-2">
                  <Label htmlFor="distributor">
                    {userType === "distributor" 
                      ? "Select Distributor" 
                      : "Select Distributor (to view retailers)"}
                  </Label>
                  {isLoadingDistributors ? (
                    <div className="flex items-center justify-center p-4 border rounded-md">
                      <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                      <span className="text-sm text-muted-foreground">
                        Loading distributors...
                      </span>
                    </div>
                  ) : distributors.length === 0 ? (
                    <div className="p-4 border rounded-md text-center text-sm text-muted-foreground">
                      No distributors found under your account
                    </div>
                  ) : (
                    <Select value={selectedDistributorId} onValueChange={handleDistributorChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="--Select Distributor--" />
                      </SelectTrigger>
                      <SelectContent>
                        {distributors.map((distributor) => (
                          <SelectItem
                            key={distributor.distributor_unique_id}
                            value={distributor.distributor_unique_id}
                          >
                            {distributor.distributor_name} - {distributor.distributor_phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Retailer Selection (only for retailer type) */}
              {userType === "retailer" && selectedDistributorId && (
                <div className="space-y-2">
                  <Label htmlFor="retailer">Select Retailer</Label>
                  {isLoadingRetailers ? (
                    <div className="flex items-center justify-center p-4 border rounded-md">
                      <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                      <span className="text-sm text-muted-foreground">
                        Loading retailers...
                      </span>
                    </div>
                  ) : retailers.length === 0 ? (
                    <div className="p-4 border rounded-md text-center text-sm text-muted-foreground">
                      No retailers found under this distributor
                    </div>
                  ) : (
                    <Select value={selectedRetailerId} onValueChange={handleRetailerChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="--Select Retailer--" />
                      </SelectTrigger>
                      <SelectContent>
                        {retailers.map((retailer) => (
                          <SelectItem
                            key={retailer.user_unique_id}
                            value={retailer.user_unique_id}
                          >
                            {retailer.user_name} - {retailer.user_phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              <Button 
                onClick={handleSearch} 
                disabled={!canSearch || loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <History className="h-4 w-4 mr-2" />
                    View History
                  </>
                )}
              </Button>
            </div>
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
                <>
                  {getSelectedUserName() && revertHistory.length > 0 && (
                    <div className=" border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                      <p className="text-sm font-medium text-center">
                        Showing revert history for: <span className="text-primary">{getSelectedUserName()}</span>
                        {userType && <span className="text-muted-foreground ml-2">({userType})</span>}
                      </p>
                    </div>
                  )}
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
                                  This user has no revert records
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
                                <span className="font-semibold text-xs sm:text-sm text-red-600">
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
                </>
              )}
            </CardContent>

            {revertHistory.length > 0 && (
              <div className=" flex flex-col sm:flex-row items-center justify-between gap-4 px-4 md:px-6 py-4 border-t">
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
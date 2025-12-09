import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Loader2 } from "lucide-react";

interface TokenData {
  data: {
    admin_id: string;
    master_distributor_id: string;
    master_distributor_unique_id: string;
    master_distributor_name: string;
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

interface RetailerDetails {
  name: string;
  phone: string;
  userId: string;
  currentBalance: number;
}

const MdFundRetailer = () => {
  const { toast } = useToast();

  const [selectedDistributorId, setSelectedDistributorId] = useState("");
  const [selectedRetailerId, setSelectedRetailerId] = useState("");
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [retailerDetails, setRetailerDetails] = useState<RetailerDetails | null>(null);
  const [amount, setAmount] = useState("");
  const [isLoadingDistributors, setIsLoadingDistributors] = useState(false);
  const [isLoadingRetailers, setIsLoadingRetailers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Decode token with master distributor fields
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please login to continue.",
          variant: "destructive",
        });
        window.location.href = "/login";
        return;
      }

      try {
        const decoded: TokenData = jwtDecode(token);

        if (!decoded?.exp || decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem("authToken");
          toast({
            title: "Session Expired",
            description: "Please log in again.",
            variant: "destructive",
          });
          window.location.href = "/login";
          return;
        }

        if (!decoded.data.master_distributor_id) {
          toast({
            title: "Invalid Token",
            description: "Master Distributor ID missing.",
            variant: "destructive",
          });
          window.location.href = "/login";
          return;
        }

        setTokenData(decoded);
      } catch {
        toast({
          title: "Invalid Token",
          description: "Please login again",
          variant: "destructive",
        });
        window.location.href = "/login";
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch wallet balance
  useEffect(() => {
    if (!tokenData) return;

    const fetchBalance = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/md/wallet/get/balance/${tokenData.data.master_distributor_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.data.status === "success") {
          setWalletBalance(Number(res.data.data.balance));
        }
      } catch {
        setWalletBalance(0);
      }
    };

    fetchBalance();
  }, [tokenData]);

  // Fetch distributors list on mount
  useEffect(() => {
    if (!tokenData?.data?.master_distributor_id) return;

    const fetchDistributors = async () => {
      setIsLoadingDistributors(true);
      const token = localStorage.getItem("authToken");

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
          toast({
            title: "Error",
            description: "Failed to load distributors",
            variant: "destructive",
          });
          setDistributors([]);
          return;
        }

        const responseText = await response.text();
        if (!responseText || responseText.trim() === "") {
          toast({
            title: "No Distributors",
            description: "No distributors found under your account",
            variant: "default",
          });
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
          toast({
            title: "No Distributors",
            description: "No distributors found under your account",
            variant: "default",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load distributors. Please try again.",
          variant: "destructive",
        });
        setDistributors([]);
      } finally {
        setIsLoadingDistributors(false);
      }
    };

    fetchDistributors();
  }, [tokenData]);

  // Fetch retailers when distributor is selected
  useEffect(() => {
    if (!selectedDistributorId) {
      setRetailers([]);
      return;
    }

    const fetchRetailers = async () => {
      setIsLoadingRetailers(true);
      const token = localStorage.getItem("authToken");

      try {
        const selectedDist = distributors.find(
          (d) => d.distributor_unique_id === selectedDistributorId
        );
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
          toast({
            title: "Error",
            description: `Failed to load retailers: ${response.status}`,
            variant: "destructive",
          });
          setRetailers([]);
          return;
        }

        const responseText = await response.text();

        if (!responseText || responseText.trim() === "") {
          toast({
            title: "No Retailers",
            description: "No retailers found under this distributor",
            variant: "default",
          });
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
          toast({
            title: "No Retailers",
            description: "No retailers found under this distributor",
            variant: "default",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load retailers. Please try again.",
          variant: "destructive",
        });
        setRetailers([]);
      } finally {
        setIsLoadingRetailers(false);
      }
    };

    fetchRetailers();
  }, [selectedDistributorId, distributors]);

  const handleDistributorChange = (distributorId: string) => {
    setSelectedDistributorId(distributorId);
    setSelectedRetailerId("");
    setRetailerDetails(null);
    setAmount("");
  };

  const handleRetailerSelection = (retailerId: string) => {
    setSelectedRetailerId(retailerId);

    const selectedRetailer = retailers.find((r) => r.user_unique_id === retailerId);
    if (selectedRetailer) {
      const details: RetailerDetails = {
        name: selectedRetailer.user_name || "N/A",
        phone: selectedRetailer.user_phone || "N/A",
        userId: selectedRetailer.user_unique_id || "N/A",
        currentBalance: parseFloat(selectedRetailer.user_wallet_balance || "0"),
      };
      setRetailerDetails(details);
    }
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!retailerDetails) {
      toast({
        title: "Error",
        description: "Please select a retailer",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (!tokenData) return;

    const token = localStorage.getItem("authToken");

    const payload = {
      master_distributor_id: tokenData.data.master_distributor_id,
      phone_number: retailerDetails.phone,
      amount: amount,
    };

    try {
      setLoading(true);
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/md/fund/retailer`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast({
        title: "Fund Transfer Successful",
        description: data.message || "Funds added to retailer successfully.",
      });

      // Reset form
      setSelectedDistributorId("");
      setSelectedRetailerId("");
      setRetailerDetails(null);
      setAmount("");
      setRetailers([]);

      setTimeout(() => (window.location.href = "/master"), 800);
    } catch (err: any) {
      toast({
        title: "Transfer Failed",
        description:
          err.response?.data?.message ||
          "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  return (
    <DashboardLayout role="master" walletBalance={walletBalance}>
      <div className="flex flex-col max-w-2xl mx-auto w-full">
        <Card className="shadow-md border rounded-xl overflow-hidden">
          <CardHeader className="gradient-primary text-primary-foreground rounded-t-xl">
            <CardTitle className="text-2xl">Add Funds to Retailer</CardTitle>
            <CardDescription className="text-primary-foreground/80 mt-1">
              Transfer funds to a retailer's wallet
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 md:p-8 bg-card">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Distributor Selection */}
              <div className="space-y-2">
                <Label htmlFor="distributor">
                  Select Distributor (to view retailers)
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
                  <Select
                    value={selectedDistributorId}
                    onValueChange={handleDistributorChange}
                  >
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

              {/* Retailer Selection */}
              {selectedDistributorId && (
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
                    <Select
                      value={selectedRetailerId}
                      onValueChange={handleRetailerSelection}
                    >
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

              {/* Retailer Details Display */}
              {retailerDetails && (
                <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg space-y-3">
                  <h3 className="font-semibold text-sm text-primary mb-2">
                    Retailer Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-medium break-words">
                        {retailerDetails.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p className="font-medium">{retailerDetails.phone}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">User ID:</span>
                      <p className="font-medium break-all">
                        {retailerDetails.userId}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Current Balance:</span>
                      <p className="font-medium text-green-600">
                        ₹{retailerDetails.currentBalance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="tel"
                  inputMode="decimal"
                  placeholder="Enter amount to transfer"
                  value={amount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d.]/g, "");
                    if (value.split(".").length <= 2) {
                      setAmount(value);
                    }
                  }}
                  disabled={!retailerDetails}
                  required
                  min="1"
                  step="0.01"
                  style={{ fontSize: "16px" }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                  onClick={() => (window.location.href = "/master")}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  className="flex-1 gradient-primary hover:opacity-90"
                  disabled={loading || !retailerDetails || !amount}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Add Funds"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MdFundRetailer;
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, RotateCcw } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";

interface Retailer {
  user_unique_id: string;
  user_name: string;
  user_phone: string;
  user_wallet_balance: string;
}

interface UserDetails {
  name: string;
  phone: string;
  userId: string;
  currentBalance: number;
}

interface TokenData {
  data: {
    admin_id: string;
    distributor_id?: string;
    [key: string]: any;
  };
  exp: number;
}

export default function DistributorRevertRequest() {
  const [selectedRetailerId, setSelectedRetailerId] = useState("");
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [amount, setAmount] = useState("");
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoadingRetailers, setIsLoadingRetailers] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Decode token and verify Distributor role
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        console.error("No auth token found");
        toast.error("Authentication required. Please login.");
        window.location.href = "/login";
        return;
      }

      try {
        const decoded: TokenData = jwtDecode(token);
       
        if (!decoded?.exp || decoded.exp * 1000 < Date.now()) {
          console.error("Token expired");
          localStorage.removeItem("authToken");
          toast.error("Session expired. Please log in again.");
          window.location.href = "/login";
          return;
        }

        if (!decoded.data.distributor_id) {
          console.error("Not a distributor account");
          toast.error("Unauthorized access. Distributor only.");
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
  }, []);

  // Fetch wallet balance
  useEffect(() => {
    if (!tokenData) return;

    const fetchBalance = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      try {
        const endpoint = `${import.meta.env.VITE_API_BASE_URL}/distributor/wallet/get/balance/${tokenData.data.distributor_id}`;
        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        
        if (data.status === "success") {
          setWalletBalance(Number(data.data.balance) || 0);
        } else {
          console.error(" Failed to fetch balance:", data);
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };

    fetchBalance();
  }, [tokenData]);

  // Fetch retailers list
  useEffect(() => {
    if (!tokenData?.data?.distributor_id) return;

    const fetchRetailers = async () => {
      setIsLoadingRetailers(true);
      const token = localStorage.getItem("authToken");
      
      try {
        const endpoint = `${import.meta.env.VITE_API_BASE_URL}/admin/get/users/${tokenData.data.distributor_id}`;
        
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok && data.status === "success") {
          // Handle different response structures
          let retailersList: Retailer[] = [];
          
          if (Array.isArray(data.data)) {
            retailersList = data.data;
          } else if (data.data && Array.isArray(data.data.users)) {
            retailersList = data.data.users;
          } else if (data.data && typeof data.data === 'object') {
            // If data is a single object, wrap it in an array
            retailersList = [data.data];
          }

          setRetailers(retailersList);
          
          if (retailersList.length === 0) {
            toast.info("No retailers found under your account");
          }
        } else {
          console.error("Failed to fetch retailers:", data);
          toast.error(data.msg || data.message || "Failed to load retailers");
          setRetailers([]);
        }
      } catch (error) {
        console.error("Error fetching retailers:", error);
        toast.error("Failed to load retailers. Please try again.");
        setRetailers([]);
      } finally {
        setIsLoadingRetailers(false);
      }
    };

    fetchRetailers();
  }, [tokenData]);

  // Handle retailer selection
  const handleRetailerChange = (retailerId: string) => {
    setSelectedRetailerId(retailerId);
    
    const selectedRetailer = retailers.find(
      (r) => r.user_unique_id === retailerId
    );

    if (selectedRetailer) {
      const details: UserDetails = {
        name: selectedRetailer.user_name || "N/A",
        phone: selectedRetailer.user_phone || "N/A",
        userId: selectedRetailer.user_unique_id || "N/A",
        currentBalance: parseFloat(selectedRetailer.user_wallet_balance || "0"),
      };
      
      setUserDetails(details);
            toast.success(`Selected: ${details.name}`);
    } else {
      setUserDetails(null);
      console.error("Retailer not found in list");
    }
  };

  const handleRevert = async () => {
    
    if (!userDetails) {
      toast.error("Please select a retailer first");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const revertAmount = parseFloat(amount);
    if (revertAmount > userDetails.currentBalance) {
      console.error(" Insufficient balance:", {
        requested: revertAmount,
        available: userDetails.currentBalance,
      });
      toast.error(
        `Insufficient balance of Retailer for revert. Current balance: ₹${userDetails.currentBalance.toFixed(2)}`
      );
      return;
    }

    if (!tokenData) {
      toast.error("Authentication error. Please login again.");
      return;
    }

    setIsProcessing(true);
    try {
      const endpoint = `${import.meta.env.VITE_API_BASE_URL}/distributor/refund/retailer`;
      const token = localStorage.getItem("authToken");

      const payload = {
        phone_number: userDetails.phone,
        amount: amount,
        distributor_id: tokenData.data.distributor_id,
      };


      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && (data.status === "success" || data.success)) {
        toast.success(data.msg || "Revert processed successfully");
        
        // Reset form
        setAmount("");
        setUserDetails(null);
        setSelectedRetailerId("");
        
        // Refresh retailers list to get updated balances
        window.location.reload();
      } else {
        console.error("Revert failed:", data);
        toast.error(data.msg || data.message || "Failed to process revert");
      }
    } catch (error) {
      console.error("Error processing revert:", error);
      toast.error("Failed to process revert. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedRetailerId("");
    setAmount("");
    setUserDetails(null);
  };

  if (isCheckingAuth) {
    return (
      <DashboardLayout role="distributor" walletBalance={walletBalance}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="distributor" walletBalance={walletBalance}>
      <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Revert Request
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Process revert requests for Retailers
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Process Revert</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6">
            {/* Retailer Selection Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="retailer" className="text-sm font-medium">
                Select Retailer
              </Label>
              {isLoadingRetailers ? (
                <div className="flex items-center justify-center p-4 border rounded-md">
                  <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                  <span className="text-sm text-muted-foreground">
                    Loading retailers...
                  </span>
                </div>
              ) : retailers.length === 0 ? (
                <div className="p-4 border rounded-md text-center text-sm text-muted-foreground">
                  No retailers found under your account
                </div>
              ) : (
                <Select
                  value={selectedRetailerId}
                  onValueChange={handleRetailerChange}
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

            {/* User Details Display */}
            {userDetails && (
         <div className=" border border-gray-200 dark:border-gray-700 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-sm text-primary mb-2">
                  Retailer Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium break-words">{userDetails.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p className="font-medium">{userDetails.phone}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">User ID:</span>
                    <p className="font-medium break-all">{userDetails.userId}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current Balance:</span>
                    <p className="font-medium text-green-600">
                      ₹{userDetails.currentBalance.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Revert Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">
                Revert Amount
              </Label>
              <Input
                id="amount"
                type="tel"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d.]/g, "");
                  if (value.split(".").length <= 2) {
                    setAmount(value);
                  }
                }}
                placeholder="Enter amount to revert"
                style={{ fontSize: "16px" }}
                disabled={!userDetails}
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleRevert}
              disabled={
                isProcessing ||
                !userDetails ||
                !amount ||
                parseFloat(amount) <= 0
              }
              className="w-full gradient-primary text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing Revert...
                </>
              ) : (
                "Process Revert"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
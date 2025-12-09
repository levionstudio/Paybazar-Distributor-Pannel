import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Search, RotateCcw } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";

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
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Decode token and verify Distributor role
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("authToken");
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

        if (!decoded.data.distributor_id) {
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
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };

    fetchBalance();
  }, [tokenData]);

  const handleSearchUser = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setIsSearching(true);
    try {
      const endpoint = `${import.meta.env.VITE_API_BASE_URL}/distributor/get/user/phone/${phoneNumber}`;
      const token = localStorage.getItem("authToken");

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && (data.status === "success" || data.success)) {
        const userData = data.data;

        setUserDetails({
          name: userData.user_name || "N/A",
          phone: userData.user_phone || phoneNumber,
          userId: userData.user_unique_id || "N/A",
          currentBalance: parseFloat(userData.user_wallet_balance || "0"),
        });
        toast.success(data.msg || "User found successfully");
      } else {
        if (response.status === 404 || response.status === 500) {
          toast.error(`Retailer with phone number ${phoneNumber} not found or not registered`);
        } else {
          toast.error(data.msg || data.message || "User not found");
        }
        setUserDetails(null);
      }
    } catch (error) {
      console.error("Error searching user:", error);
      toast.error(`Retailer with phone number ${phoneNumber} not found or not registered`);
      setUserDetails(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRevert = async () => {
    if (!userDetails) {
      toast.error("Please search for a user first");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const revertAmount = parseFloat(amount);
    if (revertAmount > userDetails.currentBalance) {
      toast.error(`Insufficient balance of Retailer for revert. Current balance: ₹${userDetails.currentBalance.toFixed(2)}`);
      return;
    }

    if (!tokenData) {
      toast.error("Authentication error. Please login again.");
      return;
    }

    setIsProcessing(true);
    try {
      const endpoint = `${import.meta.env.VITE_API_BASE_URL}/distributor/user/wallet/refund`;
      const token = localStorage.getItem("authToken");

      const payload = {
        phone_number: phoneNumber,
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
        setPhoneNumber("");
      } else {
        toast.error(data.msg || data.message || "Failed to process revert");
      }
    } catch (error) {
      console.error("Error processing revert:", error);
      toast.error("Failed to process revert");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setPhoneNumber("");
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
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Revert Request</h1>
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
            {/* Phone Number Search */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm font-medium">
                Retailer Phone Number
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="phoneNumber"
                  type="tel"
                  inputMode="numeric"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                  style={{ fontSize: "16px" }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleSearchUser}
                  disabled={isSearching || phoneNumber.length !== 10}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search User
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* User Details Display */}
            {userDetails && (
              <div className="bg-secondary/50 p-4 rounded-lg space-y-3">
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
              disabled={isProcessing || !userDetails || !amount || parseFloat(amount) <= 0}
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

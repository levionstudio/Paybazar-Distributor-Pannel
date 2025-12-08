import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/DashboardLayout";

interface TokenData {
  data: {
    admin_id: string;
    distributor_id: string;
    distributor_unique_id: string;
    distributor_name: string;
  };
  exp: number;
}

const DistributorFundRetailer = () => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    phone_number: "",
    amount: "",
  });

  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showContent, setShowContent] = useState(false);

  // Decode token with distributor fields
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

        if (!decoded.data.distributor_id) {
          toast({
            title: "Invalid Token",
            description: "Distributor ID missing.",
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

  // Fade in content
  useEffect(() => {
    if (!isCheckingAuth) {
      setTimeout(() => setShowContent(true), 100);
    }
  }, [isCheckingAuth]);

  // Fetch wallet balance
  useEffect(() => {
    if (!tokenData) return;

    const fetchBalance = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      try {
        const res = await axios.get(
          `https://server.paybazaar.in/distributor/wallet/get/balance/${tokenData.data.distributor_id}`,
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

  // Handle input
  const handleChange = (e: any) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tokenData) return;

    const token = localStorage.getItem("authToken");

    const payload = {
      distributor_id: tokenData.data.distributor_id,
      phone_number: formData.phone_number,
      amount: formData.amount,
    };

    try {
      setLoading(true);
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/distributor/fund/retailer`,
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

      setFormData({ phone_number: "", amount: "" });

      setTimeout(() => (window.location.href = "/distributor"), 800);
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

  return (
    <DashboardLayout role="distributor" walletBalance={walletBalance}>
      <div className="flex flex-col max-w-2xl mx-auto w-full">
        <Card className="shadow-md border rounded-xl overflow-hidden">
          <CardHeader className="gradient-primary text-primary-foreground rounded-t-xl">
            <CardTitle className="text-2xl">Add Funds to Retailer</CardTitle>
            <CardDescription className="text-primary-foreground/80 mt-1">
              Transfer funds to a retailer's wallet using their phone number.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 bg-card min-h-[400px]">
            {isCheckingAuth ? (
              <p className="text-center text-lg">Loading...</p>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{
                  opacity: showContent ? 1 : 0,
                  transition: "opacity 0.5s ease",
                }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Retailer Phone Number</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    placeholder="Enter retailer's phone number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount to transfer"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    min="1"
                    step="0.01"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={loading}
                    onClick={() => (window.location.href = "/distributor")}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    className="flex-1 gradient-primary hover:opacity-90"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Add Funds"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DistributorFundRetailer;

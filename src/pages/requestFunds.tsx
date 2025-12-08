import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";

interface TokenData {
  data: {
    admin_id: string;
    master_distributor_id?: string;
    distributor_id?: string;
    master_distributor_unique_id: string;
    master_distributor_name: string;
  };
  exp: number;
}

const   RequestFunds = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    bank_name: "",
    request_date: "",
    utr_number: "",
    amount: "",
    remarks: "",
  });

  const [loading, setLoading] = useState(false);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);

  const redirectTo = useCallback(
    (path: string) => {
      navigate(path, { replace: true });
    },
    [navigate]
  );

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("authToken");
      const userRole = localStorage.getItem("userRole");

      if (!token || !userRole) {
        redirectTo("/login");
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
          redirectTo("/login");
          return;
        }

        setTokenData(decoded);
        setRole(userRole);
      } catch (err) {
        console.error("Token decode error:", err);
        localStorage.removeItem("authToken");
        redirectTo("/login");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [toast, redirectTo]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenData || !role) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      redirectTo("/login");
      return;
    }

    const requester_id =
      role === "master"
        ? tokenData.data.master_distributor_id
        : tokenData.data.distributor_id;

    const requester_type =
      role === "master" ? "MASTER_DISTRIBUTOR" : "DISTRIBUTOR";

    const apiEndpoint =
      role === "master"
        ? "/md/create/fund/request"
        : "/distributor/create/fund/request";

    const payload = {
      admin_id: tokenData.data.admin_id,
      requester_id,
      requester_type,
      requester_unique_id: tokenData.data.master_distributor_unique_id,
      requester_name: tokenData.data.master_distributor_name,
      ...formData,
      request_status: "pending",
    };

    try {
      setLoading(true);
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}${apiEndpoint}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast({
        title: "Fund Request Submitted",
        description: data.message || "Request submitted successfully.",
      });

      setTimeout(
        () => redirectTo(role === "master" ? "/master" : "/distributor"),
        800
      );
    } catch (err: any) {
      console.error("Fund request error:", err);
      toast({
        title: "Request Failed",
        description:
          err.response?.data?.message ||
          "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch wallet balance
  useEffect(() => {
    const fetchWalletBalance = async () => {
      const masterDistributorId = tokenData?.data?.master_distributor_id;
      const token = localStorage.getItem("authToken");

      if (!masterDistributorId || !token) {
        setWalletError("Invalid master distributor ID or token");
        setWalletLoading(false);
        return;
      }

      setWalletLoading(true);

      try {
        const res = await axios.get(
          `https://server.paybazaar.in/md/wallet/get/balance/${masterDistributorId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.data.status === "success" && res.data.data?.balance !== undefined) {
          setWalletBalance(Number(res.data.data.balance));
          setWalletError(null);
        } else {
          setWalletBalance(0);
          setWalletError("Failed to fetch wallet balance");
        }
      } catch (err) {
        console.error("Wallet fetch error:", err);
        setWalletBalance(0);
        setWalletError("Error fetching wallet balance");
      } finally {
        setWalletLoading(false);
      }
    };

    if (tokenData) {
      fetchWalletBalance();
    }
  }, [tokenData]);

  // Helper function to get the appropriate input type
  const getInputType = (key: string) => {
    if (key === "amount") return "number";
    if (key === "request_date") return "date";
    return "text";
  };

  // Don't render anything until authentication check finishes
  if (isCheckingAuth) return null;

  return (
    <DashboardLayout role="master" walletBalance={walletBalance}>
      <div className="flex flex-col max-w-2xl mx-auto w-full">
        <Card className="shadow-md border border-border rounded-xl overflow-hidden">
          <CardHeader className="gradient-primary text-primary-foreground rounded-t-xl">
            <CardTitle className="text-2xl">Fund Request Form</CardTitle>
            <CardDescription className="text-primary-foreground/80 mt-1">
              Fill in the details to request funds.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 bg-card">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-5">
                {Object.entries(formData).map(([key, value]) =>
                  key !== "remarks" ? (
                    <div className="space-y-2" key={key}>
                      <Label htmlFor={key} className="font-medium">
                        {key.replace(/_/g, " ").toUpperCase()}
                      </Label>
                      <Input
                        id={key}
                        type={getInputType(key)}
                        value={value}
                        onChange={handleChange}
                        className="h-11"
                        required
                      />
                    </div>
                  ) : null
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks" className="font-medium">
                  Remarks
                </Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  className="h-32"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                  onClick={() =>
                    navigate(role === "master" ? "/master" : "/distributor")
                  }
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  className="flex-1 gradient-primary hover:opacity-90"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RequestFunds;
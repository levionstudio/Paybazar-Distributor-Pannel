// RequestFunds.tsx
"use client";

import { useState, useEffect } from "react";
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
import { DashboardLayout } from "@/components/DashboardLayout";

interface TokenData {
  data: {
    admin_id: string;
    master_distributor_id: string;
    master_distributor_unique_id: string;
    master_distributor_name: string;
  };
  exp: number;
}

const RequestFunds = () => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    amount: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    bank_branch: "",
    utr_number: "",
    remarks: "",
  });

  const [loading, setLoading] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showContent, setShowContent] = useState(false);

  // AUTH CHECK
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("authToken");
      const userRoleRaw = localStorage.getItem("userRole");

      if (!token || !userRoleRaw) {
        toast({ title: "Login required", variant: "destructive" });
        window.location.href = "/login";
        return;
      }

      const userRole = userRoleRaw.toLowerCase();

      try {
        const decoded: TokenData = jwtDecode(token);

        if (!decoded.exp || decoded.exp * 1000 < Date.now()) {
          toast({ title: "Session expired", variant: "destructive" });
          localStorage.clear();
          window.location.href = "/login";
          return;
        }

        setTokenData(decoded);
        setRole(userRole);
      } catch (error) {
        toast({ title: "Invalid token", variant: "destructive" });
        localStorage.clear();
        window.location.href = "/login";
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [toast]);

  useEffect(() => {
    if (!isCheckingAuth) {
      setShowContent(true);
    }
  }, [isCheckingAuth]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tokenData) {
      toast({ title: "Missing token data", variant: "destructive" });
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      toast({ title: "Missing token", variant: "destructive" });
      return;
    }

    const payload = {
      admin_id: tokenData.data.admin_id,
      requester_id: tokenData.data.master_distributor_id,
      requester_unique_id: tokenData.data.master_distributor_unique_id,
      requester_name: tokenData.data.master_distributor_name,
      requster_type: "MASTER_DISTRIBUTOR",
      amount: formData.amount,
      bank_name: formData.bank_name,
      account_number: formData.account_number,
      ifsc_code: formData.ifsc_code,
      bank_branch: formData.bank_branch,
      utr_number: formData.utr_number,
      remarks: formData.remarks,
      request_status: "pending",
    };

    try {
      setLoading(true);

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/md/create/fund/request`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast({ title: "Success", description: data.message });
      window.location.href = "/master";
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Request Failed",
        description: error.response?.data?.message || "Error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role={role || "master"} walletBalance={walletBalance}>
      <div className="flex flex-col max-w-2xl mx-auto w-full">
        <Card className="shadow-md border rounded-xl overflow-hidden">
          <CardHeader className="bg-primary text-white">
            <CardTitle className="text-2xl">Fund Request</CardTitle>
            <CardDescription className="text-white/80 mt-1">
              Submit a master distributor fund request
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 bg-white">
            {isCheckingAuth ? (
              <div>Loading...</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {Object.entries(formData).map(([key, value]) =>
                    key !== "remarks" ? (
                      <div key={key}>
                        <Label htmlFor={key}>{key.replace(/_/g, " ")}</Label>
                        <Input
                          id={key}
                          value={value}
                          type={key === "amount" ? "number" : "text"}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    ) : null
                  )}
                </div>

                <div>
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    required
                    className="h-32"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => (window.location.href = "/master")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Submit"}
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

export default RequestFunds;
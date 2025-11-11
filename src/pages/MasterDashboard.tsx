import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import CreateDistributorModal from "@/components/CreateDistributorModal";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Distributor {
  distributor_unique_id: string;
  distributor_name: string;
  distributor_email: string;
  distributor_phone: string;
  distributor_wallet_balance: string;
}

interface DecodedToken {
  data: {
    master_distributor_id: string;
    master_distributor_unique_id: string;
    master_distributor_name: string;
    admin_id: string;
  };
  exp: number;
}

const MasterDashboard = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);

  const token = localStorage.getItem("authToken");

  let masterDistributorId = "";

  if (token) {
    try {
      const decoded: DecodedToken = jwtDecode(token);
      masterDistributorId = decoded?.data?.master_distributor_id;
    } catch (err) {
      console.error("Token decode error:", err);
    }
  }

  // Fetch distributors
  useEffect(() => {
    const fetchDistributors = async () => {
      if (!masterDistributorId) {
        setError("Invalid master distributor ID");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          `http://64.227.165.232:8080/md/get/distributor/${masterDistributorId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // ✅ Safe handling for null, undefined, wrong data type
        let data = res.data?.data;

        if (res.data.status === "success") {
          if (Array.isArray(data)) {
            setDistributors(data);
          } else {
            // ✅ When data = null or something else
            setDistributors([]);
          }
          setError("");
        } else {
          setError("Failed to load distributors");
          setDistributors([]);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Something went wrong");
        setDistributors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDistributors();
  }, [masterDistributorId, token]);

  // Fetch wallet balance
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!masterDistributorId) {
        setWalletError("Invalid master distributor ID");
        setWalletLoading(false);
        return;
      }

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

    fetchWalletBalance();
  }, [masterDistributorId, token]);

  const stats = [
    {
      title: "Total Distributors",
      value: distributors.length,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Active Distributors",
      value: distributors.length,
      icon: Activity,
      color: "text-success",
    },
    {
      title: "Total Distribution",
      value: `₹${distributors
        .reduce(
          (sum, d) => sum + parseFloat(d.distributor_wallet_balance || "0"),
          0
        )
        .toLocaleString("en-IN")}`,
      icon: TrendingUp,
      color: "text-secondary",
    },
  ];

  return (
    <DashboardLayout role="master" walletBalance={walletBalance}>
      <div className="space-y-6 px-4 sm:px-6 md:px-8 lg:px-12 py-6 max-w-full mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground truncate">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-heading font-bold truncate">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Responsive Table/Card */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-heading truncate">
              Your Distributors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-6">Loading...</p>
            ) : error ? (
              <p className="text-center text-red-500 py-6">{error}</p>
            ) : distributors.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground">
                No distributors found.
              </p>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-center font-semibold">
                          ID
                        </TableHead>
                        <TableHead className="text-center font-semibold">
                          Name
                        </TableHead>
                        <TableHead className="text-center font-semibold">
                          Email
                        </TableHead>
                        <TableHead className="text-center font-semibold">
                          Phone
                        </TableHead>
                        <TableHead className="text-center font-semibold">
                          Balance
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {distributors.map((dist) => (
                        <TableRow key={dist.distributor_unique_id}>
                          <TableCell className="text-center font-medium">
                            {dist.distributor_unique_id}
                          </TableCell>
                          <TableCell className="text-center">
                            {dist.distributor_name}
                          </TableCell>
                          <TableCell className="text-center">
                            {dist.distributor_email}
                          </TableCell>
                          <TableCell className="text-center">
                            {dist.distributor_phone}
                          </TableCell>
                          <TableCell className="text-center font-semibold text-primary">
                            ₹{parseFloat(dist.distributor_wallet_balance || "0").toLocaleString("en-IN")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-4">
                  {distributors.map((dist) => (
                    <div
                      key={dist.distributor_unique_id}
                      className="border border-border rounded-lg p-4 shadow-sm bg-card"
                    >
                      <p>
                        <strong>ID:</strong> {dist.distributor_unique_id}
                      </p>
                      <p>
                        <strong>Name:</strong> {dist.distributor_name}
                      </p>
                      <p>
                        <strong>Email:</strong> {dist.distributor_email}
                      </p>
                      <p>
                        <strong>Phone:</strong> {dist.distributor_phone}
                      </p>
                      <p className="text-primary font-semibold">
                        <strong>Balance:</strong>{" "}
                        ₹{parseFloat(dist.distributor_wallet_balance || "0").toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <CreateDistributorModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSuccess={() => {}}
        />
      </div>
    </DashboardLayout>
  );
};

export default MasterDashboard;

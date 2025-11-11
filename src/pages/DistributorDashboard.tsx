import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
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
import { Store, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Retailer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
  userwalletbalance: number;
  createdAt: string;
}

interface DecodedToken {
  data: {
    distributor_id?: string;
  };
  exp: number;
}

const DistributorDashboard = () => {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [walletBalance, setWalletBalance] = useState(0);
  const [distributorId, setDistributorId] = useState("");

  // Decode token
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication token not found.");
      setLoading(false);
      return;
    }

    try {
      const decoded: DecodedToken = jwtDecode(token);
      const id = decoded?.data?.distributor_id;

      if (!id) {
        setError("Distributor ID missing in token.");
        setLoading(false);
        return;
      }

      setDistributorId(id);
    } catch {
      setError("Failed to decode token.");
      setLoading(false);
    }
  }, []);

  // Fetch retailers + wallet
  useEffect(() => {
    if (!distributorId) return;

    const fetchData = async () => {
      setLoading(true);

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Authentication token missing.");
        setLoading(false);
        return;
      }

      try {
        // Retailer fetch
        const res = await axios.get(
          `http://64.227.165.232:8080/distributor/get/user/${distributorId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let data = res.data?.data;

        if (res.data.status === "success") {
          if (Array.isArray(data)) {
            const mapped: Retailer[] = data.map((r: any) => ({
              id: r.user_unique_id ?? "",
              name: r.user_name ?? "N/A",
              email: r.user_email ?? "N/A",
              phone: r.user_phone ?? "N/A",
              status: "active",
              userwalletbalance: parseFloat(r.user_wallet_balance) || 0,
              createdAt: new Date().toISOString(),
            }));
            setRetailers(mapped);
            setError(null);
          } else {
            // ✅ Null or invalid type
            setRetailers([]);
            setError(null);
          }
        } else {
          setRetailers([]);
          setError(res.data.msg || "Failed to load retailers.");
        }

        // Wallet balance fetch
        const walletRes = await axios.get(
          `http://64.227.165.232:8080/distributor/wallet/get/balance/${distributorId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const wData = walletRes.data?.data?.balance;

        if (walletRes.data.status === "success" && wData !== undefined) {
          setWalletBalance(Number(wData));
        } else {
          setWalletBalance(0);
        }
      } catch (err: any) {
        console.error(err);
        setError("Something went wrong fetching data.");
        setRetailers([]);
        setWalletBalance(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [distributorId]);

  // Stats
  const stats = [
    {
      title: "Total Retailers",
      value: retailers.length,
      icon: Store,
    },
    {
      title: "Active Retailers",
      value: retailers.filter((r) => r.status === "active").length,
      icon: Activity,
    },
    {
      title: "Total Balance",
      value: `₹${retailers
        .reduce((sum, r) => sum + r.userwalletbalance, 0)
        .toLocaleString("en-IN")}`,
      icon: TrendingUp,
    },
  ];

  return (
    <DashboardLayout role="distributor" walletBalance={walletBalance}>
      <div className="space-y-6 px-4 sm:px-6 md:px-8 lg:px-12 py-6">

        {loading && <p className="text-center py-6">Loading...</p>}

        {error && !loading && (
          <p className="text-center text-red-600 py-6">{error}</p>
        )}

        {!loading && !error && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              {stats.map((stat, i) => (
                <Card key={i} className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground truncate">
                      {stat.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Retailer table */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">
                  Your Retailers
                </CardTitle>
              </CardHeader>

              <CardContent>

                {retailers.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground">
                    No retailers found.
                  </p>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-center">Name</TableHead>
                            <TableHead className="text-center">Email</TableHead>
                            <TableHead className="text-center">Phone</TableHead>
                            <TableHead className="text-center">Balance</TableHead>
                            <TableHead className="text-center">Joined</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {retailers.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="text-center">{r.name}</TableCell>
                              <TableCell className="text-center">{r.email}</TableCell>
                              <TableCell className="text-center">{r.phone}</TableCell>
                              <TableCell className="text-center">
                                ₹{r.userwalletbalance.toLocaleString("en-IN")}
                              </TableCell>
                              <TableCell className="text-center">
                                {new Date(r.createdAt).toLocaleDateString("en-IN")}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden space-y-4">
                      {retailers.map((r) => (
                        <div key={r.id} className="border p-4 rounded-lg shadow-md">
                          <p><strong>Name:</strong> {r.name}</p>
                          <p><strong>Email:</strong> {r.email}</p>
                          <p><strong>Phone:</strong> {r.phone}</p>
                          <p><strong>Balance:</strong> ₹{r.userwalletbalance}</p>
                          <p><strong>Joined:</strong> {new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DistributorDashboard;

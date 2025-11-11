import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  Wallet,
  ShieldCheck,
  Eye,
  EyeOff,
  Clock,
  Headphones,
  Building2,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import paybazarLogo from "@/assets/paybazar-logo.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["master", "distributor"], {
    required_error: "Please select a role",
  }),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://64.227.165.232:8080";

      // Endpoints (adjust distributorEndpoint if your API uses a different path)
      const masterEndpoint = `${baseUrl}/md/login`;
      const distributorEndpoint = `${baseUrl}/distributor/login`; // change to `${baseUrl}/distributor/login` if needed

      const endpoint =
        data.role === "master" ? masterEndpoint : distributorEndpoint;

      const payload =
        data.role === "master"
          ? {
              master_distributor_email: data.email,
              master_distributor_password: data.password,
            }
          : {
              // if your distributor API expects same keys as master, keep these;
              // otherwise update to distributor_email / distributor_password
              distributor_email: data.email,
              distributor_password: data.password,
            };

      const response = await axios.post(endpoint, payload);
      const resData = response.data;

      if (resData?.status === "success" && resData?.data?.token) {
        // save token & user info for later API calls
        localStorage.setItem("authToken", resData.data.token);
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("userEmail", data.email);

        toast({
          title: "Login successful",
          description: "Welcome back!",
        });

        // redirect based on role (change routes to your app routes)
        navigate(data.role === "master" ? "/master" : "/distributor");
      } else {
        throw new Error(resData?.message || "Invalid credentials");
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Login failed. Please try again.";
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden grid grid-cols-1 md:grid-cols-2">
      {/* LEFT SIDE */}
     <div className="hidden md:flex flex-col justify-center items-center bg-[#0d3154] px-12 py-16 text-white gap-8">
        <div className="flex flex-col items-center max-w-lg text-center space-y-6">
          <img
            src="/login-page.png"
            alt="PayBazaar Illustration"
            className="w-56 h-52 object-contain drop-shadow-lg"
          />
          <h2 className="text-3xl font-extrabold tracking-wide leading-tight">
            PayBazaar: Secure & Reliable Payments
          </h2>
          <p className="text-slate-200 text-sm leading-relaxed max-w-md">
            PAYBAZAAR empowers inclusive financial growth through technology,
            reaching every corner of the nation.
          </p>

          <ul className="flex justify-center gap-10 text-xs text-slate-200 mt-4">
            <li className="flex items-center gap-2 font-semibold">
              <Clock className="w-5 h-5 text-white" /> 1-hour settlements
            </li>
            <li className="flex items-center gap-2 font-semibold">
              <Headphones className="w-5 h-5 text-white" /> 24/7 Support
            </li>
          </ul>

          <Card className="w-full shadow-xl border-0 rounded-2xl bg-white backdrop-blur-lg border border-white/20">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#0d3154] flex items-center gap-3">
                <Building2 className="w-6 h-6 text-[#0d3154]" /> Company Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-700">
              <p className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#0d3154]" /> info@paybazaar.in
              </p>
              <p className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#0d3154]" /> +91 9319187762
              </p>
              <p className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#0d3154]  " /> Paybazaar
                Technologies Pvt Ltd, Office No-304, Plot 2, Delhi
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* RIGHT SIDE */}
      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6 lg:hidden">
            <img
              src={paybazarLogo}
              alt="PayBazaar"
              className="h-8 mx-auto mb-3"
            />
          </div>

          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-foreground">
              Welcome to PayBazaar!
            </h2>
            <p className="text-sm text-muted-foreground">
              Sign in to manage your payments
            </p>
          </div>

          <div className="bg-card rounded-2xl shadow-xl border p-6">
            <h3 className="text-xl font-semibold mb-4">Sign In</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register("email")}
                  className="h-10"
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...register("password")}
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Select Role</Label>
                <RadioGroup
                  onValueChange={(value) =>
                    setValue("role", value as "master" | "distributor")
                  }
                >
                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      selectedRole === "master"
                        ? "border-primary bg-accent/30"
                        : "border-border"
                    }`}
                    onClick={() => setValue("role", "master")}
                  >
                    <RadioGroupItem value="master" id="master" />
                    <Label
                      htmlFor="master"
                      className="flex items-center gap-2 cursor-pointer flex-1 text-sm"
                    >
                      <ShieldCheck className="w-4 h-4 text-primary" /> Master
                      Distributor
                    </Label>
                  </div>

                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      selectedRole === "distributor"
                        ? "border-primary bg-accent/30"
                        : "border-border"
                    }`}
                    onClick={() => setValue("role", "distributor")}
                  >
                    <RadioGroupItem value="distributor" id="distributor" />
                    <Label
                      htmlFor="distributor"
                      className="flex items-center gap-2 cursor-pointer flex-1 text-sm"
                    >
                      <Wallet className="w-4 h-4 text-secondary" /> Distributor
                    </Label>
                  </div>
                </RadioGroup>
                {errors.role && (
                  <p className="text-xs text-destructive">
                    {errors.role.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2">
                  <input type="checkbox" /> Remember me
                </label>
                <a href="#" className="text-primary hover:underline">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                className="w-full h-10 font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

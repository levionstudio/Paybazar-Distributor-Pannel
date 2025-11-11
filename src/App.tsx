import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import MasterDashboard from "./pages/MasterDashboard";
import DistributorDashboard from "./pages/DistributorDashboard";
import RequestFund from "./pages/RequestFundDistributor";
import NotFound from "./pages/NotFound";
import CreateRetailerPage from "./pages/CreateRetailer";
import CreateDistributorPage from "./pages/CreateDistributor";
import RequestFunds from "./pages/requestFunds";
import RequestFundsDistributor from "./pages/RequestFundDistributor";
import DistributorTransactions from "./pages/Transaction";
import MdTransactions from "./pages/Transactionmd";
import MdFundRequests from "./pages/RequestedFundMd";
import DistributorFundRequests from "./pages/RequestedFundDist";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/master" element={<MasterDashboard />} />
          <Route path="/master/*" element={<MasterDashboard />} />
          <Route path="/distributor" element={<DistributorDashboard />} />
          <Route path="/distributor/create" element={<CreateRetailerPage />} />
          <Route path="/master/create" element={<CreateDistributorPage />} />
          <Route path="/distributor/*" element={<DistributorDashboard />} />
          <Route path="/request-funds" element={<RequestFunds />} />
          <Route path="/request-funds/distributor" element={<RequestFundsDistributor />} />
          <Route path="/transactions/distributor" element={<DistributorTransactions />} />
          <Route path="/transactions/md" element={<MdTransactions />} />
           <Route path="/md/requestfund" element={<MdFundRequests />} />
           <Route path="/distributor/requestedfund" element={<DistributorFundRequests />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

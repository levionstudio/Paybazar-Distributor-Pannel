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
import DistributorFundRequests from "./pages/RequestedFundDist";
import MdFundRequests from "./pages/requestFunds";
import MasterDistributorFundRequests from "./pages/MdFundRequets";
import MdFundRetailer from "./pages/MdFundRetailer";
import MdFundDistributor from "./pages/MdFundDistributor";
import DistributorFundRetailer from "./pages/DistributorFundRetailer";
import RevertRequest from "./pages/RevertRequest";
import RevertHistory from "./pages/RevertHistory";

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
           <Route path="/md/requestfund" element={<MasterDistributorFundRequests />} />
           <Route path="/distributor/requestedfund" element={<DistributorFundRequests />} />
          <Route path="/md/fund/retailer" element={<MdFundRetailer />} />
          <Route path="/md/fund/distributor" element={<MdFundDistributor />} />
          <Route path="/distributor/fund/retailer" element={<DistributorFundRetailer />} />
          <Route path="/md/revert/request" element={<RevertRequest />} />
          <Route path="/distributor/revert/request" element={<RevertRequest />} />
          <Route path="/md/revert/history" element={<RevertHistory />} />
          <Route path="/distributor/revert/history" element={<RevertHistory />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

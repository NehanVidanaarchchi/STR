"use client";

import { useState } from "react";
import CompanyHeader from "./CompanyHeader";
import CompanyTabs from "./CompanyTabs";
import { CompanyDashboardData } from "../components/types";

interface CompanyDetailsProps {
  companyData: CompanyDashboardData;
  onClose?: () => void;
}

export default function CompanyDetails({ companyData, onClose }: CompanyDetailsProps) {
  const [isLoading] = useState(false);
  
  // Transform the data to match what PublicProfileTabs expects
  const transformedData = {
    ...companyData.company,
    products: companyData.products || [],
    integrations: (companyData.integrations || []).map((integration: any) => ({
      ...integration,
      company_name: integration.companyName || 'Unknown Company'
    })),
    references: companyData.references || [],
    stats: companyData.stats || {}
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header Section */}
      <CompanyHeader 
        company={transformedData} 
        isLoading={isLoading} 
        onClose={onClose}
      />
      
      {/* Tabs Section */}
      <CompanyTabs company={transformedData} isLoading={isLoading} />
    </div>
  );
}
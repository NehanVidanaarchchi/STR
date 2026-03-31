"use client";

import {
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Clock,
  Rocket,
  Building,
  Package,
  Zap,
  CreditCard,
  ChevronRight,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface OnboardingSteps {
  company_profile_completed: boolean;
  product_info_completed: boolean;
  integrations_completed: boolean;
  commercial_info_completed: boolean;
}

interface StepConfig {
  number: number;
  key: keyof OnboardingSteps;
  title: string;
  description: string;
  time: string;
  icon: any;
  iconBackground: string;
  path: string;
}

interface UserSession {
  id: string;
  email: string;
  name: string;
  role: string;
  type: "provider" | "team_member";
  provider_id?: string;
}

interface DashboardClientProps {
  user: UserSession;
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [steps, setSteps] = useState<OnboardingSteps>({
    company_profile_completed: false,
    product_info_completed: false,
    integrations_completed: false,
    commercial_info_completed: false
  });

  const stepConfigs: StepConfig[] = [
    {
      number: 1,
      key: 'company_profile_completed',
      title: "Complete Company Profile",
      description: "Add your logo, description, and company details",
      time: "5 minutes",
      icon: Building,
      iconBackground: "bg-gradient-to-br from-[#74D4FF] to-[#00BCFF]",
      path: "/dashboard/company-profile"
    },
    {
      number: 2,
      key: 'product_info_completed',
      title: "Update Product Info",
      description: "Add product information and core features",
      time: "10 - 30 minutes",
      icon: Package,
      iconBackground: "bg-gradient-to-br from-[#DAB2FF] to-[#C27AFF]",
      path: "/dashboard/products"
    },
    {
      number: 3,
      key: 'integrations_completed',
      title: "Add Integrations",
      description: "Connect with partners to boost discoverability",
      time: "8 minutes",
      icon: Zap,
      iconBackground: "bg-gradient-to-br from-[#FFA1AD] to-[#FF637E]",
      path: "/dashboard/integrations"
    },
    {
      number: 4,
      key: 'commercial_info_completed',
      title: "Set Visibility",
      description: "Explore the options to increase your reach",
      time: "7 minutes",
      icon: CreditCard,
      iconBackground: "bg-gradient-to-br from-[#FFD230] to-[#FFB900]",
      path: "/dashboard/commercial"
    }
  ];

  useEffect(() => {
    fetchOnboardingSteps();
  }, []);

  const fetchOnboardingSteps = async () => {
    try {
      setLoading(true);
      
      // Get provider ID based on user type
      const providerId = user.type === 'provider' ? user.id : user.provider_id;
      
      if (!providerId) {
        console.error('No provider ID found');
        return;
      }

      console.log('Fetching onboarding steps for provider:', providerId);

      const response = await fetch(`/api/onboarding-steps?providerId=${providerId}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('Onboarding steps loaded:', data.steps);
        setSteps(data.steps);
      } else {
        // console.error('Failed to fetch onboarding steps:', data.error);
      }
    } catch (error) {
      console.error('Error fetching onboarding steps:', error);
    } finally {
      setLoading(false);
    }
  };

  const markStepAsComplete = async (stepKey: keyof OnboardingSteps) => {
    try {
      setUpdating(stepKey);

      const providerId = user.type === 'provider' ? user.id : user.provider_id;

      if (!providerId) {
        console.error('No provider ID found');
        return;
      }

      const response = await fetch('/api/onboarding-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          stepKey,
          completed: true
        })
      });

      const data = await response.json();

      if (!data.success) {
        console.error('Error updating step:', data.error);
        return;
      }

      // Update local state
      setSteps(prev => ({
        ...prev,
        [stepKey]: true
      }));

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setUpdating(null);
    }
  };

  // Calculate completed percentage
  const completedCount = Object.values(steps).filter(Boolean).length;
  const totalSteps = stepConfigs.length;
  const progressPercentage = (completedCount / totalSteps) * 100;

  const handleMarkComplete = async (stepKey: keyof OnboardingSteps, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation();
    await markStepAsComplete(stepKey);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#2B6CB0] animate-spin mx-auto mb-4" />
          <p className="text-[#64748B]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Onboarding Steps Section */}
      <div className="rounded-xl shadow-md relative overflow-hidden">
        {/* Gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #2B6CB0 5%, #FFFFFF 60%, #00A2AE 2%)'
          }}
        />

        {/* Content container with subtle white overlay */}
        <div className="relative">
          {/* Main content area with glass effect */}
          <div className="bg-white/95 backdrop-blur-sm p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-r from-[#2B6CB0] to-[#00A2AE] flex items-center justify-center shadow-md">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-[22px] leading-[28px] font-medium text-[#0F172A]">Welcome to Your Provider Portal</h2>
                <p className="text-[14px] leading-[20px] text-[#64748B] mt-1">
                  Your profile is visible by default. Finish these steps ensures your details are correct and your reach the best possible visibility on the platform.
                </p>
              </div>
            </div>

            {/* Stepper with connecting lines */}
            <div className="mb-8">
              {/* Desktop Stepper */}
              <div className="hidden lg:block">
                <div className="relative">
                  {/* Connecting line container - spans from first to last icon */}
                  <div className="absolute left-[12.5%] right-[12.5%] top-8 h-2">
                    {/* Full background line */}
                    <div className="absolute left-0 right-0 h-full bg-gray-200 rounded-full"></div>
                    
                    {/* Progress line - dynamically calculated */}
                    <div 
                      className="absolute h-full bg-gradient-to-r from-[#2B6CB0] to-[#00A2AE] rounded-full transition-all duration-500"
                      style={{ 
                        width: `${progressPercentage}%`
                      }}
                    ></div>
                  </div>

                  <div className="relative z-10 flex justify-between">
                    {stepConfigs.map((stepConfig) => {
                      const completed = steps[stepConfig.key];
                      
                      return (
                        <Link
                          key={stepConfig.number}
                          href={stepConfig.path}
                          className="flex flex-col items-center w-[25%] cursor-pointer group"
                        >
                          {/* Step icon with gradient background and glow effect */}
                          <div className="mb-5 relative">
                            {/* Outer glow for completed steps */}
                            {completed && (
                              <div className="absolute -inset-2 bg-gradient-to-r from-[#2B6CB0] to-[#00A2AE] rounded-full opacity-20 blur group-hover:opacity-30 transition-opacity"></div>
                            )}

                            {/* Icon container */}
                            <div className={`
                              w-16 h-16 rounded-full flex items-center justify-center relative
                              ${stepConfig.iconBackground}
                              shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl
                              ${!completed && 'border-2 border-white/50'}
                            `}>
                              {completed ? (
                                <CheckCircle className="w-8 h-8 text-white" />
                              ) : (
                                <stepConfig.icon className="w-8 h-8 text-white" />
                              )}

                              {/* Step number badge */}
                              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center shadow-md">
                                <span className="text-xs font-bold text-gray-700">{stepConfig.number}</span>
                              </div>
                            </div>
                          </div>

                          {/* Step content */}
                          <div className="text-center px-2">
                            {/* Step status */}
                            <div className="mb-3">
                              {completed ? (
                                <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Completed</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                  <Clock className="w-4 h-4" />
                                  <span>Pending</span>
                                </div>
                              )}
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#2563EB] transition-colors">
                              {stepConfig.title}
                            </h3>

                            {/* Description */}
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {stepConfig.description}
                            </p>

                            {/* Time estimate */}
                            <div className="flex items-center justify-center text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                              <Clock className="w-4 h-4 mr-2 text-gray-400" />
                              <span>~{stepConfig.time}</span>
                            </div>

                            {/* Action button */}
                            {!completed && (
                              <div className="mt-4" onClick={(e) => handleMarkComplete(stepConfig.key, e)}>
                                <button
                                  disabled={updating === stepConfig.key}
                                  className="inline-flex items-center gap-2 text-[12px] text-white bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] px-2 py-1 rounded-lg transition-all duration-200 shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {updating === stepConfig.key ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      <span>Updating...</span>
                                    </>
                                  ) : (
                                    <span>Mark as complete</span>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Mobile Stepper */}
              <div className="lg:hidden">
                <div className="relative mb-10">
                  {/* Progress line - from first to last icon */}
                  <div className="absolute left-[12.5%] right-[12.5%] top-7 h-1.5">
                    <div className="absolute left-0 right-0 h-full bg-gray-100 rounded-full"></div>
                    <div 
                      className="absolute h-full bg-gradient-to-r from-[#2B6CB0] to-[#00A2AE] rounded-full transition-all duration-500" 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>

                  {/* Step icons */}
                  <div className="flex justify-between">
                    {stepConfigs.map((stepConfig) => {
                      const completed = steps[stepConfig.key];
                      
                      return (
                        <div key={stepConfig.number} className="relative w-[25%] flex justify-center">
                          <div className={`
                            w-12 h-12 rounded-full flex items-center justify-center shadow-md
                            ${stepConfig.iconBackground}
                          `}>
                            {completed ? (
                              <CheckCircle className="w-6 h-6 text-white" />
                            ) : (
                              <stepConfig.icon className="w-6 h-6 text-white" />
                            )}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                              <span className="text-xs font-bold text-gray-700">{stepConfig.number}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile step details */}
                <div className="space-y-4">
                  {stepConfigs.map((stepConfig) => {
                    const completed = steps[stepConfig.key];
                    
                    return (
                      <Link
                        key={stepConfig.number}
                        href={stepConfig.path}
                        className="block p-5 border border-gray-100 rounded-xl hover:shadow-lg transition-all duration-200 cursor-pointer bg-white/90 backdrop-blur-sm"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`
                            flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center shadow-md
                            ${stepConfig.iconBackground}
                          `}>
                            {completed ? (
                              <CheckCircle className="w-7 h-7 text-white" />
                            ) : (
                              <stepConfig.icon className="w-7 h-7 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <span className={`
                                text-sm font-medium px-3 py-1 rounded-full
                                ${completed ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}
                              `}>
                                Step {stepConfig.number}
                              </span>
                              {completed ? (
                                <div className="flex items-center gap-1 text-green-600 text-sm">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Completed</span>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => handleMarkComplete(stepConfig.key, e)}
                                  disabled={updating === stepConfig.key}
                                  className="text-sm text-white bg-[#3B82F6] hover:bg-[#2563EB] px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {updating === stepConfig.key ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    "Mark as complete"
                                  )}
                                </button>
                              )}
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 mb-2">
                              {stepConfig.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                              {stepConfig.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-sm text-gray-500">
                                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                <span>~{stepConfig.time}</span>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pro Tips Section */}
            <div className="relative overflow-hidden rounded-xl">
              {/* Background gradient for pro tips */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, #2B6CB0 0%, #00A2AE 100%)'
                }}
              />

              {/* Content with blur effect */}
              <div className="relative bg-white/10 backdrop-blur-sm p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Pro Tips for Maximum Visibility</h3>
                <ul className="space-y-4">
                  <li className="flex items-start group">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm leading-relaxed text-white/90 group-hover:text-white transition-colors">
                      Complete profiles get more views and lead inquiries
                    </span>
                  </li>
                  <li className="flex items-start group">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm leading-relaxed text-white/90 group-hover:text-white transition-colors">
                      Add your team members in the Settings tab to help you complete all info about your product
                    </span>
                  </li>
                  <li className="flex items-start group">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm leading-relaxed text-white/90 group-hover:text-white transition-colors">
                      List integrations to appear in partner ecosystem pages
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Analytics */}
      {/* <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[22px] leading-[28px] font-medium text-[#0F172A]">Performance Analytics</h2>
          <select className="text-[14px] leading-[20px] border border-[#E2E8F0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent">
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>Last year</option>
          </select>
        </div>

        <div className="h-64 bg-[#F8FAFC] rounded-lg flex items-center justify-center mb-6">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-[#94A3B8] mx-auto mb-2" />
            <p className="text-[#64748B]">Performance chart will appear here</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 mt-6 border-t border-[#E2E8F0]">
          <div>
            <p className="text-[13px] leading-[18px] text-[#64748B]">Click-through Rate</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[22px] leading-[28px] font-medium text-[#0F172A]">0</p>
              <span className="inline-flex items-center gap-1 text-[13px] text-green-600">
                <ArrowUpRight className="w-3 h-3" />
                +2.3%
              </span>
            </div>
          </div>
          <div>
            <p className="text-[13px] leading-[18px] text-[#64748B]">Lead Conversion</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[22px] leading-[28px] font-medium text-[#0F172A]">0</p>
              <span className="inline-flex items-center gap-1 text-[13px] text-green-600">
                <ArrowUpRight className="w-3 h-3" />
                +0.8%
              </span>
            </div>
          </div>
          <div>
            <p className="text-[13px] leading-[18px] text-[#64748B]">Avg. Session Duration</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[22px] leading-[28px] font-medium text-[#0F172A]">0</p>
              <span className="inline-flex items-center gap-1 text-[13px] text-red-600">
                <ArrowDownRight className="w-3 h-3" />
                -12s
              </span>
            </div>
          </div>
          <div>
            <p className="text-[13px] leading-[18px] text-[#64748B]">Bounce Rate</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[22px] leading-[28px] font-medium text-[#0F172A]">0</p>
              <span className="inline-flex items-center gap-1 text-[13px] text-green-600">
                <ArrowDownRight className="w-3 h-3" />
                -3.1%
              </span>
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
}
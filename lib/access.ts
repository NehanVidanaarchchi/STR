export type PlanId = "free" | "core" | "premium";

export function hasPaidAccess(planId: PlanId) {
  return planId === "core" || planId === "premium";
}

export function canAccessFeature(
  feature: { free: boolean; core: boolean; premium: boolean },
  provider: { plan_id: PlanId; plan_status: string }
) {
  const planId = provider.plan_id;

  // must be enabled for that plan
  const enabled =
    planId === "free" ? feature.free :
    planId === "core" ? feature.core :
    feature.premium;

  if (!enabled) return false;

  // if paid plan, must be active
  if (hasPaidAccess(planId)) {
    return provider.plan_status === "active";
  }

  return true;
}

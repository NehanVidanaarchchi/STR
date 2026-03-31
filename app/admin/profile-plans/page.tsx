"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle, ChevronDown, ChevronUp, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Swal from "sweetalert2";

type PlanType = "free" | "core" | "premium";

type Feature = {
  id: string;
  section: string | null;
  sort_order: number;
  product_feature: string;
  note_for_devs: string | null;
  definition?: string | null;
  special?: boolean | null;
  free: boolean;
  core: boolean;
  premium: boolean;
  free_label?: string | null;
  core_label?: string | null;
  premium_label?: string | null;
};

type CommercialPlan = {
  id: string;
  plan_key: PlanType;
  name: string;
  price: number;
  original_price: number | null;
  billing_period: string;
  badge_text: string | null;
  button_text: string | null;
  description: string | null;
  highlight: boolean;
  popular: boolean;
  launch_label: string | null;
  sort_order: number;
};

const planColumnOrder: PlanType[] = ["free", "core", "premium"];

export default function ProfilePlansAdminPage() {
  const supabase = createClient();

  const [expanded, setExpanded] = useState(true);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [planConfig, setPlanConfig] = useState<CommercialPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [savingFeatures, setSavingFeatures] = useState(false);
  const [savingPlans, setSavingPlans] = useState(false);
  const [addingFeature, setAddingFeature] = useState(false);
  const [lastSaved, setLastSaved] = useState("");
  const [deletingFeatureId, setDeletingFeatureId] = useState<string | null>(null);
  const dirtyIdsRef = useRef<Set<string>>(new Set());

  const [newFeature, setNewFeature] = useState({
    product_feature: "",
    section: "Product Feature",
    sort_order: 0,
    note_for_devs: "",
    definition: "",
    special: false,
    free: false,
    core: false,
    premium: false,
    free_label: "",
    core_label: "",
    premium_label: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [
        { data: featureData, error: featureError },
        { data: planData, error: planError },
      ] = await Promise.all([
        supabase
          .from("commercial_features")
          .select(`
            id,
            section,
            sort_order,
            product_feature,
            note_for_devs,
            definition,
            special,
            free,
            core,
            premium,
            free_label,
            core_label,
            premium_label
          `)
          .order("section", { ascending: true })
          .order("sort_order", { ascending: true }),

        supabase
          .from("commercial_plans")
          .select("*")
          .order("sort_order", { ascending: true }),
      ]);

      if (featureError) {
        console.error("Failed to fetch features:", featureError);
        setFeatures([]);
      } else {
        setFeatures((featureData ?? []) as Feature[]);
      }

      if (planError) {
        console.error("Failed to fetch plans:", planError);
        setPlanConfig([]);
      } else {
        setPlanConfig((planData ?? []) as CommercialPlan[]);
      }

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const selectedCount = useMemo(() => {
    const counts: Record<PlanType, number> = { free: 0, core: 0, premium: 0 };
    for (const f of features) {
      if (f.free) counts.free++;
      if (f.core) counts.core++;
      if (f.premium) counts.premium++;
    }
    return counts;
  }, [features]);

  const orderedPlans = useMemo(() => {
    return [...planConfig].sort((a, b) => a.sort_order - b.sort_order);
  }, [planConfig]);

  const updateFeatureField = <K extends keyof Feature>(
    id: string,
    field: K,
    value: Feature[K]
  ) => {
    dirtyIdsRef.current.add(id);

    setFeatures((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const togglePlanForFeature = (featureId: string, plan: PlanType) => {
    dirtyIdsRef.current.add(featureId);

    setFeatures((prev) =>
      prev.map((f) =>
        f.id === featureId ? { ...f, [plan]: !f[plan] } : f
      )
    );
  };

  const updatePlanField = <K extends keyof CommercialPlan>(
    id: string,
    field: K,
    value: CommercialPlan[K]
  ) => {
    setPlanConfig((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const deleteFeature = async (featureId: string, featureName: string) => {
    const result = await Swal.fire({
      title: "Delete Feature?",
      text: `Are you sure you want to delete "${featureName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
    });

    if (!result.isConfirmed) return;

    setDeletingFeatureId(featureId);

    try {
      const { error } = await supabase
        .from("commercial_features")
        .delete()
        .eq("id", featureId);

      if (error) throw error;

      dirtyIdsRef.current.delete(featureId);
      setFeatures((prev) => prev.filter((feature) => feature.id !== featureId));

      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Feature has been deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

    } catch (error) {
      console.error("Failed to delete feature:", error);

      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete feature.",
      });
    } finally {
      setDeletingFeatureId(null);
    }
  };

  const addFeature = async () => {
    if (!newFeature.product_feature.trim()) return;

    setAddingFeature(true);

    try {
      const payload = {
        product_feature: newFeature.product_feature.trim(),
        section: newFeature.section || "Product Feature",
        sort_order: Number(newFeature.sort_order) || 0,
        note_for_devs: newFeature.note_for_devs || null,
        definition: newFeature.definition || null,
        special: newFeature.special,
        free: newFeature.free,
        core: newFeature.core,
        premium: newFeature.premium,
        free_label: newFeature.free_label || null,
        core_label: newFeature.core_label || null,
        premium_label: newFeature.premium_label || null,
      };

      const { data, error } = await supabase
        .from("commercial_features")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      setFeatures((prev) =>
        [...prev, data as Feature].sort((a, b) => {
          const sectionCompare = (a.section || "").localeCompare(b.section || "");
          if (sectionCompare !== 0) return sectionCompare;
          return a.sort_order - b.sort_order;
        })
      );

      setNewFeature({
        product_feature: "",
        section: "Product Feature",
        sort_order: 0,
        note_for_devs: "",
        definition: "",
        special: false,
        free: false,
        core: false,
        premium: false,
        free_label: "",
        core_label: "",
        premium_label: "",
      });
      await Swal.fire({
        icon: "success",
        title: "Feature Added",
        text: "New feature created successfully",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Failed to add feature:", error);
    } finally {
      setAddingFeature(false);
    }
  };

  const savePlans = async () => {
    setSavingPlans(true);
    try {
      for (const plan of planConfig) {
        const { error } = await supabase
          .from("commercial_plans")
          .update({
            name: plan.name,
            price: Number(plan.price) || 0,
            original_price:
              plan.original_price === null || plan.original_price === undefined || plan.original_price === ("" as any)
                ? null
                : Number(plan.original_price),
            billing_period: plan.billing_period,
            badge_text: plan.badge_text || null,
            button_text: plan.button_text || null,
            description: plan.description || null,
            highlight: plan.highlight,
            popular: plan.popular,
            launch_label: plan.launch_label || null,
            sort_order: Number(plan.sort_order) || 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", plan.id);

        if (error) throw error;
      }

      setLastSaved(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );

      await Swal.fire({
        icon: "success",
        title: "Plans Updated",
        text: "Plan configuration saved successfully",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Failed to save plans:", error);
    } finally {
      setSavingPlans(false);
    }
  };

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(async () => {
      const dirtyIds = Array.from(dirtyIdsRef.current);
      if (dirtyIds.length === 0) return;

      setSavingFeatures(true);

      try {
        for (const id of dirtyIds) {
          const row = features.find((f) => f.id === id);
          if (!row) continue;

          const { error } = await supabase
            .from("commercial_features")
            .update({
              section: row.section,
              sort_order: Number(row.sort_order) || 0,
              product_feature: row.product_feature,
              note_for_devs: row.note_for_devs || null,
              definition: row.definition || null,
              special: row.special ?? false,
              free: row.free,
              core: row.core,
              premium: row.premium,
              free_label: row.free_label || null,
              core_label: row.core_label || null,
              premium_label: row.premium_label || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", id);

          if (error) throw error;
        }

        dirtyIdsRef.current.clear();

        setLastSaved(
          new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
      } catch (error) {
        console.error("Failed to save features:", error);
      } finally {
        setSavingFeatures(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [features, loading, supabase]);

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading configuration...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Profile Plans Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage commercial plans, prices, and feature access
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {savingFeatures ? (
            <span className="text-gray-500">Saving feature changes...</span>
          ) : (
            <span className="text-green-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {lastSaved ? `Saved at ${lastSaved}` : "All changes saved"}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Plan Pricing Management
            </h3>
            <p className="text-sm text-gray-500">
              Update plan names, prices, labels, and button text
            </p>
          </div>

          <button
            onClick={savePlans}
            disabled={savingPlans}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {savingPlans ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Plans
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {orderedPlans.map((plan) => (
            <div key={plan.id} className="border rounded-xl p-4 space-y-3">
              <div className="font-semibold text-gray-900">{plan.plan_key.toUpperCase()}</div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Name</label>
                <input
                  value={plan.name}
                  onChange={(e) => updatePlanField(plan.id, "name", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Price</label>
                  <input
                    type="number"
                    value={plan.price}
                    onChange={(e) =>
                      updatePlanField(plan.id, "price", Number(e.target.value))
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Original Price</label>
                  <input
                    type="number"
                    value={plan.original_price ?? ""}
                    onChange={(e) =>
                      updatePlanField(
                        plan.id,
                        "original_price",
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Billing Period</label>
                <input
                  value={plan.billing_period}
                  onChange={(e) =>
                    updatePlanField(plan.id, "billing_period", e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Badge Text</label>
                <input
                  value={plan.badge_text ?? ""}
                  onChange={(e) =>
                    updatePlanField(plan.id, "badge_text", e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Button Text</label>
                <input
                  value={plan.button_text ?? ""}
                  onChange={(e) =>
                    updatePlanField(plan.id, "button_text", e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                <textarea
                  value={plan.description ?? ""}
                  onChange={(e) =>
                    updatePlanField(plan.id, "description", e.target.value)
                  }
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Launch Label</label>
                <input
                  value={plan.launch_label ?? ""}
                  onChange={(e) =>
                    updatePlanField(plan.id, "launch_label", e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={plan.highlight}
                    onChange={(e) =>
                      updatePlanField(plan.id, "highlight", e.target.checked)
                    }
                  />
                  Highlight
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={plan.popular}
                    onChange={(e) =>
                      updatePlanField(plan.id, "popular", e.target.checked)
                    }
                  />
                  Popular
                </label>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Order</label>
                  <input
                    type="number"
                    value={plan.sort_order}
                    onChange={(e) =>
                      updatePlanField(plan.id, "sort_order", Number(e.target.value))
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Add New Feature</h3>
          <p className="text-sm text-gray-500">
            Create a new commercial feature row for provider plan comparison
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <input
            value={newFeature.product_feature}
            onChange={(e) =>
              setNewFeature((prev) => ({ ...prev, product_feature: e.target.value }))
            }
            placeholder="Feature name"
            className="border rounded-lg px-3 py-2 text-sm"
          />

          <input
            value={newFeature.section}
            onChange={(e) =>
              setNewFeature((prev) => ({ ...prev, section: e.target.value }))
            }
            placeholder="Section"
            className="border rounded-lg px-3 py-2 text-sm"
          />

          <input
            type="number"
            value={newFeature.sort_order}
            onChange={(e) =>
              setNewFeature((prev) => ({
                ...prev,
                sort_order: Number(e.target.value),
              }))
            }
            placeholder="Sort order"
            className="border rounded-lg px-3 py-2 text-sm"
          />

          <label className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2">
            <input
              type="checkbox"
              checked={newFeature.special}
              onChange={(e) =>
                setNewFeature((prev) => ({ ...prev, special: e.target.checked }))
              }
            />
            Special
          </label>

          {/* <input
            value={newFeature.note_for_devs}
            onChange={(e) =>
              setNewFeature((prev) => ({ ...prev, note_for_devs: e.target.value }))
            }
            placeholder="Note for devs"
            className="border rounded-lg px-3 py-2 text-sm"
          /> */}

          <input
            value={newFeature.definition}
            onChange={(e) =>
              setNewFeature((prev) => ({ ...prev, definition: e.target.value }))
            }
            placeholder="Definition"
            className="border rounded-lg px-3 py-2 text-sm"
          />

          <input
            value={newFeature.free_label}
            onChange={(e) =>
              setNewFeature((prev) => ({ ...prev, free_label: e.target.value }))
            }
            placeholder="Free label"
            className="border rounded-lg px-3 py-2 text-sm"
          />

          <input
            value={newFeature.core_label}
            onChange={(e) =>
              setNewFeature((prev) => ({ ...prev, core_label: e.target.value }))
            }
            placeholder="Core label"
            className="border rounded-lg px-3 py-2 text-sm"
          />

          <input
            value={newFeature.premium_label}
            onChange={(e) =>
              setNewFeature((prev) => ({ ...prev, premium_label: e.target.value }))
            }
            placeholder="Premium label"
            className="border rounded-lg px-3 py-2 text-sm"
          />

          <label className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2">
            <input
              type="checkbox"
              checked={newFeature.free}
              onChange={(e) =>
                setNewFeature((prev) => ({ ...prev, free: e.target.checked }))
              }
            />
            Free
          </label>

          <label className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2">
            <input
              type="checkbox"
              checked={newFeature.core}
              onChange={(e) =>
                setNewFeature((prev) => ({ ...prev, core: e.target.checked }))
              }
            />
            Core
          </label>

          <label className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2">
            <input
              type="checkbox"
              checked={newFeature.premium}
              onChange={(e) =>
                setNewFeature((prev) => ({ ...prev, premium: e.target.checked }))
              }
            />
            Premium
          </label>

          <button
            onClick={addFeature}
            disabled={addingFeature}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60"
          >
            {addingFeature ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Feature
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Feature Configuration
            </h3>
            <p className="text-sm text-gray-500">
              Loaded from Supabase: {features.length} features
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 border-r border-gray-200 min-w-[420px]">
                  Feature Details
                </th>

                {planColumnOrder.map((planKey) => {
                  const plan = orderedPlans.find((p) => p.plan_key === planKey);
                  return (
                    <th
                      key={planKey}
                      className="px-4 py-4 text-center text-sm font-semibold text-gray-900 border-r border-gray-200 last:border-r-0 min-w-[170px]"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span>{plan?.name ?? planKey}</span>
                        <span className="text-xs font-normal text-gray-500">
                          {selectedCount[planKey]} selected
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td
                  colSpan={4}
                  className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setExpanded((v) => !v)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Commercial Features
                      </h4>
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                        {features.length} features
                      </span>
                    </div>
                    {expanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </td>
              </tr>

              {expanded &&
                features.map((f) => (
                  <tr
                    key={f.id}
                    className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4 border-r border-gray-200 align-top">
                      <div className="space-y-2">
                        <input
                          value={f.product_feature}
                          onChange={(e) =>
                            updateFeatureField(f.id, "product_feature", e.target.value)
                          }
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          placeholder="Feature name"
                        />

                        <button
                          onClick={() => deleteFeature(f.id, f.product_feature)}
                          disabled={deletingFeatureId === f.id}
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                          title="Delete feature"
                        >
                          {deletingFeatureId === f.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={f.section ?? ""}
                            onChange={(e) =>
                              updateFeatureField(f.id, "section", e.target.value)
                            }
                            className="border rounded-lg px-3 py-2 text-sm"
                            placeholder="Section"
                          />
                          <input
                            type="number"
                            value={f.sort_order}
                            onChange={(e) =>
                              updateFeatureField(
                                f.id,
                                "sort_order",
                                Number(e.target.value)
                              )
                            }
                            className="border rounded-lg px-3 py-2 text-sm"
                            placeholder="Sort order"
                          />
                        </div>

                        {/* <input
                          value={f.note_for_devs ?? ""}
                          onChange={(e) =>
                            updateFeatureField(f.id, "note_for_devs", e.target.value)
                          }
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          placeholder="Note for devs"
                        /> */}

                        <input
                          value={f.definition ?? ""}
                          onChange={(e) =>
                            updateFeatureField(f.id, "definition", e.target.value)
                          }
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          placeholder="Definition"
                        />

                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={!!f.special}
                            onChange={(e) =>
                              updateFeatureField(f.id, "special", e.target.checked)
                            }
                          />
                          Special feature
                        </label>
                      </div>
                    </td>

                    {planColumnOrder.map((planKey) => {
                      const labelField =
                        planKey === "free"
                          ? "free_label"
                          : planKey === "core"
                            ? "core_label"
                            : "premium_label";

                      const checked = f[planKey];
                      const labelValue = f[labelField] ?? "";

                      return (
                        <td
                          key={`${f.id}-${planKey}`}
                          className="px-4 py-4 text-center border-r border-gray-200 last:border-r-0 align-top"
                        >
                          <div className="space-y-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePlanForFeature(f.id, planKey)}
                                className="sr-only"
                              />
                              <div
                                className={`w-10 h-5 ${checked ? "bg-blue-600" : "bg-gray-300"
                                  } rounded-full relative`}
                              >
                                <div
                                  className={`absolute top-0.5 ${checked ? "left-[22px]" : "left-[2px]"
                                    } bg-white w-4 h-4 rounded-full transition-all`}
                                />
                              </div>
                            </label>

                            <input
                              value={labelValue}
                              onChange={(e) =>
                                updateFeatureField(
                                  f.id,
                                  labelField as keyof Feature,
                                  e.target.value
                                )
                              }
                              placeholder="Optional label"
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// export async function POST(req: Request) {
//   try {
//     const body = await req.json()
    
//     const supabase = await createClient()
//     const cookie = (await cookies()).get("provider_session")
    
//     if (!cookie) {
//       return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
//     }

//     const provider = JSON.parse(cookie.value)

//     // Upsert product
// const { data: product, error: productError } = await supabase
//   .from("products")
//   .upsert({
//     provider_id: provider.id,
//     name: body.name,
//     description: body.description,
//     pricing_model: body.pricing_model,
//     free_trial: body.free_trial,
//     pricing_info: body.pricing_info,
//     primary_type: body.primary_type
//   })
//   .select()
//   .maybeSingle()

// if (productError) {
//   console.error(productError)
//   return NextResponse.json({ error: productError.message }, { status: 400 })
// }

// if (!product) {
//   return NextResponse.json({ error: "Product not created" }, { status: 400 })
// }

//     // Remove old selections
//     await supabase
//       .from("product_feature_selections")
//       .delete()
//       .eq("product_id", product.id)

//     // Insert new selections
//     if (body.selectedFeatures.length > 0) {
//       const featureRows = body.selectedFeatures.map((f: any) => ({
//         product_id: product.id,
//         feature_id: f
//       }))

//       await supabase
//         .from("product_feature_selections")
//         .insert(featureRows)
//     }

//     return NextResponse.json({ success: true })

//   } catch (err) {
//     console.error(err)
//     return NextResponse.json({ error: "Failed to save product" }, { status: 500 })
//   }
// }

type SessionInfo = {
  providerId: string;
  role: "Admin" | "Editor" | "Viewer";
  userType: "provider" | "team_member";
  userId: string;
};
function getSession(cookieStore: Awaited<ReturnType<typeof cookies>>): SessionInfo | null {
  const providerSessionRaw = cookieStore.get("provider_session")?.value;
  const teamSessionRaw = cookieStore.get("team_member_session")?.value;

  // If both exist, clear and force re-login (prevents weird conflicts)
  if (providerSessionRaw && teamSessionRaw) return null;

  if (providerSessionRaw) {
    const s = JSON.parse(providerSessionRaw);
    if (!s?.id) return null;

    return {
      providerId: s.id,
      role: "Admin",
      userType: "provider",
      userId: s.id,
    };
  }

  if (teamSessionRaw) {
    const s = JSON.parse(teamSessionRaw);
    if (!s?.id || !s?.provider_id) return null;

    return {
      providerId: s.provider_id,
      role: (s.role || "Viewer") as SessionInfo["role"],
      userType: "team_member",
      userId: s.id,
    };
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createClient();
    const cookieStore = await cookies();
    const session = getSession(cookieStore);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

     let productId = body.productId;

         if (!productId) {
      const { data: existingProduct } = await supabase
        .from("products")
        .select("id")
        .eq("provider_id", session.providerId)
        .maybeSingle();
      
      productId = existingProduct?.id;
    }

        // 1️⃣ Upsert product with explicit ID if we have one
    const productData = {
      provider_id: session.providerId,
      name: body.name,
      description: body.description,
      pricing_model: body.pricing_model,
      free_trial: body.free_trial,
      pricing_info: body.pricing_info,
      primary_type: body.primary_type,
      updated_at: new Date().toISOString()
    };

    // If we have a productId, include it in the upsert
    if (productId) {
      Object.assign(productData, { id: productId });
    }

    // 1️⃣ Upsert product
    const { data: product, error: productError } = await supabase
      .from("products")
      .upsert(productData)
      .select()
      .single();

    if (productError) throw productError;
    if (!product) throw new Error("Product not created");

    // 2️⃣ Replace feature selections
    await supabase
      .from("product_feature_selections")
      .delete()
      .eq("product_id", product.id);

    if (body.selectedFeatures?.length) {
      await supabase
        .from("product_feature_selections")
        .insert(
          body.selectedFeatures.map((id: string) => ({
            product_id: product.id,
            feature_id: id
          }))
        );
    }

    // 3️⃣ Replace feature tags ✅ NEW
    await supabase
      .from("product_feature_tags")
      .delete()
      .eq("product_id", product.id);

    if (body.featureTags?.length) {
      await supabase
        .from("product_feature_tags")
        .insert(
          body.featureTags.map((tag: string) => ({
            product_id: product.id,
            tag
          }))
        );
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Save product error:", err);
    return NextResponse.json(
      { error: "Failed to save product" },
      { status: 500 }
    );
  }
}


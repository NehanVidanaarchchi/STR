import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
export const runtime = 'nodejs';
import crypto from 'crypto';
import { cookies } from 'next/headers';

// export async function GET(request: Request) {
//   try {
//     const supabase = await createClient()
//     const { searchParams } = new URL(request.url)

//     let query = supabase
//       .from('companies')
//       .select(`
//         *,
//         contact_name,
//         founder,
//         primary_type_confidence,
//         primary_type_reason,
//         primary_type_sug,
//         record_id_ajl_hs,
//         favicon_url,
//         icon_url,
//         updated_at
//       `)
//       .order('name', { ascending: true })

//     const search = searchParams.get('search')
//     if (search) {
//       query = query.ilike('name', `%${search}%`)
//     }

//     const { data, error } = await query

//     if (error) {
//       console.error('Error fetching companies:', error)
//       return NextResponse.json({ error: error.message }, { status: 500 })
//     }

//     const normalized = data.map((company) => ({
//       ...company,
//       country:
//         company.country?.trim() ||
//         (Array.isArray(company.countries) && company.countries.length > 0
//           ? company.countries.join(', ')
//           : null),
//     }));
//     return NextResponse.json({
//       success: true,
//       data: normalized,
//       count: normalized.length
//     })
//   } catch (error) {
//     console.error('Unexpected error:', error)
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     )
//   }
// }

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const getAll = searchParams.get("all") === "true"; // ← Add this line
    
    // Build base query
    let query = supabase
      .from("companies")
      .select(
        `
          *,
          contact_name,
          founder,
          primary_type_confidence,
          primary_type_reason,
          primary_type_sug,
          record_id_ajl_hs,
          favicon_url,
          icon_url,
          updated_at
        `,
        { count: "exact" }
      )
      .order("name", { ascending: true });
    
    // Add search filter if provided
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }
    
    // If getAll is true, fetch ALL records without pagination
    if (getAll) {
      const { data, error, count } = await query;
      
      if (error) {
        console.error("Error fetching companies:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      const normalized = (data || []).map((company: any) => ({
        ...company,
        country:
          company.country?.trim() ||
          (Array.isArray(company.countries) && company.countries.length > 0
            ? company.countries.join(", ")
            : null),
      }));
      
      return NextResponse.json({
        success: true,
        data: normalized,
        count: count || 0,
      });
    }
    
    // Otherwise, use pagination (existing logic)
    const validLimit = Math.min(Math.max(limit, 1), 100);
    const from = (page - 1) * validLimit;
    const to = from + validLimit - 1;
    
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error("Error fetching companies:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    const normalized = (data || []).map((company: any) => ({
      ...company,
      country:
        company.country?.trim() ||
        (Array.isArray(company.countries) && company.countries.length > 0
          ? company.countries.join(", ")
          : null),
    }));
    
    const total = count ?? 0;
    const totalPages = Math.max(Math.ceil(total / validLimit), 1);
    
    return NextResponse.json({
      success: true,
      data: normalized,
      count: total,
      page,
      limit: validLimit,
      totalPages,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const data = JSON.parse(form.get('data') as string);

    let logoUrl = '';

    // Build company data object with all fields
    const companyData: any = {
      name: data.companyName,
      website_url: data.website?.trim() ? data.website.trim() : null,
      linkedin_url: data.linkedin,
      generic_email: data.email,
      email: data.email, // Also store in email field
      country: data.country,
      primary_type: data.primaryType,
      product_summary_short: data.productSummaryShort,
      product_summary_long: data.productSummaryLong,
    };
    companyData.logo_url = logoUrl;

    // Only add logo_url if we have one
    if (logoUrl) {
      companyData.logo_url = logoUrl;
    }

    // Add other optional fields if they exist in data
    if (data.contactName) companyData.contact_name = data.contactName;
    if (data.founder) companyData.founder = data.founder;
    if (data.recordId) companyData.record_id_ajl_hs = data.recordId;

    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .insert(companyData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(company);
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add PUT method for updating
// export async function PUT(req: Request) {
//   try {
//     console.log('PUT request received');
//     const form = await req.formData();
//     const file = form.get('file') as File | null;
//     const data = JSON.parse(form.get('data') as string);
//     const id = form.get('id') as string;
//     const existingLogoUrl = form.get('existingLogoUrl') as string | null;

//     console.log('PUT data:', {
//       id,
//       hasFile: !!file,
//       existingLogoUrl,
//       dataKeys: Object.keys(data),
//       companyName: data.companyName
//     });

//     if (!id) {
//       console.error('No ID provided');
//       return NextResponse.json(
//         { error: 'Company ID is required' },
//         { status: 400 }
//       );
//     }

//     let logoUrl = existingLogoUrl || '';

//     // Handle file upload if a new file is provided
//     if (file) {
//       const buffer = Buffer.from(await file.arrayBuffer());
//       const ext = file.name.split('.').pop();
//       const filePath = `companies/${id}/logo.${ext}`;

//       await supabaseAdmin.storage
//         .from('company-logos')
//         .upload(filePath, buffer, {
//           contentType: file.type,
//           upsert: true,
//         });

//       logoUrl = filePath;
//     }


//     // Build update data object
//     const updateData: any = {
//       name: data.companyName,
//       website_url: data.website,
//       linkedin_url: data.linkedin,
//       generic_email: data.email,
//       email: data.email,
//       country: data.country,
//       primary_type: data.primaryType,
//       product_summary_short: data.productSummaryShort,
//       product_summary_long: data.productSummaryLong,
//       updated_at: new Date().toISOString(),
//     };

//     // Add other optional fields
//     updateData.contact_name = data.contactName || null;
//     updateData.founder = data.founder || null;
//     updateData.record_id_ajl_hs = data.recordId || null;
//     updateData.primary_type_confidence = data.primaryTypeConfidence ? parseFloat(data.primaryTypeConfidence) : null;
//     updateData.primary_type_reason = data.primaryTypeReason || null;
//     updateData.primary_type_sug = data.primaryTypeSug || null;

//     // Only update logo_url if we have a value
//     if (logoUrl) {
//       updateData.logo_url = logoUrl;
//     } else if (logoUrl === '') {
//       // If logoUrl is empty string, set it to null (remove logo)
//       updateData.logo_url = null;
//     }

//     console.log('Updating company with data:', updateData);

//     const { data: company, error } = await supabaseAdmin
//       .from('companies')
//       .update(updateData)
//       .eq('id', id)
//       .select()
//       .single();

//     if (error) {
//       console.error('Supabase update error:', error);
//       return NextResponse.json({
//         error: 'Database update failed: ' + error.message,
//         details: error
//       }, { status: 500 });
//     }

//     console.log('Company updated successfully:', company.id);
//     return NextResponse.json(company);
//   } catch (err: any) {
//     console.error('Unexpected error in PUT:', err);
//     console.error('Error stack:', err.stack);
//     return NextResponse.json(
//       { error: 'Internal server error: ' + err.message },
//       { status: 500 }
//     );
//   }
// }

// export async function PUT(req: Request) {
//   try {
//     const cookieStore = await cookies();
//     const sessionCookie = cookieStore.get("provider_session");

//     if (!sessionCookie) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const providerSession = JSON.parse(sessionCookie.value);
//     const supabase = await createClient();

//     const body = await req.json();
//     const {
//       description,
//       website,
//       linkedin,
//       countries,
//       enabledSegments,
//     } = body;

//     const { data: provider } = await supabase
//       .from("company_providers")
//       .select("company_id")
//       .eq("provider_id", providerSession.id)
//       .single();

//     if (!provider?.company_id) {
//       return NextResponse.json({ error: "Company not found" }, { status: 404 });
//     }

//     const { error } = await supabase
//       .from("companies")
//       .update({
//         product_summary_long: description,
//         website_url: website,
//         linkedin_url: linkedin,
//         countries,
//         enabled_segments: enabledSegments,
//         updated_at: new Date().toISOString(),
//       })
//       .eq("id", provider.company_id);

//     if (error) throw error;

//     return NextResponse.json({ success: true });
//   } catch (err) {
//     console.error("Update company error:", err);
//     return NextResponse.json(
//       { error: "Failed to save company" },
//       { status: 500 }
//     );
//   }
// }

function isMultipart(req: Request) {
  const ct = req.headers.get("content-type") || "";
  return ct.includes("multipart/form-data");
}

export async function PUT(req: Request) {
  try {
    let id: string | null = null;
    let file: File | null = null;
    let existingLogoUrl: string | null = null;

    // data can come from JSON or form-data
    let data: any = null;

    if (isMultipart(req)) {
      const form = await req.formData();
      file = form.get("file") as File | null;
      existingLogoUrl = (form.get("existingLogoUrl") as string) || null;
      id = (form.get("id") as string) || null;

      const raw = form.get("data") as string | null;
      data = raw ? JSON.parse(raw) : {};
    } else {
      // JSON request (your current CompanyProfilePage PUT)
      data = await req.json();

      // IMPORTANT: you must have company id from somewhere
      // Option A: pass it in body (recommended)
      id = data.id || data.companyId || null;

      // For JSON updates, no file upload here
      file = null;
      existingLogoUrl = null;
    }

    if (!id) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
    }

    // keep old logo unless a new file is uploaded
    let logoUrl: string | null = existingLogoUrl || null;

    // Upload new logo if provided (multipart only)
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop() || "png";
      const filePath = `companies/${id}/logo.${ext}`;

      const uploadRes = await supabaseAdmin.storage
        .from("company-logos")
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadRes.error) {
        return NextResponse.json({ error: uploadRes.error.message }, { status: 500 });
      }

      logoUrl = filePath;
    }

    // Build update payload based on what your UI sends
    // Your CompanyProfilePage sends: description, website, linkedin, countries, enabledSegments, city, foundedYear, employeeCount, country
    // Your older form sends: companyName, primaryType, productSummaryShort/Long etc.
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Support both shapes safely
    if (data.companyName != null) updateData.name = data.companyName;
       updateData.website_url = data.website;
    if (data.linkedin != null) updateData.linkedin_url = data.linkedin;
    if (data.email != null) {
      updateData.generic_email = data.email;
      updateData.email = data.email;
    }
    if (data.country != null) updateData.country = data.country;

    if (data.primaryType != null) updateData.primary_type = data.primaryType;
    if (data.productSummaryShort != null) updateData.product_summary_short = data.productSummaryShort;
    if (data.productSummaryLong != null) updateData.product_summary_long = data.productSummaryLong;

    // UI profile fields
    if (data.description != null) updateData.product_summary_long = data.description;
    if (data.product_summary_short != null) updateData.product_summary_short = data.product_summary_short;
    if (Array.isArray(data.countries)) updateData.countries = data.countries;
    if (Array.isArray(data.enabledSegments)) updateData.enabled_segments = data.enabledSegments;
    if (data.city != null) updateData.city = data.city;

    if (data.foundedYear != null) {
      const fy = Number(data.foundedYear);
      updateData.founded_year = Number.isFinite(fy) ? fy : null;
    }
    if (data.employeeCount != null) {
      const ec = Number(data.employeeCount);
      updateData.employee_count = Number.isFinite(ec) ? ec : null;
    }

    // extra optional fields (old flow)
    if (data.contactName !== undefined) updateData.contact_name = data.contactName || null;
    if (data.founder !== undefined) updateData.founder = data.founder || null;
    if (data.recordId !== undefined) updateData.record_id_ajl_hs = data.recordId || null;
    if (data.primaryTypeConfidence !== undefined) updateData.primary_type_confidence = data.primaryTypeConfidence ?? null;
    if (data.primaryTypeReason !== undefined) updateData.primary_type_reason = data.primaryTypeReason || null;
    if (data.primaryTypeSug !== undefined) updateData.primary_type_sug = data.primaryTypeSug || null;

    // only set logo_url if we have a value (avoid wiping unintentionally)
    if (logoUrl) updateData.logo_url = logoUrl;

    const { data: company, error } = await supabaseAdmin
      .from("companies")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ company });
  } catch (err: any) {
    console.error("PUT error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Add DELETE method
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
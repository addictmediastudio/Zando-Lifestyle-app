import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { orderData, phonenumber, operator } = await req.json();
    const OPENPAY_SECRET_KEY = Deno.env.get("OPENPAY_SECRET_KEY");

    if (!OPENPAY_SECRET_KEY) {
      throw new Error("Configuration OpenPay manquante (clé API)");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const cleanPhone = phonenumber.replace(/[^0-9]/g, "");
    const orderId = "ZD-" + Math.random().toString(36).slice(2, 8).toUpperCase();

    // 1. Initiation du paiement OpenPay
    console.log(`Paiement OpenPay: ${cleanPhone}, Montant: ${orderData.total}`);

    const openpayRes = await fetch("https://api.openpay-cg.com/v1/transaction/payment", {
      method: "POST",
      headers: {
        "XO-API-KEY": OPENPAY_SECRET_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        amount: orderData.total,
        payment_phone_number: cleanPhone,
        customer_external_id: orderData.userId || "GUEST",
        customer: {
          name: orderData.name || "Client ZANDO",
          phone: cleanPhone,
        },
        provider: operator === "AIRTEL" ? "AIRTEL" : "MTN",
        metadata: {
          orderId: orderId,
          itemsCount: orderData.items.length,
        },
      }),
    });

    const result = await openpayRes.json();

    if (!openpayRes.ok) {
      const errorMessage = result.message || result.error || JSON.stringify(result);
      throw new Error(`OpenPay: ${errorMessage}`);
    }

    // 2. Enregistrement de la commande si le paiement est initié avec succès
    // Note: Dans un flux réel, on attendrait le webhook pour confirmer,
    // mais ici on suit la logique de création immédiate demandée.

    const { error: oErr } = await supabaseClient.from("orders").insert({
      id: orderId,
      user_id: orderData.userId || null,
      total: orderData.total,
      payment: "Mobile Money (OpenPay)",
      city: orderData.city,
      address: orderData.address,
      status: "En préparation",
    });

    if (oErr) throw oErr;

    if (orderData.items.length > 0) {
      const { error: iErr } = await supabaseClient.from("order_items").insert(
        orderData.items.map((it: any) => ({
          order_id: orderId,
          product_id: it.product.id,
          product_name: it.product.name,
          product_image: it.product.image,
          unit_price: it.product.price,
          qty: it.qty,
        })),
      );
      if (iErr) throw iErr;
    }

    return new Response(
      JSON.stringify({ success: true, orderId, transactionId: result.data?.transaction_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

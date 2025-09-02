// Teste simples do Mercado Pago API
const accessToken =
  "APP_USR-2313518896902484-081609-7b343b158d3baf491c34a36bba46a737-258500105";

async function testMercadoPago() {
  try {
    console.log("🧪 Testando API do Mercado Pago...");

    // Teste básico - listar métodos de pagamento
    const response = await fetch(
      "https://api.mercadopago.com/v1/payment_methods",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📊 Status da resposta:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ API funcionando! Métodos disponíveis:", data.length);
    } else {
      const errorText = await response.text();
      console.error("❌ Erro na API:", response.status, errorText);
    }

    // Teste de criação de preapproval
    const preapprovalData = {
      reason: "Teste - Assinatura Premium",
      external_reference: "test-123",
      payer_email: "teste@exemplo.com",
      back_url: "https://exemplo.com/success",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 39.9,
        currency_id: "BRL",
      },
      metadata: {
        plan_id: "monthly",
        plan_name: "Premium",
        user_id: "test-123",
      },
    };

    console.log("🔄 Testando criação de preapproval...");
    const preapprovalResponse = await fetch(
      "https://api.mercadopago.com/preapproval",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preapprovalData),
      }
    );

    console.log("📊 Status do preapproval:", preapprovalResponse.status);

    if (preapprovalResponse.ok) {
      const preapproval = await preapprovalResponse.json();
      console.log("✅ Preapproval criado! ID:", preapproval.id);
      console.log("🔗 URL de checkout:", preapproval.init_point);
    } else {
      const errorText = await preapprovalResponse.text();
      console.error(
        "❌ Erro no preapproval:",
        preapprovalResponse.status,
        errorText
      );
    }
  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

testMercadoPago();

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { slug, couple, amount } = await request.json();

        // ✅ Validações básicas
        console.log("📨 Dados recebidos:", { slug, couple, amount });

        if (!slug || !couple || !amount) {
            return NextResponse.json({ error: 'Faltam dados: slug, couple ou amount' }, { status: 400 });
        }

        const apiKey = process.env.ABACATEPAY_API_KEY;
        const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").trim().replace(/\/$/, "");

        if (!apiKey) {
            console.error("❌ ERRO: ABACATEPAY_API_KEY não definida no .env");
            return NextResponse.json({ error: 'Faltando configuração no servidor' }, { status: 500 });
        }

        // Converte amount para centavos (inteiro)
        const priceInCents = Math.round(parseFloat(String(amount)) * 100);

        console.log("💰 Convertendo:", { amount, priceInCents });

        // Montagem do payload seguindo a documentação da AbacatePay
        const bodyPayload = {
            frequency: "ONE_TIME",
            methods: ["PIX"],
            products: [
                {
                    externalId: String(slug).toLowerCase(),
                    name: `Site LovePage: ${String(couple).substring(0, 40)}`,
                    quantity: 1,
                    price: priceInCents,
                }
            ],
            returnUrl: `${baseUrl}/love/${slug}`,
            completionUrl: `${baseUrl}/love/${slug}?status=paid`,
        };

        console.log("📤 Enviando para AbacatePay...");

        const response = await fetch('https://api.abacatepay.com/v1/billing/create', {
            method: 'POST',
            headers: {
                "Content-Type": 'application/json',
                "Accept": 'application/json',
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify(bodyPayload)
        });

        const responseText = await response.text();
        console.log("📥 Resposta bruta do gateway (status", response.status + "):", responseText);

        let resData: any;
        try {
            resData = JSON.parse(responseText);
        } catch (e) {
            return NextResponse.json({
                error: "Resposta inválida da AbacatePay",
                rawResponse: responseText
            }, { status: 500 });
        }

        if (!response.ok) {
            const errorMsg = resData?.message || resData?.error || "Erro na integradora";
            return NextResponse.json({
                error: "Dados recusados pela AbacatePay",
                message: errorMsg
            }, { status: 400 });
        }

        // A URL da AbacatePay costuma vir em resData.data.url ou apenas resData.url
        const checkoutUrl = resData?.data?.url || resData?.url;

        if (!checkoutUrl) {
            throw new Error("URL de checkout não encontrada na resposta");
        }

        console.log("✅ Sucesso! URL gerada:", checkoutUrl);

        // --- ESTE RETORNO É O QUE ESTAVA FALTANDO ---
        return NextResponse.json({
            url: checkoutUrl
        });
        // --------------------------------------------

    } catch (error: any) {
        console.error("💥 Erro crítico no servidor:", error);
        return NextResponse.json({
            error: "Erro interno no servidor",
            details: error.message
        }, { status: 500 });
    }
}
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
            return NextResponse.json({ error: 'Faltando ABACATEPAY_API_KEY no .env' }, { status: 500 });
        }

        // Converte amount para centavos (inteiro)
        const priceInCents = Math.round(parseFloat(String(amount)) * 100);
        
        console.log("💰 Convertendo:", { amount, priceInCents });

        // Montagem do payload seguindo estritamente a documentação atualizada
        const bodyPayload = {
            frequency: "ONE_TIME",
            methods: ["PIX"],
            products: [
                {
                    externalId: String(slug).toLowerCase(), // Garante string minúscula
                    name: String(couple).substring(0, 50).trim() || "LovePage",
                    quantity: 1,
                    price: priceInCents, // Sempre inteiro em centavos
                }
            ],
            returnUrl: `${baseUrl}/love/${slug}`,
            completionUrl: `${baseUrl}/love/${slug}?status=paid`,
        };

        console.log("📤 Payload enviado:", JSON.stringify(bodyPayload, null, 2));
        console.log("🔑 API Key primeiros 10 caracteres:", apiKey?.substring(0, 10) + "***");

        const response = await fetch('https://api.abacatepay.com/v1/billing/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(bodyPayload)
        });

        // Captura o texto da resposta primeiro para debug
        const responseText = await response.text();
        console.log("📥 Resposta bruta (status", response.status + "):", responseText);

        let resData: any;
        try {
            resData = JSON.parse(responseText);
        } catch (e) {
            console.error("❌ Erro ao parsear JSON:", e);
            console.error("Conteúdo recebido:", responseText);
            return NextResponse.json({
                error: "Resposta inválida da AbacatePay",
                rawResponse: responseText
            }, { status: 500 });
        }

        if (!response.ok) {
            console.error("❌ Erro AbacatePay - Status:", response.status);
            console.error("📥 Resposta parseada:", JSON.stringify(resData, null, 2));
            
            // Extrai mensagem de erro
            const errorMsg = resData?.message || resData?.error || resData?.errors?.[0]?.message || JSON.stringify(resData);
            console.error("📝 Mensagem de erro:", errorMsg);
            
            return NextResponse.json({
                error: "Dados recusados pela AbacatePay",
                message: errorMsg,
                details: resData
            }, { status: 400 });
        }

        console.log("✅ Sucesso! URL gerada:", resData?.data?.url);

    } catch (error: any) {
        console.error("💥 Erro crítico no servidor:", error);
        return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
    }
}
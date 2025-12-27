import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

// Configura o cliente (Certifique-se que o Token no .env está certo!)
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || ''
});

export async function POST(req: NextRequest) {
    try {
        const { slug, couple, amount } = await req.json();

        // Pega a URL de onde veio a requisição (ex: http://localhost:3000)
        const origin = req.headers.get("origin");

        const preference = new Preference(client);

        const createdPreference = await preference.create({
            body: {
                external_reference: slug, // Usamos o slug para identificar no Webhook
                items: [
                    {
                        id: slug,
                        title: `Site do Casal: ${couple}`,
                        quantity: 1,
                        unit_price: Number(amount),
                        currency_id: "BRL",
                        category_id: "others",
                    },
                ],
                auto_return: "approved",
                back_urls: {
                    success: "https://www.google.com",
                    failure: "https://www.google.com",
                    pending: "https://www.google.com",
                  },
            },
        });

        if (!createdPreference.init_point) {
            throw new Error("Mercado Pago não gerou o link de pagamento.");
        }

        // Retornamos a URL para o seu frontend redirecionar
        return NextResponse.json({ url: createdPreference.init_point });

    } catch (err: any) {
        console.error("❌ Erro MP:", err);
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
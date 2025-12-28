import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || ''
});

export async function POST(req: NextRequest) {
    try {
        const { slug, couple, amount } = await req.json();

        // URL oficial do seu projeto no Firebase
        const baseUrl = "https://onlove.vercel.app";

        const preference = new Preference(client);

        const createdPreference = await preference.create({
            body: {
                external_reference: slug, // Essencial para o Webhook identificar quem pagou
                items: [
                    {
                        id: slug,
                        title: `Site do Casal: ${couple}`,
                        quantity: 1,
                        unit_price: Number(amount),
                        currency_id: "BRL",
                    },
                ],
                // Configuração de redirecionamento automático
                binary_mode: true,
                auto_return: "approved",
                back_urls: {
                    success: `${baseUrl}/love/${slug}?status=success`,
                    failure: `${baseUrl}/love/${slug}?status=failure`,
                    pending: `${baseUrl}/love/${slug}?status=pending`,
                },
                // Força o checkout a focar no Pix e métodos rápidos
                payment_methods: {
                    excluded_payment_types: [
                        { id: "ticket" } // Remove boleto (demora a compensar)
                    ],
                    installments: 1
                },
            },
        });

        if (!createdPreference.init_point) {
            throw new Error("Mercado Pago não gerou o link de pagamento.");
        }

        return NextResponse.json({ url: createdPreference.init_point });

    } catch (err: any) {
        console.error("❌ Erro MP:", err);
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
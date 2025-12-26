import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export async function POST(request: Request) {
    try {
        // 1. Recebe os dados do AbacatePay
        const body = await request.json();
        console.log("🪝 Webhook recebido:", JSON.stringify(body, null, 2));

        // 2. Verifica se o status é de sucesso
        // Na AbacatePay, geralmente o status é 'confirmed' ou 'paid'
        const status = body.data?.status;
        const slug = body.data?.products?.[0]?.externalId; // Usamos o slug que enviamos no checkout

        if (status === 'finished' || status === 'confirmed' || status === 'paid') {
            if (slug) {
                console.log(`✅ Pagamento aprovado para o site: ${slug}`);

                // 3. Atualiza o Firebase para paid: true
                const siteRef = doc(db, "sites", slug);
                await updateDoc(siteRef, {
                    paid: true,
                    updatedAt: new Date()
                });

                return NextResponse.json({ message: "Firebase atualizado com sucesso" });
            }
        }

        return NextResponse.json({ message: "Webhook processado (sem alteração)" });

    } catch (error: any) {
        console.error("💥 Erro no Webhook:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
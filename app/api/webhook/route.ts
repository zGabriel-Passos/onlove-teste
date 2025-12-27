import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Configuração usando o nome exato da variável que está na sua Vercel
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || ''
});

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // O Mercado Pago envia o ID do pagamento e o tipo da notificação
    const id = searchParams.get('data.id') || searchParams.get('id');
    const type = searchParams.get('type');

    // Só processamos se a notificação for do tipo 'payment' e tiver um ID
    if (type === 'payment' && id) {
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id });

      // Verificamos se o status é 'approved' (pago e compensado)
      if (payment.status === 'approved') {
        // O external_reference é o 'slug' que enviamos na criação do checkout
        const slug = payment.external_reference;

        if (slug) {
          const docRef = doc(db, "sites", slug);

          // Atualiza o Firebase para liberar o site do casal
          await updateDoc(docRef, {
            paid: true,
            updatedAt: new Date(),
            mercadopagoPaymentId: id
          });

          console.log(`✅ Site liberado com sucesso: ${slug}`);
        }
      }
    }

    // O Mercado Pago EXIGE um status 200 ou 201 para parar de enviar notificações
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Erro no Webhook:", error.message);
    // Mesmo com erro, retornamos 200 para evitar que o MP fique tentando infinitamente em caso de erro de código
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}
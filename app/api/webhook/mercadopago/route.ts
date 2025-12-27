import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Configuração com o token que você já tem no .env
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '' 
});

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // O Mercado Pago envia o ID do pagamento via query string ou body
  const id = searchParams.get('data.id') || searchParams.get('id');
  const type = searchParams.get('type');

  // Só processamos se o tipo for 'payment'
  if (type === 'payment' && id) {
    try {
      const payment = await new Payment(client).get({ id });

      // Verificamos se o status é 'approved' (pago)
      if (payment.status === 'approved') {
        // O external_reference é o slug que salvamos na criação da preferência
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
    } catch (error) {
      console.error("❌ Erro ao consultar pagamento no Mercado Pago:", error);
    }
  }

  // O Mercado Pago exige que você retorne status 200 ou 201 sempre
  return NextResponse.json({ status: 'received' }, { status: 200 });
}
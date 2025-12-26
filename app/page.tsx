'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function CriarSite() {
  const [loading, setLoading] = useState(false);

  const criarSlug = (texto: string) => {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') // Evita múltiplos hífens seguidos
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const coupleName = formData.get('couple') as string;
    const slug = criarSlug(coupleName);

    try {
      // 1. Salva no Firebase primeiro
      await setDoc(doc(db, "sites", slug), {
        couple: coupleName,
        letter: formData.get('letter'),
        themeColor: formData.get('color'),
        imagePrompt: formData.get('prompt'),
        seed: Math.floor(Math.random() * 1000),
        paid: false,
        createdAt: new Date()
      });

      // 2. Tenta gerar o pagamento
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slug: slug,
          couple: coupleName,
          amount: 10, // Valor fixo de R$ 10,00
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Erro ao parsear resposta do servidor:', e);
        throw new Error(`Erro do servidor (status ${response.status}). Verifique o console do servidor!`);
      }

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        const msg = data.message || data.error || "Erro desconhecido";
        throw new Error(`AbacatePay diz: ${msg}`);
      }

    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-pink-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-4xl shadow-2xl max-w-md w-full space-y-5 border border-pink-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-pink-600">LovePage ❤️</h1>
          <p className="text-gray-500 text-sm mt-1">Crie um site eterno para o seu amor</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-gray-400 ml-1">Nomes do Casal</label>
            <input name="couple" required className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-pink-500 text-black" placeholder="Ex: Pedro & Ana" />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-gray-400 ml-1">Sua Cartinha</label>
            <textarea name="letter" required className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-pink-500 text-black" rows={3} placeholder="Escreva algo especial..." />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold uppercase text-gray-400 ml-1">Cor do Site</label>
              <input name="color" type="color" defaultValue="#E91E63" className="w-full h-12 bg-gray-50 rounded-xl p-1 cursor-pointer" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-gray-400 ml-1">Estilo da Foto (IA)</label>
            <input name="prompt" required className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-pink-500 text-black" placeholder="Ex: casal estilo disney pixar" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pink-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-pink-200 hover:bg-pink-700 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Criando sua Magia...' : 'Gerar Site e Pagar Pix'}
        </button>
      </form>
    </main>
  );
} // <--- Esta chave fecha o export default function CriarSite()
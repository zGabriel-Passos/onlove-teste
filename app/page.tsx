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
      .replace(/-+/g, '-')
      .trim();
  };

  const extrairSpotifyId = (url: string) => {
    if (!url) return "";
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : url.trim();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const coupleName = formData.get('couple') as string;
    const slug = criarSlug(coupleName);

    const spotifyUrl = formData.get('spotifyUrl') as string;
    const spotifyId = extrairSpotifyId(spotifyUrl);

    // Coleta dados do Quiz (Perguntas Dinâmicas)
    const quizData = [
      {
        pergunta: formData.get('p1'),
        resposta: formData.get('r1')?.toString().toLowerCase().trim()
      },
      {
        pergunta: formData.get('p2'),
        resposta: formData.get('r2')?.toString().toLowerCase().trim()
      },
    ];

    try {
      // 1. Salva no Firebase
      await setDoc(doc(db, "sites", slug), {
        couple: coupleName,
        letter: formData.get('letter'),
        themeColor: formData.get('color'),
        imagePrompt: formData.get('prompt'),
        spotifyId: spotifyId,
        paid: false,
        createdAt: new Date(),
        quiz: quizData // Agora salva as perguntas!
      });

      // 2. Chamada da API
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: slug,
          couple: coupleName,
          amount: 0.20,
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        // Se der erro 400, o console vai mostrar a mensagem real aqui
        console.error("Erro retornado pela API:", data);
        throw new Error(data.error || "Erro ao gerar link de pagamento");
      }

    } catch (error: any) {
      console.error("Erro no Processo:", error);
      alert("Ops! " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-pink-50 flex items-center justify-center p-4 py-12">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full space-y-5 border border-pink-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-pink-600">LovePage ❤️</h1>
          <p className="text-gray-500 text-sm mt-1">Crie um site eterno para o seu amor</p>
        </div>

        <div className="space-y-4">
          <section className="space-y-3">
            <h2 className="text-sm font-black text-pink-400 uppercase tracking-widest border-b border-pink-50 pb-1">Básico</h2>
            <input name="couple" required className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 text-black" placeholder="Nomes: Pedro & Ana" />
            <textarea name="letter" required className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 text-black" rows={3} placeholder="Sua cartinha de amor..." />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-black text-pink-400 uppercase tracking-widest border-b border-pink-50 pb-1">O Quiz do Casal</h2>
            <div className="grid grid-cols-2 gap-2">
              <input name="p1" required className="p-3 bg-gray-50 rounded-xl text-sm text-black" placeholder="Pergunta 1 (Ex: Onde nos conhecemos?)" />
              <input name="r1" required className="p-3 bg-gray-100 rounded-xl text-sm text-black" placeholder="Resposta" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input name="p2" required className="p-3 bg-gray-50 rounded-xl text-sm text-black" placeholder="Pergunta 2" />
              <input name="r2" required className="p-3 bg-gray-100 rounded-xl text-sm text-black" placeholder="Resposta" />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-black text-pink-400 uppercase tracking-widest border-b border-pink-50 pb-1">Personalização</h2>
            <input name="spotifyUrl" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 text-black" placeholder="Link da Música no Spotify" />
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-400 font-bold">COR:</label>
              <input name="color" type="color" defaultValue="#E91E63" className="flex-1 h-10 bg-transparent cursor-pointer" />
            </div>
            <input name="prompt" required className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 text-black" placeholder="Estilo da foto (Ex: Disney Pixar)" />
          </section>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pink-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl hover:bg-pink-700 transition-all disabled:opacity-50"
        >
          {loading ? 'Processando...' : 'Gerar Site e Pagar R$ 10'}
        </button>
      </form>
    </main>
  );
}
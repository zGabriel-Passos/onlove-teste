'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function CriarSite() {
  const [loading, setLoading] = useState(false);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!currentSlug) return;

    const unsub = onSnapshot(doc(db, "sites", currentSlug), (docSnap) => {
      if (docSnap.data()?.paid === true) {
        router.push(`/love/${currentSlug}`);
      }
    });

    return () => unsub();
  }, [currentSlug]);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const coupleName = formData.get('couple') as string;
    const slug = criarSlug(coupleName + Math.floor(Math.random() * 100000));
    setCurrentSlug(slug);

    const youtubeUrl = formData.get('youtubeUrl') as string;

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
      await setDoc(doc(db, "sites", slug), {
        couple: coupleName,
        letter: formData.get('letter'),
        themeColor: formData.get('color'),
        // imagePrompt: formData.get('prompt'),
        youtubeUrl: youtubeUrl,
        paid: false,
        createdAt: new Date(),
        quiz: quizData
      });

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: slug,
          couple: coupleName,
          amount: 11.99,
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
          window.location.href = data.url;
        } else {
          window.open(data.url, '_blank');
        }
      } else {
        throw new Error(data.error || "Erro ao gerar link de pagamento");
      }
    } catch (error: any) {
      console.error("Erro no Processo:", error);
      alert("Ops! " + error.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-pink-50 flex items-center flex-col justify-center p-4 py-12">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full space-y-5 border border-pink-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-pink-600">OnLoveYou ❤️</h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading ? 'Aguardando confirmação do Pix...' : 'Crie um site eterno em 2 minutos para o seu amor!'}
          </p>
        </div>


        <div className="space-y-4">
          <section className="space-y-3">
            <h2 className="text-sm font-black text-pink-400 uppercase tracking-widest border-b border-pink-50 pb-1">Básico</h2>
            <input name="couple" required className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 text-black border-2 border-b-4 border-pink-100" placeholder="Ex: Pedro & Marcela" />
            <textarea name="letter" required className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 text-black resize-none border-2 border-b-4 border-pink-100" rows={3} placeholder="Sua texto romântico..." />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-black text-pink-400 uppercase tracking-widest border-b border-pink-50 pb-1">O Quiz do Casal</h2>
            <div className="grid grid-cols-2 gap-2">
              <input name="p1" required className="p-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-500 text-black border-2 border-b-4 border-pink-100" placeholder="Pergunta 1" />
              <input name="r1" required className="p-3 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-500 text-black border-2 border-b-4 border-pink-100" placeholder="Resposta" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input name="p2" required className="p-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-500 text-black border-2 border-b-4 border-pink-100" placeholder="Pergunta 2" />
              <input name="r2" required className="p-3 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-500 text-black border-2 border-b-4 border-pink-100" placeholder="Resposta" />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-black text-pink-400 uppercase tracking-widest border-b border-pink-50 pb-1">Personalização</h2>
            <input name="youtubeUrl" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 text-black border-2 border-b-4 border-pink-100" placeholder="Link da Música no Youtube" />
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-400 font-bold">COR:</label>
              <input name="color" type="color" defaultValue="#E91E63" className="flex-1 h-10 bg-transparent cursor-pointer" />
            </div>
            {/* <input name="prompt" required className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 text-black" placeholder="Estilo da foto" /> */}
          </section>
          <span className='text-sm text-gray-600 text-center block'>
            *O site já estará pronto ao completar o pagamento, o MercadoPago pode demorar para confirmar*
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pink-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl hover:bg-pink-700 transition-all disabled:opacity-50 cursor-pointer border-2 border-b-4 border-black hover:border-b-2"
        >
          {loading ? 'Aguardando Pagamento...' : 'Gerar Site e Pagar R$ 11,99'}
        </button>
      </form>

      <footer className='mt-2 text-center'>
        <div>
          <p>
            &copy; {new Date().getFullYear()} <strong>OnLoveYou</strong>. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </main>
  );
}
import { db } from "@/lib/firebase"; // Ajuste o caminho conforme sua estrutura
import { doc, getDoc } from "firebase/firestore";
import { notFound } from "next/navigation";

interface LoveData {
  couple: string;
  imagePrompt: string;
  letter: string;
  paid: boolean;
  themeColor: string;
  seed?: number;
}

// Definição correta para Next.js 15
interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function LovePage({ params }: PageProps) {
  // 1. RESOLVE A PROMISE DO PARAMS (Obrigatório no Next 15)
  const { slug } = await params;

  // 2. VALIDAÇÃO DE SEGURANÇA
  // Se o slug não existir por algum motivo, para aqui e evita erro no Firebase
  if (!slug) {
    console.error("Slug não encontrado nos parâmetros da URL");
    notFound();
  }

  try {
    // 3. BUSCA NO FIREBASE
    // Usamos o 'slug' que veio da URL para buscar o Document ID no Firestore
    const docRef = doc(db, "sites", slug);
    const docSnap = await getDoc(docRef);

    // Se o ID 'pedro' não existir na coleção 'sites', mostra 404
    if (!docSnap.exists()) {
      console.log(`Documento com ID "${slug}" não existe no Firestore.`);
      notFound();
    }

    const data = docSnap.data() as LoveData;

    // 4. VERIFICAÇÃO DE PAGAMENTO
    if (!data.paid) {
      return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-10 bg-white rounded-2xl shadow-sm">
            <h2 className="text-2xl font-bold text-pink-500">Quase lá! ❤️</h2>
            <p className="text-gray-500 mt-2">Aguardando a confirmação do pagamento...</p>
          </div>
        </main>
      );
    }

    // 5. MONTAGEM DA URL DA IA
    const imageUrl = `https://image.pollinations.ai/prompt/${data.imagePrompt}?width=1080&height=1080&model=flux&seed=${data.seed}`;

    return (
      <main
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: `${data.themeColor}15` }}
      >
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white">
          <img
            src={imageUrl}
            alt="Ilustração do Casal"
            className="w-full aspect-square object-cover"
          />

          <div className="p-10 text-center">
            <h1 className="text-3xl font-serif font-bold mb-4" style={{ color: data.themeColor }}>
              Para: {data.couple}
            </h1>

            <p className="text-gray-700 leading-relaxed text-lg italic">
              "{data.letter}"
            </p>

            <div className="mt-8 pt-6 border-t border-gray-100 text-2xl">
              ❤️
            </div>

            {/* <iframe
              width="100%"
              height="315"
              src="https://www.youtube.com/embed/uWRlisQu4fo"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="mt-6 rounded-lg"
            ></iframe> */}
          </div>
        </div>
      </main>
    );

  } catch (error) {
    // Captura erros de configuração do Firebase ou rede
    console.error("Erro interno:", error);
    notFound();
  }
}
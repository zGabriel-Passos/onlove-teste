import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { notFound } from "next/navigation";
import QuizWrapper from "@/components/QuizWrapper"; // Vamos criar este componente
import Snowfall from "@/components/Snowfall"; // Vamos criar este componente


interface LoveData {
  couple: string;
  imagePrompt: string;
  letter: string;
  paid: boolean;
  themeColor: string;
  spotifyId?: string;
  seed?: number;
  quiz?: { pergunta: string; resposta: string }[];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function LovePage({ params }: PageProps) {
  const { slug } = await params;

  if (!slug) notFound();

  try {
    const docRef = doc(db, "sites", slug);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) notFound();

    const data = docSnap.data() as LoveData;

    // 1. Verificação de Pagamento
    if (!data.paid) {
      return (
        <main className="min-h-screen flex items-center justify-center bg-pink-50 p-6">
          <div className="text-center p-10 bg-white rounded-[2.5rem] shadow-xl max-w-sm w-full border-4 border-white">
            <div className="text-4xl mb-4 animate-bounce">⏳</div>
            <h2 className="text-2xl font-bold text-pink-600">Quase lá! ❤️</h2>
            <p className="text-gray-500 mt-2">Estamos processando o seu Pix. Assim que aprovado, o presente aparecerá aqui!</p>
            <div className="mt-6 h-2 w-full bg-pink-100 rounded-full overflow-hidden">
              <div className="h-full bg-pink-500 animate-pulse w-2/3"></div>
            </div>
          </div>
        </main>
      );
    }

    // 2. Montagem dos Recursos
    const seed = data.seed || Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${data.imagePrompt}?width=400&height=400&model=flux&seed=${seed}`;
    const hasQuiz = data.quiz && data.quiz.length > 0;

    return (
      <main
        className="min-h-screen flex items-center justify-center p-4 transition-colors duration-1000"
        style={{ backgroundColor: `${data.themeColor}20` }}
      >
        <Snowfall />

        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border-8 border-white relative">

          {/* Se tiver Quiz, ele cobre o conteúdo até ser respondido */}
          {hasQuiz ? (
            <QuizWrapper
              quiz={data.quiz!}
              themeColor={data.themeColor}
              couple={data.couple}
            >
              {/* O conteúdo abaixo só aparece após o Quiz ser resolvido */}
              <LoveContent data={data} imageUrl={imageUrl} />
            </QuizWrapper>
          ) : (
            <LoveContent data={data} imageUrl={imageUrl} />
          )}

        </div>
      </main>
    );

  } catch (error) {
    console.error("Erro interno:", error);
    notFound();
  }
}

// Componente Interno para organizar o conteúdo final
function LoveContent({ data, imageUrl }: { data: LoveData, imageUrl: string }) {
  return (
    <div className="animate-in fade-in zoom-in duration-1000">
      <img
        src={imageUrl}
        alt="Nossa foto"
        className="w-full aspect-square object-cover"
      />

      {data.spotifyId && (
        <div className="px-4 -mt-10 relative z-10">
          <iframe
            src={`https://open.spotify.com/embed/track/${data.spotifyId}?utm_source=generator&theme=0`}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="rounded-2xl shadow-lg"
          ></iframe>
        </div>
      )}

      <div className="p-8 text-center space-y-4">
        <h1 className="text-3xl font-serif font-bold" style={{ color: data.themeColor }}>
          Para: {data.couple}
        </h1>

        <div className="relative">
          <span className="text-4xl absolute -top-4 -left-2 opacity-20">"</span>
          <p className="text-gray-700 leading-relaxed text-lg italic px-4">
            {data.letter}
          </p>
          <span className="text-4xl absolute -bottom-8 -right-2 opacity-20">"</span>
        </div>

        <div className="mt-12 text-2xl animate-pulse">❤️</div>
      </div>
    </div>
  );
}
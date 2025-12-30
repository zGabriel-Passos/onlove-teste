import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { notFound } from "next/navigation";
import QuizWrapper from "@/components/QuizWrapper";
import Snowfall from "@/components/Snowfall";
import Image from "next/image";

interface LoveData {
  couple: string;
  imagePrompt: string;
  letter: string;
  paid: boolean;
  themeColor: string;
  youtubeUrl?: string;
  seed?: number;
  quiz?: { pergunta: string; resposta: string }[];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Função utilitária para converter URL do YouTube para Embed
function getEmbedUrl(url?: string) {
  if (!url) return null;
  let videoId = "";
  if (url.includes("v=")) {
    videoId = url.split("v=")[1].split("&")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1].split("?")[0];
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}` : null;
}

export default async function LovePage({ params }: PageProps) {
  const { slug } = await params;

  if (!slug) notFound();

  try {
    const docRef = doc(db, "sites", slug);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) notFound();

    const data = docSnap.data() as LoveData;

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

    const seed = data.seed || 0;
    const imageUrl = `/assets/image${seed}.png`; // Dinâmico conforme o seed
    const hasQuiz = data.quiz && data.quiz.length > 0;
    const embedUrl = getEmbedUrl(data.youtubeUrl);

    return (
      <main
        className="min-h-screen flex items-center justify-center p-4 transition-colors duration-1000"
        style={{ backgroundColor: `${data.themeColor}20` }}
      >
        <Snowfall />

        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border-8 border-white relative">
          {hasQuiz ? (
            <QuizWrapper
              quiz={data.quiz!}
              themeColor={data.themeColor}
              couple={data.couple}
            >
              <LoveContent data={data} imageUrl={imageUrl} embedUrl={embedUrl} />
            </QuizWrapper>
          ) : (
            <LoveContent data={data} imageUrl={imageUrl} embedUrl={embedUrl} />
          )}
        </div>
      </main>
    );

  } catch (error) {
    console.error("Erro interno:", error);
    notFound();
  }
}

function LoveContent({ data, imageUrl, embedUrl }: { data: LoveData, imageUrl: string, embedUrl: string | null }) {
  return (
    <div className="animate-in fade-in zoom-in duration-1000">
      <Image
        src={imageUrl}
        width={500}
        height={500}
        alt="Nossa foto"
        className="w-full aspect-square object-cover"
      />

      <div className="p-8 text-center space-y-6">
        <h1 className="text-3xl font-serif font-bold" style={{ color: data.themeColor }}>
          Para: {data.couple}
        </h1>

        <div className="relative">
          <span className="text-4xl absolute -top-4 -left-2 opacity-20" style={{ color: data.themeColor }}>"</span>
          <p className="text-gray-700 leading-relaxed text-lg italic px-4 whitespace-pre-wrap">
            {data.letter}
          </p>
          <span className="text-4xl absolute -bottom-8 -right-2 opacity-20" style={{ color: data.themeColor }}>"</span>
        </div>

        {embedUrl && (
          <div className="rounded-3x1 overflow-hidden shadow-lg bg-black aspect-video">
            <iframe
              src={embedUrl}
              title="Sua música"
              allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-50"
            ></iframe>
          </div>
        )}

        <div className="pt-4 text-2xl animate-pulse">❤️</div>
      </div>
    </div>
  );
}
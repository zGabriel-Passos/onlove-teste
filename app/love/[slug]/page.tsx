'use client';
import { useEffect, useState } from "react";
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


export default function LovePage({ params }: PageProps) {
  const [data, setData] = useState<LoveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState<string>("");

  useEffect(() => {
    params.then((p) => {
      setSlug(p.slug);
      const docRef = doc(db, "sites", p.slug);
      getDoc(docRef).then((docSnap) => {
        if (docSnap.exists()) {
          setData(docSnap.data() as LoveData);
        } else {
          notFound();
        }
        setLoading(false);
      });
    });
  }, [params]);

  if (loading) return null;
  if (!data) return notFound();

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
  const imageUrl = `/assets/image${seed}.png`;
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
            <LoveContent data={data} imageUrl={imageUrl} embedUrl={embedUrl} slug={slug} />
          </QuizWrapper>
        ) : (
          <LoveContent data={data} imageUrl={imageUrl} embedUrl={embedUrl} slug={slug} />
        )}
      </div>
    </main>
  );
}

function LoveContent({ data, imageUrl, embedUrl, slug }: { data: LoveData, imageUrl: string, embedUrl: string | null, slug: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const siteUrl = typeof window !== "undefined" ? `${window.location.origin}/love/${slug}` : "";

  const copyLink = () => {
    const btn = document.getElementById('btn-copiar');
    navigator.clipboard.writeText(siteUrl);
    if (btn) btn.innerText = "Link copiado! ❤️";
  };

  const downloadQRCode = async () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(siteUrl)}`;

    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `qrcode-${slug}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar o QR Code:", error);
      // Caso o fetch falhe (CORS), abre em nova aba como plano B
      window.open(qrUrl, '_blank');
    }
  };

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
          <div className="rounded-3xl overflow-hidden shadow-lg bg-black aspect-video">
            <iframe
              src={embedUrl}
              title="Sua música"
              allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        )}

        <div className="pt-4 text-2xl animate-pulse">❤️</div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-white p-3 cursor-pointer text-black border-2 border-b-4 border-black rounded-2xl font-bold hover:bg-gray-100 active:border-b-2 transition-all flex items-center justify-center gap-2"
        >
          QR Code & Link
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#000000" viewBox="0 0 256 256"><path d="M176,160a39.89,39.89,0,0,0-28.62,12.09l-46.1-29.63a39.8,39.8,0,0,0,0-28.92l46.1-29.63a40,40,0,1,0-8.66-13.45l-46.1,29.63a40,40,0,1,0,0,55.82l46.1,29.63A40,40,0,1,0,176,160Zm0-128a24,24,0,1,1-24,24A24,24,0,0,1,176,32ZM64,152a24,24,0,1,1,24-24A24,24,0,0,1,64,152Zm112,72a24,24,0,1,1,24-24A24,24,0,0,1,176,224Z"></path></svg>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full relative shadow-2xl animate-in zoom-in duration-200 border-4 border-white">

            <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Mande para o seu <span className="text-red-500">amor!</span></h2>

              <div className="flex justify-center p-4 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${siteUrl}`}
                  alt="QR Code"
                  className="w-[150px] h-[150px]"
                />
              </div>

              <button
                onClick={downloadQRCode}
                className="text-[12px] font-bold cursor-pointer text-blue-600 hover:underline flex items-center gap-1"
              >
                Baixar QR Code  ⬇
              </button>

              <div className="space-y-2 text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase ml-2">Link de acesso</p>
                <div className="flex flex-wrap justify-center w-full items-center gap-2 p-3 bg-gray-100 rounded-xl border border-gray-200">
                  <input
                    readOnly
                    value={siteUrl}
                    className="w-full bg-transparent text-[14px] flex-1 outline-none text-gray-500 truncate"
                  />
                  <button
                    onClick={copyLink}
                    className="text-[10px] bg-white px-2 py-1 rounded-lg border border-gray-300 font-bold active:scale-95 transition-all cursor-pointer"
                    id="btn-copiar"
                  >
                    COPIAR
                  </button>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full border-2 border-b-4 border-black py-3 font-bold text-white bg-red-500 rounded-xl cursor-pointer hover:border-b-2"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
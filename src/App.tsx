import { useState, useEffect } from "react";
import {
  Download,
  Pause,
  Play,
  Copy,
  Check,
  AudioWaveform,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

import { TextStatistics } from "./components/text-statistics";
import { VoiceSelector } from "./components/voice-selector";
import { SpeedControl } from "./components/speed-control";

// Kokoro Modelinin Desteklediği Bütün Resmi Amerikan ve İngiliz Sesleri
const AVAILABLE_VOICES = {
  // Amerikan İngilizcesi - Kadın Sesleri
  "af_heart": { name: "Heart (US Female - Önerilen)", language: "en-us" },
  "af_bella": { name: "Bella (US Female)", language: "en-us" },
  "af_nicole": { name: "Nicole (US Female)", language: "en-us" },
  "af_aoede": { name: "Aoede (US Female)", language: "en-us" },
  "af_sarah": { name: "Sarah (US Female)", language: "en-us" },
  "af_sky": { name: "Sky (US Female)", language: "en-us" },
  
  // Amerikan İngilizcesi - Erkek Sesleri
  "am_adam": { name: "Adam (US Male)", language: "en-us" },
  "am_michael": { name: "Michael (US Male)", language: "en-us" },
  
  // İngiliz İngilizcesi - Kadın Sesleri
  "bf_emma": { name: "Emma (UK Female)", language: "en-gb" },
  "bf_isabella": { name: "Isabella (UK Female)", language: "en-gb" },
  
  // İngiliz İngilizcesi - Erkek Sesleri
  "bm_george": { name: "George (UK Male)", language: "en-gb" },
  "bm_lewis": { name: "Lewis (UK Male)", language: "en-gb" }
};

export default function AudioReader() {
  const [text, setText] = useState(
    "Kokoro is an open-weight TTS model with 82 million parameters. It delivers incredible voice quality while being hosted fully on the cloud now!",
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<"ready" | "generating" | "error">("ready");
  const [error, setError] = useState<string | null>(null);

  const [selectedVoice, setSelectedVoice] = useState<string>("af_heart");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Ses çalma veya üretme tetikleyicisi
  const handlePlayPause = async () => {
    if (isPlaying) {
      audioElement?.pause();
      setIsPlaying(false);
      return;
    }

    if (audioUrl && audioElement) {
      audioElement.playbackRate = speed;
      audioElement.play();
      setIsPlaying(true);
      return;
    }

    setStatus("generating");
    setError(null);
    const toastId = toast.loading("Ses sunucuda üretiliyor, lütfen bekleyin...");

    try {
      const response = await fetch("/_worker.js", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: selectedVoice, speed })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Ses üretilirken sunucu hatası oluştu.");
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(url);
      audio.playbackRate = speed;
      audio.onended = () => setIsPlaying(false);
      
      setAudioUrl(url);
      setAudioElement(audio);
      setStatus("ready");
      setIsPlaying(true);
      audio.play();
      
      toast.dismiss(toastId);
      toast.success("Ses başarıyla üretildi!");

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setError(err.message);
      toast.dismiss(toastId);
      toast.error("Hata: " + err.message);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Metin, ses veya hız değişirse eski üretilen sesi temizle
  useEffect(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setAudioElement(null);
      setIsPlaying(false);
    }
  }, [text, selectedVoice, speed]);

  return (
    <>
      <div className="min-h-screen bg-gray-50/50 p-4 md:p-12">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2">
              <AudioWaveform className="size-12 text-blue-500" />
              <h1 className="text-5xl font-bold text-gray-900">Kokoro Web</h1>
            </div>
            <p className="text-gray-500">
              Metinleri cihazınızı yormadan, bulut gücüyle doğal sese dönüştürün
            </p>
          </div>

          <Card className="shadow-lg">
            <CardContent>
              <div className="relative">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Buraya seslendirmek istediğiniz metni yazın..."
                  maxLength={1000} // 1000 Karakter Limiti Aktif
                  className="transition-all min-h-[180px] text-lg leading-relaxed resize-y"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              {/* Kullanıcının göreceği canlı harf sayacı */}
              <div className="flex justify-between items-center pt-2 text-sm text-gray-400">
                <div>{text.length} / 1000 Karakter</div>
                <TextStatistics text={text} />
              </div>

              <div className="flex gap-4 pb-4 min-h-14 items-center justify-center">
                <VoiceSelector
                  voices={AVAILABLE_VOICES}
                  selectedVoice={selectedVoice}
                  onVoiceChange={setSelectedVoice}
                />
                <div className="flex items-center gap-4 w-44">
                  <SpeedControl speed={speed} onSpeedChange={setSpeed} />
                </div>
              </div>

              <Separator />

              <div className="flex py-4 gap-4">
                <Button
                  size="lg"
                  onClick={handlePlayPause}
                  className={cn(
                    "text-lg w-40 transition-all",
                    isPlaying && "bg-orange-600 hover:bg-orange-700",
                  )}
                  disabled={status === "generating" || !text}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="mr-1 size-8" />
                      Durdur
                    </>
                  ) : (
                    <>
                      <Play className="mr-1 size-8" />
                      {status === "generating" ? "Üretiliyor..." : audioUrl ? "Dinle" : "Sese Çevir"}
                    </>
                  )}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    if (!audioUrl) return;
                    const link = document.createElement("a");
                    link.href = audioUrl;
                    link.download = "kokoro-ses.mp3";
                    link.click();
                  }}
                  disabled={!audioUrl}
                  className="ml-auto"
                >
                  <Download className="mr-2 size-6" />
                  Sesi İndir
                </Button>
              </div>

              {error && (
                <div className="text-red-500 font-semibold text-center p-2 bg-red-50 rounded-lg mt-2">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="fixed bottom-4 text-center w-full text-gray-400 text-sm">
        Süper Hafif Bulut Modeli Devrede 🚀
      </div>
      <Toaster toastOptions={{ style: { fontSize: 16 } }} />
    </>
  );
}

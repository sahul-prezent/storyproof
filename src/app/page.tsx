'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Dropzone } from '@/components/upload/dropzone';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Clock,
  BarChart3,
  Target,
  Microscope,
  Zap,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
    setUploadError(null);
  };

  const handleContinue = async () => {
    if (!file) return;
    setProcessing(true);
    setUploadError(null);

    try {
      // Upload file to server → Supabase Storage
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Upload failed.');
      }

      const { storagePath, fileName, fileType } = await res.json();

      // Store upload metadata in sessionStorage (small strings only)
      sessionStorage.setItem('storyproof_storagePath', storagePath);
      sessionStorage.setItem('storyproof_fileName', fileName);
      sessionStorage.setItem('storyproof_fileType', fileType);

      router.push('/context');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="prezent-hero-bg relative">
        <Header />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="container mx-auto px-4 pt-20 pb-20 text-center">
            <div className="inline-flex mb-10 rounded-full p-[1px]" style={{ background: 'linear-gradient(90deg, #21A7E0 0%, #68FFEB 26%, #93FFA2 40%, #FFD769 57%, #FF9B3E 70%, #FF9143 89%)' }}>
              <span className="inline-flex items-center rounded-full bg-[#0B1D3A] px-7 py-2.5 text-[13px] uppercase tracking-[0.2em] font-medium text-[#CBD5E1]">
                AI-Powered Presentation Diagnostics
              </span>
            </div>
            <h1 className="text-5xl font-light tracking-tight sm:text-6xl lg:text-7xl mb-8 text-white leading-tight">
              Has your deck been{' '}
              <span className="prezent-gradient-text font-bold">StoryProofed</span>?
            </h1>
            <p className="text-xl text-[#94A3B8] max-w-2xl mx-auto mb-12 leading-relaxed">
              Upload your presentation and get a scored diagnostic report in 60
              seconds — 36 signals, 7 categories, specific evidence-based
              feedback that a consultant would charge $500–$2,000 to produce.
            </p>

            {/* Upload Area */}
            <div className="max-w-lg mx-auto mb-4">
              <Dropzone onFileSelected={handleFileSelected} disabled={processing} />
            </div>

            {/* Continue Button */}
            {file && (
              <div className="max-w-lg mx-auto mb-4">
                <Button
                  size="lg"
                  className="w-full text-lg bg-[#0B1D3A] hover:bg-[#112D4E] text-white rounded-full font-medium py-6 border border-white/10"
                  onClick={handleContinue}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      Analyze My Presentation
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                {uploadError && (
                  <p className="text-sm text-red-400 mt-2">{uploadError}</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 max-w-lg mx-auto mb-8 mt-4">
              <svg className="h-4 w-4 text-[#93FFA2] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <p className="text-sm text-[#CBD5E1]">
                Your file is processed and automatically deleted after scoring.
              </p>
            </div>
          </section>
        </main>
      </div>

      {/* Features Grid */}
      <section className="bg-[#F1F5F9] py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl sm:text-5xl text-center text-[#0B1D3A] mb-14 tracking-tight">
            More <span className="font-bold">insight</span> with every deck
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard
              icon={<Clock className="h-6 w-6" />}
              title="60-Second Results"
              description="Upload, answer 5 quick questions, and receive your full diagnostic report — faster than any consultant."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="36 Scoring Signals"
              description="From narrative structure to slide design quality — every dimension of your presentation analyzed in depth."
            />
            <FeatureCard
              icon={<Target className="h-6 w-6" />}
              title="Specific Evidence"
              description="Every finding cites slide numbers, quoted headlines, and word counts. No generic feedback."
            />
            <FeatureCard
              icon={<Microscope className="h-6 w-6" />}
              title="BioPharma-Specific"
              description="MLR readiness, evidence citation, scientific translation — 8 signals no generic tool covers."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Enterprise-grade privacy"
              description="Your presentation is processed in memory and deleted immediately after scoring. We never store your files."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Actionable Quick Wins"
              description="Get your top 3 critical issues and 3 easiest fixes you can implement today to improve your deck."
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-[#21A7E0]">{icon}</div>
        <h3 className="font-bold text-lg text-[#0B1D3A]">{title}</h3>
      </div>
      <div
        className="h-[3px] w-full rounded-full mb-5"
        style={{
          background: 'linear-gradient(90deg, #21A7E0 0%, #68FFEB 26%, #93FFA2 40%, #FFD769 57%, #FF9B3E 70%, #FF9143 89%)',
        }}
      />
      <p className="text-base text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

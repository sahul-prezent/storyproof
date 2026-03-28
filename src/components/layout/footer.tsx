import Image from 'next/image';

export function Footer() {
  return (
    <footer className="mt-auto bg-[#0B1D3A] border-t border-white/10 py-14">
      <div className="container mx-auto px-4 flex flex-col items-center gap-6">
        <Image
          src="/prezent-logo-light.png"
          alt="Prezent"
          width={140}
          height={36}
          className="h-8 w-auto opacity-80"
        />
        <p className="text-base text-[#94A3B8] text-center max-w-xl leading-relaxed">
          StoryProof is a diagnostic tool by Prezent.ai — the presentation
          productivity and business storytelling platform for enterprise teams.
        </p>
      </div>
    </footer>
  );
}

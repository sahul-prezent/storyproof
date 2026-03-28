'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/auth/supabase-browser';
import { LogOut, ShieldCheck, LogIn } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    setMounted(true);

    if (initialized.current) return;
    initialized.current = true;

    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAdmin(session?.user?.email === 'sahul.hameed@prezent.ai');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setIsAdmin(session?.user?.email === 'sahul.hameed@prezent.ai');
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full pt-4 pb-2 px-6">
      <div className="mx-auto max-w-7xl flex h-16 items-center px-10 bg-white/95 backdrop-blur-md rounded-full shadow-lg shadow-black/5 border border-gray-100">
        {/* Logo — matching Prezent website size */}
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/prezent-logo.svg"
            alt="Prezent"
            width={160}
            height={40}
            className="h-9 w-auto"
            priority
          />
        </Link>

        {/* Right side — auth dependent, only after mount */}
        {mounted ? (
          <div className="ml-auto flex items-center gap-5">
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 text-[15px] text-[#0B1D3A] hover:text-[#0B1D3A]/70 font-medium transition-colors"
              >
                <ShieldCheck className="h-[18px] w-[18px]" />
                Admin
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-[15px] text-[#0B1D3A]/60 hidden sm:inline">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-[15px] text-[#0B1D3A]/60 hover:text-[#0B1D3A] transition-colors"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-[15px] font-medium px-7 py-2.5 rounded-full bg-[#0B1D3A] text-white hover:bg-[#112D4E] transition-colors"
              >
                <LogIn className="h-[18px] w-[18px]" />
                Sign In
              </Link>
            )}
          </div>
        ) : (
          <div className="ml-auto" />
        )}
      </div>
    </header>
  );
}

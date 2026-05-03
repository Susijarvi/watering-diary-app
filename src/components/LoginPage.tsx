import { useEffect, useRef, useState } from 'react';
import { loadGoogleIdentityScript } from '../lib/google';

interface Props {
  googleClientId: string | null;
  onCredential: (credential: string) => Promise<void>;
}

export function LoginPage({ googleClientId, onCredential }: Props) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!googleClientId || !buttonRef.current) return;
    let cancelled = false;

    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (resp) => {
            setBusy(true);
            setError(null);
            try {
              await onCredential(resp.credential);
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Kirjautuminen epäonnistui');
            } finally {
              setBusy(false);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'filled_blue',
          size: 'large',
          shape: 'pill',
          text: 'signin_with',
          logo_alignment: 'left',
          locale: 'fi',
          width: 280,
        });
      })
      .catch(() => setError('Google-kirjautumisen lataaminen epäonnistui'));

    return () => {
      cancelled = true;
    };
  }, [googleClientId, onCredential]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-900 to-brand-700 px-6 text-white">
      <div className="text-7xl">🌙</div>
      <h1 className="mt-6 text-3xl font-bold">Kastelupäiväkirja</h1>
      <p className="mt-2 text-center text-brand-100">Kirjaudu Google-tunnuksellasi</p>

      <div className="mt-10 flex min-h-[44px] items-center justify-center">
        {googleClientId ? (
          <div ref={buttonRef} aria-label="Kirjaudu Googlella" />
        ) : (
          <div className="rounded-2xl bg-white/10 px-6 py-4 text-center text-sm text-brand-100 ring-1 ring-white/20">
            Sovellusta ei ole vielä konfiguroitu.<br />
            Pyydä ylläpitäjää lisäämään Google Client ID.
          </div>
        )}
      </div>

      {busy && <p className="mt-4 text-sm text-brand-100">Kirjaudutaan…</p>}
      {error && (
        <div className="mt-6 max-w-sm rounded-xl bg-red-500/20 px-4 py-3 text-center text-sm text-red-100 ring-1 ring-red-500/40">
          {error}
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { X, Trash2, Send, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { sendChatMessage, type ChatMessage } from '@/services/chatbotApi';

const MAX_HISTORY = 4;
const MAX_SUGGESTIONS = 3;

/* Vivier de suggestions par rôle : les questions déjà posées sont retirées et
   remplacées par les suivantes du vivier (miroir des profils backend). */
const SUGGESTIONS_PAR_ROLE: Record<string, string[]> = {
  VISITEUR: [
    'Comment créer un compte ?',
    "Comment fonctionne la liste d'attente ?",
    'Comment vérifier un certificat ?',
    "C'est quoi le principe « premier arrivé, premier servi » ?",
    'Que se passe-t-il si une mission est complète ?',
    'Comment obtenir un certificat après une mission ?',
  ],
  BENEVOLE: [
    'Où en est mon inscription ?',
    'Comment annuler une inscription ?',
    "Que signifie mon rang dans la liste d'attente ?",
    'Comment est calculé mon score de recommandation ?',
    'Comment obtenir mes badges ?',
    "Comment progresser d'un niveau ?",
  ],
  ASSOCIATION: [
    "Comment rédiger la description d'une mission ?",
    'Comment déclarer un renfort ?',
    'Comment délivrer un certificat ?',
    "Quels sont les statuts d'une mission ?",
    'Où voir le taux de remplissage de mes missions ?',
    'Comment clôturer une mission terminée ?',
  ],
  ADMIN: [
    'Comment valider une association ?',
    'Comment modérer une mission signalée ?',
    'Où consulter les statistiques ?',
    'Comment refuser une association ?',
    'Comment rétablir une mission masquée ?',
    'Que contiennent les statistiques globales ?',
  ],
};

function suggestionsPourRole(role?: string): string[] {
  const roleNormalise = role?.replace(/^ROLE_/, '').toUpperCase();
  return SUGGESTIONS_PAR_ROLE[roleNormalise ?? 'VISITEUR'] ?? SUGGESTIONS_PAR_ROLE['VISITEUR']!;
}

/* ─────────────────────────────────────────────
   Mini-renderer Markdown sécurisé (textContent)
   Supporte : **gras**, *italique*, `code`,
   ## titres, listes - et *, tableaux |, \n\n
───────────────────────────────────────────── */
function MarkdownMessage({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let tableBuffer: string[] = [];
  let key = 0;

  function flushTable() {
    if (!tableBuffer.length) return;
    const rows = tableBuffer.map(r =>
      r.split('|').map(c => c.trim()).filter(Boolean)
    );
    // ligne séparatrice (---|---) → on la saute
    const dataRows = rows.filter(r => !r.every(c => /^[-:]+$/.test(c)));
    if (dataRows.length < 2) { tableBuffer = []; return; }
    const [header, ...body] = dataRows;
    elements.push(
      <div key={key++} className="my-2 overflow-x-auto rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-ink text-paper">
            <tr>{header?.map((h, i) => <th key={i} className="px-2.5 py-2 text-left font-bold border-r border-paper/20 last:border-0">{h}</th>)}</tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? 'bg-paper' : 'bg-muted'}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-2.5 py-1.5 border-r border-ink/10 last:border-0">{renderInline(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableBuffer = [];
  }

  function renderInline(text: string): React.ReactNode[] {
    // **gras**, *italique*, `code`
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let last = 0, m: RegExpExecArray | null;
    let idx = 0;
    while ((m = regex.exec(text)) !== null) {
      if (m.index > last) parts.push(<span key={idx++}>{text.slice(last, m.index)}</span>);
      if (m[2]) parts.push(<strong key={idx++} className="font-bold text-ink">{m[2]}</strong>);
      else if (m[3]) parts.push(<em key={idx++} className="italic">{m[3]}</em>);
      else if (m[4]) parts.push(<code key={idx++} className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] border border-ink/20">{m[4]}</code>);
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(<span key={idx++}>{text.slice(last)}</span>);
    return parts;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';

    // Tableau
    if (line.includes('|')) {
      tableBuffer.push(line);
      continue;
    } else {
      flushTable();
    }

    if (!line.trim()) {
      elements.push(<div key={key++} className="h-2" />);
      continue;
    }

    // Titres
    if (line.startsWith('### ')) {
      elements.push(<p key={key++} className="mt-2 mb-0.5 font-display font-black text-sm text-ink">{renderInline(line.slice(4))}</p>);
    } else if (line.startsWith('## ')) {
      elements.push(<p key={key++} className="mt-2 mb-1 font-display font-black text-sm text-ink">{renderInline(line.slice(3))}</p>);
    } else if (line.startsWith('# ')) {
      elements.push(<p key={key++} className="mt-2 mb-1 font-display font-black text-base text-ink">{renderInline(line.slice(2))}</p>);
    }
    // Liste
    else if (/^(\s*[-*•]\s|^\s*\d+\.\s)/.test(line)) {
      const text = line.replace(/^\s*[-*•]\s|^\s*\d+\.\s/, '');
      elements.push(
        <div key={key++} className="flex items-start gap-1.5 leading-relaxed">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-mustard border border-ink" />
          <span className="text-sm">{renderInline(text)}</span>
        </div>
      );
    }
    // Texte normal
    else {
      elements.push(<p key={key++} className="text-sm leading-relaxed">{renderInline(line)}</p>);
    }
  }

  flushTable();
  return <div className="space-y-0.5">{elements}</div>;
}

/* ── Icône personnalisée pour le bouton flottant ── */
function ChatbotIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Corps du robot */}
      <rect x="6" y="10" width="24" height="16" rx="6" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="2"/>
      {/* Yeux */}
      <circle cx="13" cy="18" r="2.5" fill="currentColor"/>
      <circle cx="23" cy="18" r="2.5" fill="currentColor"/>
      {/* Antenne */}
      <line x1="18" y1="10" x2="18" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="18" cy="5" r="1.5" fill="currentColor"/>
      {/* Bouche */}
      <path d="M13 23 Q18 26 23 23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

/* ── 3 points animés "le bot écrit" ── */
function TypingIndicator() {
  return (
    <div className="mr-auto flex max-w-[80%] items-center gap-1 rounded-2xl rounded-tl-sm border border-border bg-muted px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
          style={{ animationDelay: `${i * 0.18}s`, animationDuration: '0.9s' }}
        />
      ))}
    </div>
  );
}

/* ── Avatar assistant ── */
function AssistantAvatar() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-mustard">
      <ChatbotIcon className="h-4 w-4 text-ink" />
    </div>
  );
}

export function Chatbot() {
  const { token, user } = useAuth();
  const roleBrut = user?.role ?? (user?.nomAssociation ? 'ASSOCIATION' : 'VISITEUR');
  const role = roleBrut.replace(/^ROLE_/, '').toUpperCase();
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread]   = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>(() => suggestionsPourRole(role));
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const authScopeRef = useRef(`${role}:${token ?? ''}`);

  /* Connexion / déconnexion (le rôle ou le jeton change) : on repart de zéro */
  useEffect(() => {
    authScopeRef.current = `${role}:${token ?? ''}`;
    setMessages([]);
    setInput('');
    setLoading(false);
    setUnread(0);
    setSuggestions(suggestionsPourRole(role));
  }, [role, token]);

  /* Scroll bas à chaque nouveau message */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  /* Focus input à l'ouverture + reset badge */
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const authScope = authScopeRef.current;
    setInput('');

    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const historyToSend = [...messages, userMsg]
      .slice(-MAX_HISTORY)
      .filter((m) => m.role === 'user' || m.role === 'assistant');

    try {
      const resp = await sendChatMessage(trimmed, historyToSend, token);
      if (authScopeRef.current !== authScope) return;
      const assistantMsg: ChatMessage = { role: 'assistant', content: resp.reply };
      setMessages((prev) => [...prev, assistantMsg]);
      if (!open) setUnread((n) => n + 1);
      setSuggestions(suggestionsPourRole(role));
    } catch (err) {
      if (authScopeRef.current !== authScope) return;
      const is429 = err instanceof Error && err.message === '429';
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: is429
          ? 'Trop de messages envoyés. Attendez un moment avant de réessayer.'
          : "L'assistant est momentanément indisponible. Consultez la FAQ.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      if (authScopeRef.current === authScope) setLoading(false);
    }
  }

  const nomAffiche = user?.prenom || user?.nomAssociation;
  const nomRole = role === 'ASSOCIATION' ? 'votre association' : role === 'BENEVOLE' ? 'bénévole' : role === 'ADMIN' ? 'administrateur' : null;
  const greeting = nomAffiche
    ? `Bonjour, ${nomAffiche} ! Je suis là pour vous aider sur CountMeIn.`
    : nomRole
      ? `Bonjour ! Je suis votre assistant CountMeIn pour ${nomRole}.`
      : "Bonjour ! Je suis l'assistant CountMeIn. Posez-moi votre question.";
  const dernierMessage = messages[messages.length - 1];
  /* Toutes les questions déjà posées (y compris celles cliquées) sont retirées,
     puis remplacées par les questions suivantes du vivier du rôle. */
  const questionsPosees = new Set(
    messages
      .filter((message) => message.role === 'user')
      .map((message) => message.content.trim().toLocaleLowerCase('fr')),
  );
  const suggestionsVisibles = suggestions
    .filter((question) => !questionsPosees.has(question.trim().toLocaleLowerCase('fr')))
    .slice(0, MAX_SUGGESTIONS);

  return (
    <>
      {/* ══════════ Fenêtre de chat ══════════ */}
      {open && (
        <div
          role="dialog"
          aria-label="Assistant CountMeIn"
          className="fixed bottom-24 right-4 z-50 flex w-[22rem] flex-col overflow-hidden rounded-2xl border-2 border-ink bg-paper shadow-[8px_8px_0_var(--color-ink)] sm:w-[26rem]"
          style={{ maxHeight: '540px' }}
        >

          {/* ── Header ── */}
          <div className="flex items-center justify-between gap-2 border-b-2 border-ink bg-ink px-4 py-3">
            <div className="flex items-center gap-2.5">
              {/* Logo animé dans le header */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-mustard bg-mustard/20">
                <ChatbotIcon className="h-5 w-5 text-mustard" />
              </div>
              <div>
                <p className="font-display text-sm font-black leading-tight text-paper">Assistant</p>
                <p className="text-[10px] text-paper/60 leading-none">CountMeIn · En ligne</p>
              </div>
            </div>
            <div className="flex gap-1">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  title="Effacer la conversation"
                  className="rounded-lg p-1.5 text-paper/50 hover:bg-paper/10 hover:text-paper transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                title="Réduire"
                className="rounded-lg p-1.5 text-paper/50 hover:bg-paper/10 hover:text-paper transition-colors"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto space-y-3 px-3 py-4" style={{ minHeight: 0 }}>

            {/* Message de bienvenue avec avatar */}
            <div className="flex items-end gap-2">
              <AssistantAvatar />
              <div className="max-w-[82%] rounded-2xl rounded-bl-sm border border-border bg-muted px-3.5 py-2.5 text-ink">
                <MarkdownMessage content={greeting} />
              </div>
            </div>

            {/* Suggestions initiales adaptées au rôle */}
            {messages.length === 0 && suggestionsVisibles.length > 0 && (
              <div className="ml-9 flex flex-col gap-1.5">
                {suggestionsVisibles.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="press rounded-xl border-2 border-ink bg-paper px-3 py-2 text-left text-xs font-semibold text-ink shadow-[2px_2px_0_var(--color-ink)] hover:bg-mustard/15 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Conversation */}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {msg.role === 'assistant' && <AssistantAvatar />}
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 ${
                    msg.role === 'user'
                      ? 'rounded-br-sm bg-ink text-paper text-sm leading-relaxed'
                      : 'rounded-bl-sm border border-border bg-muted text-ink'
                  }`}
                >
                  {msg.role === 'user'
                    ? <span>{msg.content}</span>
                    : <MarkdownMessage content={msg.content} />
                  }
                </div>
              </div>
            ))}

            {/* Questions suivantes affichées juste après la réponse de l'assistant */}
            {dernierMessage?.role === 'assistant' && !loading && suggestionsVisibles.length > 0 && (
              <div className="ml-9 flex flex-col gap-1.5">
                {suggestionsVisibles.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="press rounded-xl border-2 border-ink bg-paper px-3 py-2 text-left text-xs font-semibold text-ink shadow-[2px_2px_0_var(--color-ink)] hover:bg-mustard/15 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Indicateur "le bot écrit" */}
            {loading && (
              <div className="flex items-end gap-2">
                <AssistantAvatar />
                <TypingIndicator />
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Saisie ── */}
          <div className="border-t-2 border-ink bg-muted/40 px-3 py-3">
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Votre question…"
                maxLength={500}
                disabled={loading}
                className="flex-1 rounded-xl border-2 border-ink bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-foreground shadow-[2px_2px_0_var(--color-ink)] outline-none focus:shadow-[3px_3px_0_var(--color-ink)] transition-shadow disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                title="Envoyer"
                className="press flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-pink text-pink-foreground shadow-[2px_2px_0_var(--color-ink)] hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground/70">
              Réponses générées par IA · Toujours vérifier
            </p>
          </div>
        </div>
      )}

      {/* ══════════ Bouton flottant ══════════ */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant CountMeIn"}
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink bg-ink shadow-[4px_4px_0_var(--color-mustard)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0_var(--color-mustard)] press"
      >
        {open ? (
          <X className="h-7 w-7 text-paper" />
        ) : (
          <>
            <ChatbotIcon className="h-9 w-9 text-mustard" />
            {/* Badge de non-lus */}
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink bg-pink text-[9px] font-black text-pink-foreground">
                {unread}
              </span>
            )}
          </>
        )}
        {/* Halo animé quand fermé */}
        {!open && (
          <span className="absolute inset-0 rounded-full border-2 border-mustard/40 animate-ping" style={{ animationDuration: '2.5s' }} />
        )}
      </button>
    </>
  );
}

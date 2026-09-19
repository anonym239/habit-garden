import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, BookOpen, CalendarDays, Check, ChevronDown, ChevronRight, CircleHelp, Download, Droplets, FileJson, Flame, Leaf, ListChecks, Menu, Moon, MoreHorizontal, Pencil, Plus, RotateCcw, Settings2, Sprout, Sun, Trash2, Upload, X, Sparkles, Star } from 'lucide-react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { checkIsComplete, createId, currentStreak, dateFromKey, exportGarden, isScheduled, loadGarden, localDate, saveGarden, weekKeys, type GardenData, type Habit, type HabitFrequency, type Theme } from '@/lib/habit-storage';
import { ClerkProvider, SignIn, SignUp, Show, useUser, useClerk, useAuth } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { useReviewHabits, useGetRevenue, useSaveGarden, useGetGarden, getGetGardenQueryKey, useGetBillingStatus, getGetBillingStatusQueryKey, setAuthTokenGetter, setBaseUrl } from '@workspace/api-client-react';

const queryClient = new QueryClient();
setBaseUrl(import.meta.env.VITE_API_BASE_URL || null);
const iconOptions = [{ value: 'sprout', icon: Sprout }, { value: 'sun', icon: Sun }, { value: 'droplet', icon: Droplets }, { value: 'book-open', icon: BookOpen }, { value: 'leaf', icon: Leaf }];
const initialForm = { name: '', description: '', color: '#769b82', icon: 'sprout', frequency: 'daily' as HabitFrequency, targetPerWeek: 7 };

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/brand-sprout.svg`,
  },
  variables: {
    colorPrimary: "hsl(153 33% 31%)",
    colorForeground: "hsl(150 18% 18%)",
    colorMutedForeground: "hsl(150 11% 44%)",
    colorDanger: "hsl(6 57% 48%)",
    colorBackground: "hsl(42 38% 98%)",
    colorInput: "hsl(42 34% 96%)",
    colorInputForeground: "hsl(150 18% 18%)",
    colorNeutral: "hsl(39 22% 86%)",
    fontFamily: "'DM Sans', sans-serif",
    borderRadius: "1rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden border border-border shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-display text-2xl font-extrabold tracking-[-.05em] text-foreground",
    headerSubtitle: "text-sm text-muted-foreground",
    socialButtonsBlockButtonText: "font-bold text-sm text-foreground",
    formFieldLabel: "text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1",
    footerActionLink: "font-bold text-primary hover:underline",
    footerActionText: "text-sm text-muted-foreground",
    dividerText: "text-xs font-bold uppercase tracking-wider text-muted-foreground",
    identityPreviewEditButton: "text-primary font-bold text-xs",
    formFieldSuccessText: "text-xs text-primary font-bold",
    alertText: "text-sm",
    logoBox: "mb-2",
    logoImage: "w-12 h-12 rounded-xl object-cover",
    socialButtonsBlockButton: "rounded-xl border border-border bg-background py-2.5 px-4 transition hover:bg-muted hover:border-primary/40",
    formButtonPrimary: "rounded-xl bg-primary py-2.5 px-4 text-sm font-bold text-primary-foreground shadow-[0_7px_20px_hsl(var(--primary)/.15)] hover:shadow-[0_10px_24px_hsl(var(--primary)/.22)] transition hover:-translate-y-0.5",
    formFieldInput: "rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition",
    footerAction: "mt-4 pt-4 border-t border-border/70",
    dividerLine: "bg-border",
    alert: "rounded-xl bg-destructive/10 text-destructive border-destructive/20 p-3",
    otpCodeFieldInput: "rounded-xl border border-input bg-background",
    formFieldRow: "mb-4",
    main: "w-full",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!addListener) return;
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkApiAuthBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);
  return null;
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function App() {
  const [, setLocation] = useLocation();
  return (
    <WouterRouter base={basePath}>
      <ClerkProvider
        publishableKey={clerkPubKey || ""}
        proxyUrl={clerkProxyUrl}
        appearance={clerkAppearance}
        signInUrl={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        localization={{
          signIn: { start: { title: "Welcome back", subtitle: "Sign in to access your garden" } },
          signUp: { start: { title: "Plant your roots", subtitle: "Create an account to sync your garden" } },
        }}
        routerPush={(to) => setLocation(stripBase(to))}
        routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
      >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ClerkQueryClientCacheInvalidator />
            <ClerkApiAuthBridge />
            <Switch>
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              <Route path="/privacy">{() => <LegalPage kind="privacy" />}</Route>
              <Route path="/terms">{() => <LegalPage kind="terms" />}</Route>
              <Route path="/*" component={Shell} />
            </Switch>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </WouterRouter>
  );
}

function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const privacy = kind === 'privacy';
  useEffect(() => {
    document.title = privacy ? 'Privacy | Habit Garden' : 'Terms | Habit Garden';
  }, [privacy]);

  return (
    <main className="min-h-screen bg-background px-5 py-12 text-foreground sm:py-20">
      <article className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary"><Leaf size={18} /> Habit Garden</Link>
        <h1 className="mt-8 font-display text-4xl font-extrabold tracking-tight">
          {privacy ? 'Privacy Policy' : 'Terms of Use'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: September 19, 2026</p>

        {privacy ? (
          <div className="mt-10 space-y-8 text-sm leading-7 text-muted-foreground">
            <section><h2 className="text-xl font-bold text-foreground">Summary</h2><p className="mt-2">Habit Garden is local-first. Habits and check-ins stay on your device when you use the app without an account. Account and cloud processing are used only for optional account, sync, and Pro features. We do not sell personal data or use it for personalized advertising.</p></section>
            <section><h2 className="text-xl font-bold text-foreground">Data we process</h2><p className="mt-2">When you use an account, we process your account identifier and email address for authentication. If you actively use Cloud Sync, habits, notes, and check-ins are stored. For Pro, Apple, Google, and RevenueCat process purchase status, product identifiers, and a pseudonymous customer identifier. Location or photo data is used only when you explicitly select it for the relevant app feature.</p></section>
            <section><h2 className="text-xl font-bold text-foreground">Purposes and legal basis</h2><p className="mt-2">Data is processed to provide requested features and perform our agreement with you. Security and diagnostic data may be processed based on our legitimate interest in providing a secure and stable service.</p></section>
            <section><h2 className="text-xl font-bold text-foreground">Service providers</h2><p className="mt-2">We use Clerk for authentication, Replit for hosting and app infrastructure, RevenueCat for subscription status, and the Apple App Store and Google Play for payments. These providers process data under their own privacy terms and may process data outside your country.</p></section>
            <section><h2 className="text-xl font-bold text-foreground">Retention and deletion</h2><p className="mt-2">You can delete local data in Settings. Signed-in users can also permanently delete their account and cloud-synced Habit Garden data from Settings. Legal retention requirements for payment records remain unaffected.</p></section>
            <section><h2 className="text-xl font-bold text-foreground">Your rights and contact</h2><p className="mt-2">You may request access, correction, deletion, restriction, portability, or object to processing, and you may contact a data protection authority. Use the support contact shown in the relevant app store listing for privacy requests.</p></section>
          </div>
        ) : (
          <div className="mt-10 space-y-8 text-sm leading-7 text-muted-foreground">
            <section><h2 className="text-xl font-bold text-foreground">Scope</h2><p className="mt-2">These terms apply to your use of Habit Garden. You may use the app for private, lawful purposes. The app is not a substitute for medical advice.</p></section>
            <section><h2 className="text-xl font-bold text-foreground">Habit Garden Pro</h2><p className="mt-2">Pro is an automatically renewing monthly subscription. The price and currency are displayed in the App Store or Google Play before purchase. Payment is charged to your store account. The subscription renews unless cancelled at least 24 hours before the current period ends.</p></section>
            <section><h2 className="text-xl font-bold text-foreground">Cancellation and restoration</h2><p className="mt-2">Manage or cancel your subscription in your Apple or Google account subscription settings. Use “Restore Purchases” to restore an existing entitlement. Refunds follow the rules of the relevant store.</p></section>
            <section><h2 className="text-xl font-bold text-foreground">Availability</h2><p className="mt-2">We work to provide a reliable service but do not guarantee uninterrupted availability. Features may change for security, legal, or product reasons. Back up your local data regularly.</p></section>
            <section><h2 className="text-xl font-bold text-foreground">Store terms</h2><p className="mt-2">The Apple App Store or Google Play terms also apply. On iOS, Apple’s standard end-user license agreement applies in addition.</p></section>
            <section><h2 className="text-xl font-bold text-foreground">Contact</h2><p className="mt-2">Use the support contact shown in the relevant app store listing for support or legal requests.</p></section>
          </div>
        )}

        <div className="mt-10 flex gap-5 border-t border-border pt-6 text-sm font-bold">
          <Link href="/privacy" className="text-primary">Privacy</Link>
          <Link href="/terms" className="text-primary">Terms</Link>
        </div>
      </article>
    </main>
  );
}
function Shell() {
  const [data, setData] = useState<GardenData>(() => loadGarden());
  const [location] = useLocation();
  const [mobileNav, setMobileNav] = useState(false);
  const activeHabits = useMemo(() => data.habits.filter((habit) => !habit.archived), [data.habits]);
  const update = (next: GardenData) => { setData(next); saveGarden(next); };
  const toggleCheckIn = (habitId: string, date = localDate()) => {
    const exists = checkIsComplete(data.checkIns, habitId, date);
    update({ ...data, checkIns: [...data.checkIns.filter((item) => !(item.habitId === habitId && item.date === date)), ...(exists ? [] : [{ habitId, date, completed: true }])] });
  };
  const setPreferences = (preferences: GardenData['preferences']) => {
    const next = { ...data, preferences }; update(next);
    document.documentElement.classList.toggle('dark', preferences.theme === 'dark' || (preferences.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  };
  useEffect(() => {
    const theme = data.preferences.theme;
    document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  }, [data.preferences.theme]);
  const nav = [
    { href: '/', label: 'Today', icon: CalendarDays },
    { href: '/habits', label: 'My habits', icon: ListChecks },
    { href: '/insights', label: 'Insights', icon: BarChart3 },
    { href: '/upgrade', label: 'Free & Pro', icon: Star },
  ];
  return <div className="min-h-[100dvh] bg-background">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] flex-col border-r border-sidebar-border bg-sidebar px-5 py-6 text-sidebar-foreground lg:flex">
      <Brand />
      <div className="mt-14 flex-1"><p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-sidebar-foreground/45">Your garden</p><nav className="space-y-1">{nav.map((item) => <NavItem key={item.href} {...item} active={location === item.href} />)}</nav></div>
      <div className="space-y-1"><NavItem href="/settings" label="Settings" icon={Settings2} active={location === '/settings'} /><button data-testid="button-help" className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-sidebar-foreground/60 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"><CircleHelp size={18} />A little help</button><div className="mt-6 flex items-center gap-3 rounded-xl bg-sidebar-accent/70 p-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground"><Sprout size={18} /></div><div className="min-w-0"><p className="truncate text-xs font-semibold">Your local garden</p><p className="text-[11px] text-sidebar-foreground/50">Private by design</p></div></div></div>
    </aside>
    <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-border/70 bg-background/90 px-4 backdrop-blur lg:hidden"><Brand compact /><button data-testid="button-mobile-menu" onClick={() => setMobileNav(!mobileNav)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">{mobileNav ? <X size={20} /> : <Menu size={20} />}</button></header>
    {mobileNav && <div className="fixed inset-0 z-20 bg-foreground/20 backdrop-blur-sm lg:hidden"><div className="mt-[68px] border-b border-border bg-sidebar px-4 py-5 text-sidebar-foreground"><nav className="space-y-1">{nav.concat([{ href: '/settings', label: 'Settings', icon: Settings2 }]).map((item) => <NavItem key={item.href} {...item} active={location === item.href} onClick={() => setMobileNav(false)} />)}</nav></div></div>}
    <main className="lg:pl-[252px]"><div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-7 lg:px-12 lg:py-10"><ErrorBoundary resetKey={location}><Switch>
      <Route path="/"><Dashboard data={data} habits={activeHabits} onCheck={toggleCheckIn} /></Route>
      <Route path="/habits"><HabitsPage data={data} habits={activeHabits} onChange={update} onCheck={toggleCheckIn} /></Route>
      <Route path="/insights"><InsightsPage data={data} habits={activeHabits} /></Route>
      <Route path="/settings"><SettingsPage data={data} onChange={update} onPreferences={setPreferences} /></Route>
      <Route path="/upgrade"><UpgradePage /></Route>
      <Route><NotFound /></Route>
    </Switch></ErrorBoundary></div></main>
  </div>;
}

function Brand({ compact = false }: { compact?: boolean }) { return <Link href="/" data-testid="link-brand" className="flex items-center gap-3 text-sidebar-foreground"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"><Sprout size={20} strokeWidth={2.4} /></span><span className={`font-display text-[17px] font-extrabold tracking-[-.04em] ${compact ? 'text-foreground' : ''}`}>Habit Garden</span></Link>; }
function NavItem({ href, label, icon: Icon, active, onClick }: { href: string; label: string; icon: typeof ListChecks; active: boolean; onClick?: () => void }) { return <Link href={href} onClick={onClick} data-testid={`link-nav-${label.toLowerCase().replace(' ', '-')}`} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${active ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm' : 'text-sidebar-foreground/62 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}><Icon size={18} strokeWidth={active ? 2.3 : 1.9} /><span>{label}</span>{active && <ChevronRight className="ml-auto" size={15} />}</Link>; }

function PageIntro({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) { return <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div>{eyebrow && <p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-primary/70">{eyebrow}</p>}<h1 className="font-display text-3xl font-extrabold tracking-[-.06em] text-foreground sm:text-[42px]">{title}</h1>{description && <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>}</div>{action}</div>; }
function Button({ children, variant = 'primary', onClick, type = 'button', testId, className = '', disabled = false }: { children: ReactNode; variant?: 'primary' | 'quiet' | 'outline' | 'danger'; onClick?: () => void; type?: 'button' | 'submit'; testId?: string; className?: string; disabled?: boolean }) { const styles = { primary: 'bg-primary text-primary-foreground shadow-[0_7px_20px_hsl(var(--primary)/.15)] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_hsl(var(--primary)/.22)]', quiet: 'bg-muted text-foreground hover:bg-secondary', outline: 'border border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted', danger: 'bg-destructive/10 text-destructive hover:bg-destructive/15' }; return <button type={type} onClick={onClick} disabled={disabled} data-testid={testId} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition duration-200 ${styles[variant]} ${className} disabled:opacity-50 disabled:pointer-events-none`}>{children}</button>; }
function Card({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={`rounded-2xl border border-card-border bg-card shadow-[0_12px_35px_hsl(var(--primary)/.045)] ${className}`}>{children}</section>; }
function StatCard({ label, value, caption, icon, accent }: { label: string; value: string; caption: string; icon: ReactNode; accent: string }) { return <Card className="flex items-start justify-between p-5 sm:p-6"><div><p className="text-xs font-bold uppercase tracking-[.11em] text-muted-foreground">{label}</p><p className="mt-3 font-display text-3xl font-extrabold tracking-[-.06em]">{value}</p><p className="mt-1 text-xs text-muted-foreground">{caption}</p></div><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent === 'gold' ? 'bg-accent text-accent-foreground' : accent === 'green' ? 'bg-primary/10 text-primary' : 'bg-[#cf7c78]/15 text-[#a65450]'}`}>{icon}</span></Card>; }

function Dashboard({ data, habits, onCheck }: { data: GardenData; habits: Habit[]; onCheck: (id: string, date?: string) => void }) {
  const today = localDate(); const completed = habits.filter((habit) => checkIsComplete(data.checkIns, habit.id, today)).length; const week = weekKeys(new Date(), data.preferences.weekStartsOn); const totalChecks = week.reduce((sum, day) => sum + habits.filter((h) => isScheduled(h, day) && checkIsComplete(data.checkIns, h.id, day)).length, 0); const possible = week.reduce((sum, day) => sum + habits.filter((h) => isScheduled(h, day)).length, 0); const percentage = possible ? Math.round((totalChecks / possible) * 100) : 0;
  const dateLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  return <div className="page-enter"><PageIntro eyebrow={dateLabel} title="Good morning, grow gently." description={habits.length ? "A small rhythm is still a rhythm. Here’s what’s waiting for you today." : "A garden starts with one small thing. Add a habit when you’re ready."} action={<Link href="/habits" data-testid="link-manage-habits" className="hidden items-center gap-1 text-sm font-bold text-primary hover:underline sm:flex">Manage habits <ChevronRight size={16} /></Link>} />
    <div className="grid gap-4 sm:grid-cols-3"><StatCard label="Today’s tending" value={`${completed}/${habits.length || 0}`} caption={completed ? 'Nice work showing up.' : 'Whenever you’re ready.'} icon={<Sprout size={20} />} accent="gold" /><StatCard label="This week" value={`${percentage}%`} caption={`${totalChecks} little wins so far`} icon={<CalendarDays size={20} />} accent="green" /><StatCard label="Longest current" value={`${Math.max(0, ...habits.map((habit) => currentStreak(habit, data.checkIns)))} days`} caption="Your steady thread" icon={<Flame size={20} />} accent="coral" /></div>
    <div className="mt-7 grid gap-5 xl:grid-cols-[1.45fr_.8fr]"><Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-border/70 px-5 py-5 sm:px-7"><div><h2 className="font-display text-xl font-extrabold tracking-[-.04em]">Today’s garden</h2><p className="mt-1 text-xs text-muted-foreground">One check at a time.</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">{completed === habits.length && habits.length ? 'All tended' : `${habits.length - completed} to go`}</span></div>{habits.length ? <div className="divide-y divide-border/60">{habits.map((habit, index) => <HabitToday key={habit.id} habit={habit} complete={checkIsComplete(data.checkIns, habit.id, today)} streak={currentStreak(habit, data.checkIns)} onCheck={() => onCheck(habit.id)} delay={index * 50} />)}</div> : <EmptyGarden />}</Card><Card className="relative overflow-hidden bg-primary text-primary-foreground"><div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border-[22px] border-primary-foreground/5" /><div className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full border-[18px] border-sidebar-primary/15" /><div className="relative p-6 sm:p-7"><p className="text-xs font-bold uppercase tracking-[.16em] text-sidebar-primary">A gentle note</p><h2 className="mt-8 max-w-[240px] font-display text-2xl font-extrabold leading-tight tracking-[-.05em]">Consistency is quieter than perfection.</h2><p className="mt-4 max-w-[250px] text-sm leading-6 text-primary-foreground/65">Missed a day? You haven’t lost the garden. Begin again with the next small tending.</p><div className="garden-drift mt-8 flex items-end gap-1.5 text-sidebar-primary"><Leaf size={23} /><Leaf size={31} className="-rotate-12" /><Sprout size={42} /></div></div></Card></div>
    <Card className="mt-5 p-5 sm:p-7"><div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-extrabold tracking-[-.03em]">Your week at a glance</h2><p className="mt-1 text-xs text-muted-foreground">Every square is an invitation, not a score.</p></div><Link href="/insights" data-testid="link-week-insights" className="text-xs font-bold text-primary hover:underline">See patterns</Link></div><WeekGrid data={data} habits={habits} /></Card>
  </div>;
}
function HabitToday({ habit, complete, streak, onCheck, delay }: { habit: Habit; complete: boolean; streak: number; onCheck: () => void; delay: number }) { const Icon = iconOptions.find((option) => option.value === habit.icon)?.icon ?? Sprout; return <div className="rise-in flex items-center gap-4 px-5 py-4 sm:px-7" style={{ animationDelay: `${delay}ms` }}><button aria-label={`${complete ? 'Uncheck' : 'Check'} ${habit.name}`} data-testid={`button-check-${habit.id}`} onClick={onCheck} className={`group flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 transition duration-300 ${complete ? 'check-pop border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary hover:bg-primary/5'}`}>{complete ? <Check size={22} strokeWidth={3} /> : <Icon size={20} style={{ color: habit.color }} />}</button><div className="min-w-0 flex-1"><p className={`text-sm font-bold transition ${complete ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{habit.name}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{habit.description || 'A little tending for today.'}</p></div><div className="hidden text-right sm:block"><p className="text-xs font-bold text-foreground">{streak} day{streak === 1 ? '' : 's'}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">streak</p></div><ChevronRight className="text-border" size={18} /></div>; }
function EmptyGarden() { return <div className="flex flex-col items-center px-6 py-14 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-accent text-accent-foreground"><Sprout size={31} /></span><h3 className="mt-5 font-display text-xl font-extrabold">A quiet patch of soil</h3><p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">Add a habit to give your morning somewhere to begin.</p><Link href="/habits" data-testid="link-empty-add" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"><Plus size={16} /> Add your first habit</Link></div>; }
function WeekGrid({ data, habits }: { data: GardenData; habits: Habit[] }) { const days = weekKeys(new Date(), data.preferences.weekStartsOn); return <div className="mt-6 grid grid-cols-7 gap-1.5 sm:gap-3">{days.map((day) => { const count = habits.filter((h) => checkIsComplete(data.checkIns, h.id, day)).length; const scheduled = habits.filter((h) => isScheduled(h, day)).length; const date = dateFromKey(day); return <div key={day} className="text-center"><p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date).slice(0, 2)}</p><div className={`flex aspect-square items-center justify-center rounded-xl border text-xs font-bold transition ${count && count === scheduled ? 'border-primary bg-primary text-primary-foreground' : count ? 'border-primary/25 bg-primary/10 text-primary' : 'border-border bg-muted/60 text-muted-foreground'}`}>{count || '·'}</div><p className="mt-2 text-[10px] text-muted-foreground">{date.getDate()}</p></div>; })}</div>; }

function HabitsPage({ data, habits, onChange, onCheck }: { data: GardenData; habits: Habit[]; onChange: (data: GardenData) => void; onCheck: (id: string, date?: string) => void }) { const [modal, setModal] = useState<'create' | Habit | null>(null); const [showArchived, setShowArchived] = useState(false); const archived = data.habits.filter((h) => h.archived); const submitHabit = (form: typeof initialForm) => { const habit: Habit = { ...form, id: modal && modal !== 'create' ? modal.id : createId(), createdAt: modal && modal !== 'create' ? modal.createdAt : new Date().toISOString(), archived: false }; onChange({ ...data, habits: modal && modal !== 'create' ? data.habits.map((h) => h.id === habit.id ? habit : h) : [...data.habits, habit] }); setModal(null); }; const archive = (id: string) => onChange({ ...data, habits: data.habits.map((h) => h.id === id ? { ...h, archived: true } : h) }); const remove = (id: string) => { if (window.confirm('Delete this habit and its check-ins? This cannot be undone.')) onChange({ ...data, habits: data.habits.filter((h) => h.id !== id), checkIns: data.checkIns.filter((c) => c.habitId !== id) }); }; return <div className="page-enter"><PageIntro eyebrow="Tend to your rhythm" title="My habits" description="Keep the things that make ordinary days feel more like yours." action={<Button onClick={() => setModal('create')} testId="button-add-habit"><Plus size={17} /> New habit</Button>} /><Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-border/70 px-5 py-5 sm:px-7"><div><h2 className="font-display text-xl font-extrabold tracking-[-.04em]">Growing now</h2><p className="mt-1 text-xs text-muted-foreground">{habits.length} active habit{habits.length === 1 ? '' : 's'}</p></div><button data-testid="button-sort-habits" className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground">Recently added <ChevronDown size={14} /></button></div>{habits.length ? <div className="grid divide-y divide-border/60 md:grid-cols-2 md:divide-x md:divide-y-0">{habits.map((habit) => <HabitManage key={habit.id} habit={habit} data={data} onCheck={onCheck} onEdit={() => setModal(habit)} onArchive={() => archive(habit.id)} onDelete={() => remove(habit.id)} />)}</div> : <EmptyHabits onAdd={() => setModal('create')} />}</Card>{archived.length > 0 && <div className="mt-8"><button data-testid="button-toggle-archived" onClick={() => setShowArchived(!showArchived)} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground">{showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />} Archived ({archived.length})</button>{showArchived && <div className="mt-3 grid gap-3 sm:grid-cols-2">{archived.map((habit) => <div key={habit.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 opacity-70"><span className="text-sm font-bold">{habit.name}</span><div className="flex gap-2"><Button variant="quiet" onClick={() => onChange({ ...data, habits: data.habits.map((h) => h.id === habit.id ? { ...h, archived: false } : h) })} testId={`button-restore-${habit.id}`}><RotateCcw size={14} /> Restore</Button><button data-testid={`button-delete-archived-${habit.id}`} onClick={() => remove(habit.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={15} /></button></div></div>)}</div>}</div>} {modal && <HabitModal initial={modal === 'create' ? initialForm : modal} onClose={() => setModal(null)} onSubmit={submitHabit} />}</div>; }
function HabitManage({ habit, data, onCheck, onEdit, onArchive, onDelete }: { habit: Habit; data: GardenData; onCheck: (id: string) => void; onEdit: () => void; onArchive: () => void; onDelete: () => void }) { const complete = checkIsComplete(data.checkIns, habit.id, localDate()); const Icon = iconOptions.find((option) => option.value === habit.icon)?.icon ?? Sprout; return <div className="group flex items-center gap-4 p-5 sm:p-6"><button data-testid={`button-manage-check-${habit.id}`} onClick={() => onCheck(habit.id)} className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 transition ${complete ? 'border-primary bg-primary text-primary-foreground check-pop' : 'border-border bg-muted/50 hover:border-primary'}`}>{complete ? <Check size={22} strokeWidth={3} /> : <Icon style={{ color: habit.color }} size={20} />}</button><div className="min-w-0 flex-1"><p className={`font-bold ${complete ? 'text-muted-foreground line-through' : ''}`}>{habit.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{habit.description || `${habit.frequency === 'daily' ? 'Every day' : `${habit.targetPerWeek} times a week`}`}</p><div className="mt-3 flex items-center gap-3 text-[11px] font-bold text-muted-foreground"><span className="inline-flex items-center gap-1"><Flame size={13} className="text-[#c67554]" /> {currentStreak(habit, data.checkIns)} day streak</span><span className="h-1 w-1 rounded-full bg-border" /><span>{habit.targetPerWeek}x / week</span></div></div><div className="flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"><button data-testid={`button-edit-${habit.id}`} onClick={onEdit} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil size={16} /></button><button data-testid={`button-archive-${habit.id}`} onClick={onArchive} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><MoreHorizontal size={17} /></button><button data-testid={`button-delete-${habit.id}`} onClick={onDelete} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={16} /></button></div></div>; }
function EmptyHabits({ onAdd }: { onAdd: () => void }) { return <div className="flex flex-col items-center px-6 py-16 text-center"><div className="relative flex h-20 w-20 items-center justify-center rounded-[28px] bg-accent/70 text-accent-foreground"><Sprout size={38} /><span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#cf7c78]" /></div><h3 className="mt-6 font-display text-2xl font-extrabold tracking-[-.04em]">Nothing planted yet</h3><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Choose one small thing you’d like to make room for. The best habit is one you can return to.</p><Button className="mt-6" onClick={onAdd} testId="button-empty-new-habit"><Plus size={17} /> Plant a habit</Button></div>; }
function HabitModal({ initial, onClose, onSubmit }: { initial: typeof initialForm | Habit; onClose: () => void; onSubmit: (form: typeof initialForm) => void }) { const [form, setForm] = useState({ ...initial }); const isEdit = 'id' in initial; const update = (key: string, value: string | number) => setForm((old) => ({ ...old, [key]: value })); const submit = (event: FormEvent) => { event.preventDefault(); if (!form.name.trim()) return; onSubmit({ ...form, name: form.name.trim(), targetPerWeek: Number(form.targetPerWeek) }); }; return <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"><div className="max-h-[92dvh] w-full max-w-lg overflow-auto rounded-t-[26px] border border-border bg-card p-6 shadow-2xl sm:rounded-[26px] sm:p-8"><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-primary/70">{isEdit ? 'Refine your rhythm' : 'Plant something new'}</p><h2 className="mt-2 font-display text-2xl font-extrabold tracking-[-.05em]">{isEdit ? 'Edit habit' : 'New habit'}</h2></div><button data-testid="button-close-habit-modal" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button></div><form onSubmit={submit} className="mt-7 space-y-5"><label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Name</span><input autoFocus data-testid="input-habit-name" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Morning pages" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" /></label><label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">A little note <span className="font-normal normal-case">(optional)</span></span><textarea data-testid="input-habit-description" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="What makes this feel good?" rows={2} className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" /></label><div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Cadence</span><select data-testid="select-habit-frequency" value={form.frequency} onChange={(e) => update('frequency', e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"><option value="daily">Every day</option><option value="weekdays">Weekdays</option><option value="custom">A few times a week</option></select></label><label><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Target / week</span><input data-testid="input-habit-target" type="number" min={1} max={7} value={form.targetPerWeek} onChange={(e) => update('targetPerWeek', Number(e.target.value))} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary" /></label></div><div><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Mark it with</span><div className="flex gap-2">{['#d39b5c', '#cf7c78', '#769b82', '#8a83b7', '#d0a94e', '#5c98a7'].map((color) => <button type="button" key={color} data-testid={`button-color-${color.slice(1)}`} onClick={() => update('color', color)} className={`flex h-9 w-9 items-center justify-center rounded-full transition ${form.color === color ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''}`} style={{ backgroundColor: color }}><span className="sr-only">{color}</span>{form.color === color && <Check size={15} className="text-white" />}</button>)}</div></div><div><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Symbol</span><div className="flex gap-2">{iconOptions.map(({ value, icon: Icon }) => <button type="button" key={value} data-testid={`button-icon-${value}`} onClick={() => update('icon', value)} className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${form.icon === value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}><Icon size={18} /></button>)}</div></div><div className="flex gap-3 pt-2"><Button variant="outline" onClick={onClose} className="flex-1" testId="button-cancel-habit">Cancel</Button><Button type="submit" className="flex-1" testId="button-save-habit">{isEdit ? 'Save changes' : 'Plant habit'}</Button></div></form></div></div>; }

function InsightsPage({ data, habits }: { data: GardenData; habits: Habit[] }) { 
  const days = weekKeys(new Date(), data.preferences.weekStartsOn); 
  const total = days.reduce((sum, day) => sum + habits.filter((h) => isScheduled(h, day)).length, 0); 
  const done = days.reduce((sum, day) => sum + habits.filter((h) => checkIsComplete(data.checkIns, h.id, day)).length, 0); 
  const percent = total ? Math.round((done / total) * 100) : 0; 
  const best = habits.reduce((winner, habit) => currentStreak(habit, data.checkIns) > currentStreak(winner, data.checkIns) ? habit : winner, habits[0]); 
  
  const { isSignedIn } = useUser();
  const billing = useGetBillingStatus({
    query: {
      queryKey: getGetBillingStatusQueryKey(),
      enabled: !!isSignedIn,
    },
  });
  const { mutate: reviewHabits, data: reviewData, isPending } = useReviewHabits();

  const handleReview = () => {
    reviewHabits({
      data: {
        habits: habits.map(h => ({ name: h.name, note: h.description, targetPerWeek: h.targetPerWeek })),
        locale: 'en'
      }
    });
  }
  
  return <div className="page-enter"><PageIntro eyebrow="Notice, don’t judge" title="Your patterns" description="A soft look back at the rhythm you’re building. There’s useful information in every kind of day." /><div className="grid gap-4 sm:grid-cols-3"><StatCard label="Weekly completion" value={`${percent}%`} caption={done ? `${done} of ${total} planned` : 'Your first week starts here'} icon={<BarChart3 size={20} />} accent="green" /><StatCard label="Most steady" value={best ? `${currentStreak(best, data.checkIns)} days` : '—'} caption={best?.name ?? 'Plant a habit to see it'} icon={<Flame size={20} />} accent="coral" /><StatCard label="Tended this week" value={String(done)} caption="Small moments count" icon={<Sprout size={20} />} accent="gold" /></div>
  
  <Card className="mt-5 p-5 sm:p-7">
    <div className="flex items-start justify-between">
      <div>
         <h2 className="font-display text-xl font-extrabold tracking-[-.04em]">Gentle AI Reflection</h2>
         <p className="mt-1 text-xs text-muted-foreground">Notice your patterns without judgment.</p>
      </div>
      <Sparkles className="text-primary/60" size={24} />
    </div>
     {isSignedIn ? (
       <div className="mt-5">
          {billing.isLoading ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5 text-center text-sm text-muted-foreground">
              Checking Pro access…
            </div>
          ) : billing.data?.isPro ? !reviewData ? (
           <Button onClick={handleReview} disabled={isPending} testId="btn-ai-review">
             {isPending ? 'Reflecting...' : 'Request a gentle review'}
           </Button>
         ) : (
           <div className="mt-4 rounded-xl bg-primary/5 p-5 text-sm text-foreground shadow-inner">
             <p className="font-bold mb-3 tracking-wide">Thoughts on your rhythm:</p>
             <p className="leading-relaxed">{reviewData.summary}</p>
             {reviewData.suggestions && reviewData.suggestions.length > 0 && (
               <ul className="mt-4 space-y-3">
                 {reviewData.suggestions.map((s, i) => <li key={i} className="flex gap-2.5 items-start"><Leaf size={16} className="mt-0.5 text-primary shrink-0 opacity-80"/><span className="leading-relaxed text-muted-foreground">{s}</span></li>)}
               </ul>
             )}
           </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5 text-center">
              <p className="text-sm font-bold">AI Reflection is a Pro feature.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Unlock Pro to send your habit data for a private AI review.
              </p>
              <Link href="/upgrade" className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
                View Pro
              </Link>
            </div>
          )}
       </div>
    ) : (
       <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 p-5 text-center flex flex-col items-center">
         <p className="text-sm font-bold">Available in your personal account.</p>
         <p className="mt-1 text-xs text-muted-foreground max-w-sm">Sign in to unlock AI reflections on your habits and see supportive suggestions based on your rhythm.</p>
         <Link href="/sign-in" className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">Sign in</Link>
       </div>
    )}
  </Card>

  <div className="mt-7 grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><Card className="p-5 sm:p-7"><h2 className="font-display text-xl font-extrabold tracking-[-.04em]">Seven-day rhythm</h2><p className="mt-1 text-xs text-muted-foreground">How often your garden was visited this week.</p>{habits.length ? <div className="mt-8 space-y-5">{days.map((day) => { const count = habits.filter((h) => checkIsComplete(data.checkIns, h.id, day)).length; const ratio = habits.length ? count / habits.length : 0; return <div key={day} className="flex items-center gap-3"><span className="w-10 text-xs font-bold text-muted-foreground">{new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(dateFromKey(day))}</span><div className="h-3 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${Math.max(ratio * 100, count ? 4 : 0)}%` }} /></div><span className="w-8 text-right text-xs font-bold text-muted-foreground">{count}</span></div>})}</div> : <EmptyInsight />}</Card><Card className="bg-[#efe8d9] p-5 sm:p-7 dark:bg-secondary"><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">A thought to keep</p><div className="mt-12 max-w-sm"><p className="font-display text-2xl font-extrabold leading-tight tracking-[-.05em] text-foreground">“The shape of a life is made of ordinary days.”</p><p className="mt-5 text-sm leading-6 text-muted-foreground">Look for what feels repeatable, not what looks impressive. Your data belongs to you, and so does your pace.</p></div><div className="mt-12 flex gap-2 text-primary"><span className="h-2 w-2 rounded-full bg-primary" /><span className="h-2 w-2 rounded-full bg-primary/40" /><span className="h-2 w-2 rounded-full bg-primary/20" /></div></Card></div><Card className="mt-5 p-5 sm:p-7"><div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-extrabold tracking-[-.04em]">Habit threads</h2><p className="mt-1 text-xs text-muted-foreground">Your current streaks, without a leaderboard.</p></div><Link href="/habits" data-testid="link-insights-habits" className="text-xs font-bold text-primary hover:underline">Tend habits</Link></div>{habits.length ? <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{habits.map((habit) => <div key={habit.id} className="flex items-center gap-3 rounded-xl border border-border bg-background/50 p-4"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: habit.color }} /><span className="min-w-0 flex-1 truncate text-sm font-bold">{habit.name}</span><span className="text-xs font-bold text-muted-foreground">{currentStreak(habit, data.checkIns)}d</span></div>)}</div> : <p className="mt-5 text-sm text-muted-foreground">Nothing to compare yet. Your patterns will appear as you tend the garden.</p>}</Card></div>; }
function EmptyInsight() { return <div className="mt-8 rounded-2xl bg-muted/70 px-5 py-12 text-center"><BarChart3 className="mx-auto text-primary/60" size={30} /><p className="mt-3 text-sm font-bold">Your rhythm will take shape here.</p><p className="mt-1 text-xs text-muted-foreground">Check in a few times and come back.</p></div>; }

function SettingsPage({ data, onChange, onPreferences }: { data: GardenData; onChange: (data: GardenData) => void; onPreferences: (preferences: GardenData['preferences']) => void }) { 
  const fileRef = useRef<HTMLInputElement>(null); 
  const [message, setMessage] = useState(''); 
  const { isSignedIn } = useUser();
  const { signOut } = useClerk();
  const { mutate: saveToCloud, isPending: isSaving } = useSaveGarden();
  const { data: cloudGarden, refetch: getFromCloud, isFetching: isLoadingCloud } = useGetGarden('web', { query: { enabled: false, queryKey: getGetGardenQueryKey('web') } });

  const handleCloudSave = () => {
    saveToCloud({ platform: 'web', data: { data } }, {
      onSuccess: () => setMessage('Garden securely saved to cloud.'),
      onError: () => setMessage('Failed to save to cloud.')
    });
  };

  const handleCloudLoad = async () => {
    const { data: res } = await getFromCloud();
    if (res && res.data && res.data.habits) {
      onChange({ habits: res.data.habits as Habit[], checkIns: (res.data.checkIns as any) || [], preferences: (res.data.preferences as any) || data.preferences });
      setMessage('Garden loaded from cloud.');
    } else {
      setMessage('No cloud backup found.');
    }
  };

  const download = () => { const blob = new Blob([exportGarden(data)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `habit-garden-${localDate()}.json`; link.click(); URL.revokeObjectURL(url); setMessage('Your garden is saved to a JSON file.'); }; 
  const importData = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const parsed = JSON.parse(String(reader.result)) as GardenData; if (!Array.isArray(parsed.habits) || !Array.isArray(parsed.checkIns)) throw new Error(); const next = { habits: parsed.habits, checkIns: parsed.checkIns, preferences: parsed.preferences ?? data.preferences }; onChange(next); setMessage('Garden imported successfully.'); } catch { setMessage('That file does not look like a Habit Garden export.'); } }; reader.readAsText(file); }; 
  
  return <div className="page-enter max-w-3xl"><PageIntro eyebrow="Make it yours" title="Settings" description="Habit Garden keeps your data in this browser. No tracking, no pressure." action={<Link href="/upgrade" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground transition hover:border-primary/40 hover:bg-muted"><Star size={16} /> Free & Pro</Link>} />
  <div className="space-y-5">
  
    <Card className="p-5 sm:p-7">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Flame size={19} /></span>
        <div>
          <h2 className="font-display text-lg font-extrabold">Account & Sync</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Keep your garden backed up safely.</p>
        </div>
      </div>
      <div className="mt-6">
        {isSignedIn ? (
          <div className="space-y-4">
             <p className="text-sm font-bold text-foreground">You are signed in.</p>
             <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" onClick={handleCloudSave} disabled={isSaving} testId="btn-cloud-save">
                  <Upload size={16}/> {isSaving ? 'Saving...' : 'Save to Cloud'}
                </Button>
                <Button variant="quiet" onClick={handleCloudLoad} disabled={isLoadingCloud} testId="btn-cloud-load">
                  <Download size={16}/> {isLoadingCloud ? 'Loading...' : 'Load from Cloud'}
                </Button>
                <Button variant="danger" onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL || '/' })} testId="btn-signout">
                   Log out
                </Button>
             </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 items-start">
             <p className="text-sm text-muted-foreground">Sign in to sync your garden across devices.</p>
             <div className="flex gap-3 mt-2">
               <Link href="/sign-in" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition duration-200 shadow-[0_7px_20px_hsl(var(--primary)/.15)] hover:-translate-y-0.5">Sign In</Link>
               <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground transition duration-200 hover:border-primary/40 hover:bg-muted">Create Account</Link>
             </div>
          </div>
        )}
      </div>
    </Card>

    <Card className="p-5 sm:p-7"><div className="flex items-start gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Sun size={19} /></span><div><h2 className="font-display text-lg font-extrabold">Appearance</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Choose the feeling that meets you each morning.</p></div></div><div className="mt-6 grid gap-2 sm:grid-cols-3">{(['light', 'dark', 'system'] as Theme[]).map((theme) => <button key={theme} data-testid={`button-theme-${theme}`} onClick={() => onPreferences({ ...data.preferences, theme })} className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${data.preferences.theme === theme ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted'}`}><span className="flex items-center gap-2 text-sm font-bold capitalize">{theme === 'dark' ? <Moon size={16} /> : theme === 'system' ? <Settings2 size={16} /> : <Sun size={16} />}{theme}</span>{data.preferences.theme === theme && <Check size={16} />}</button>)}</div></Card><Card className="p-5 sm:p-7"><div className="flex items-start gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><CalendarDays size={19} /></span><div><h2 className="font-display text-lg font-extrabold">Week rhythm</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Choose which day starts your weekly view.</p></div></div><div className="mt-5 flex gap-2">{[{ value: 1, label: 'Monday' }, { value: 0, label: 'Sunday' }].map((day) => <button key={day.value} data-testid={`button-week-start-${day.value}`} onClick={() => onPreferences({ ...data.preferences, weekStartsOn: day.value as 0 | 1 })} className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition ${data.preferences.weekStartsOn === day.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}>{day.label}</button>)}</div></Card><Card className="p-5 sm:p-7"><div className="flex items-start gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d39b5c]/15 text-[#a46c2b]"><FileJson size={19} /></span><div><h2 className="font-display text-lg font-extrabold">Your data</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">A portable copy of everything in your garden. Keep it somewhere safe.</p></div></div><div className="mt-6 flex flex-col gap-3 sm:flex-row"><Button variant="outline" onClick={download} testId="button-export"><Download size={16} /> Export garden</Button><Button variant="quiet" onClick={() => fileRef.current?.click()} testId="button-import"><Upload size={16} /> Import garden</Button><input ref={fileRef} type="file" accept="application/json" onChange={importData} className="hidden" /></div>{message && <p data-testid="status-data-message" className="mt-4 rounded-lg bg-primary/8 px-3 py-2 text-xs font-bold text-primary">{message}</p>}<p className="mt-5 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Leaf size={13} /> Stored locally on this device.</p></Card><Card className="border-destructive/20 bg-destructive/5 p-5 sm:p-7"><h2 className="font-display text-lg font-extrabold">Start over</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Remove all habits and check-ins from this browser. This cannot be undone.</p><Button variant="danger" className="mt-5" onClick={() => { if (window.confirm('Remove your whole garden?')) { const next = { ...data, habits: [], checkIns: [] }; onChange(next); setMessage('Your garden has been cleared.'); } }} testId="button-clear-data"><Trash2 size={16} /> Clear garden</Button></Card></div></div>; }

function UpgradePage() {
  const { data: revenue, isLoading } = useGetRevenue();
  const { isSignedIn } = useUser();
  const billing = useGetBillingStatus({ query: { queryKey: getGetBillingStatusQueryKey(), enabled: !!isSignedIn } });

  return (
    <div className="page-enter max-w-3xl">
      <PageIntro eyebrow="Support the garden" title="Habit Garden Pro" description="Keep the app independent and growing. No ads, no tracking, just a quiet space for your routines." />

      <div className="grid gap-5 md:grid-cols-2">
         <Card className="p-6 md:p-8">
           <h3 className="font-display text-xl font-extrabold">Free</h3>
           <p className="mt-3 text-4xl font-display font-extrabold">$0 <span className="text-sm font-normal text-muted-foreground">/ forever</span></p>
           <ul className="mt-8 space-y-4 text-sm font-medium">
             <li className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary"><Check size={14} strokeWidth={3} /></span> Unlimited habits</li>
             <li className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary"><Check size={14} strokeWidth={3} /></span> Unlimited check-ins</li>
             <li className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary"><Check size={14} strokeWidth={3} /></span> Local-first privacy</li>
             <li className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary"><Check size={14} strokeWidth={3} /></span> Basic insights</li>
           </ul>
         </Card>

         <Card className="relative overflow-hidden border-primary p-6 md:p-8 shadow-[0_12px_45px_hsl(var(--primary)/.1)]">
           <div className="absolute top-0 right-0 rounded-bl-xl bg-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-primary-foreground shadow-sm">Pro</div>
           <h3 className="font-display text-xl font-extrabold text-primary">Pro</h3>
           <p className="mt-3 text-4xl font-display font-extrabold">2,99 € <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
           <ul className="mt-8 space-y-4 text-sm font-medium">
             <li className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary"><Check size={14} strokeWidth={3} /></span> Everything in Free</li>
             <li className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"><Sparkles size={14} strokeWidth={3} /></span> AI Habit Review</li>
             <li className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"><Upload size={14} strokeWidth={3} /></span> Cloud Sync & Backup</li>
             <li className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"><Star size={14} strokeWidth={3} /></span> Support indie development</li>
           </ul>
            <div className="mt-10 space-y-3">
              {!isSignedIn ? (
                 <Link href="/sign-in" className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-[0_8px_25px_hsl(var(--primary)/.28)]">Sign in to check Pro status</Link>
              ) : billing.data?.isPro ? (
                 <p className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-center text-sm font-bold text-primary">Pro is active for your account.</p>
              ) : (
                 <p className="rounded-xl bg-primary p-3 text-center text-sm font-bold text-primary-foreground shadow-[0_8px_25px_hsl(var(--primary)/.28)]">Get Pro in the Android or iPhone app</p>
              )}
               <p className="text-xs leading-5 text-muted-foreground">Payments and subscriptions are managed through Google Play or the Apple App Store. Sign in to the app and website with the same account to use Pro everywhere.</p>
            </div>
         </Card>
      </div>

      <Card className="mt-10 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8">
          <div>
             <h3 className="font-display text-lg font-extrabold tracking-tight">Support & revenue</h3>
             <p className="mt-2 text-sm leading-6 text-muted-foreground max-w-sm">Revenue from Pro is summarized transparently. Payments and payouts are handled exclusively by Google Play and the Apple App Store.</p>
          </div>
          <div className="flex gap-3 sm:gap-4 shrink-0">
            <div className="rounded-2xl bg-muted/50 p-4 text-center min-w-[110px]">
               <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1">Subscribers</p>
               <p className="font-display text-2xl font-extrabold text-foreground">{isLoading ? '...' : revenue?.activeSubscriptions ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-primary/10 p-4 text-center min-w-[110px]">
                <p className="text-[10px] font-bold uppercase text-primary/70 tracking-wider mb-1">Total revenue</p>
                <p className="font-display text-2xl font-extrabold text-primary">{isLoading ? '...' : `$${Number(revenue?.totalRevenueUsd ?? 0).toFixed(2)}`}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function NotFound() { return <div className="flex min-h-[70vh] flex-col items-center justify-center text-center"><span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><Leaf size={30} /></span><h1 className="mt-6 font-display text-3xl font-extrabold">This path is still growing.</h1><p className="mt-2 text-sm text-muted-foreground">The page you’re looking for isn’t in this garden yet.</p><Link href="/" data-testid="link-not-found-home" className="mt-6 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">Return home</Link></div>; }

export default App;

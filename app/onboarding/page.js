"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import AvatarPicker from "@/components/AvatarPicker"
import CharacterPortrait from "@/components/CharacterPortrait"
import { supabase } from "@/lib/supabase"
import { getCharacter } from "@/lib/characters"
import {
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  ONBOARDING_STEPS,
  PLAN_OPTIONS,
  SCHEDULE_OPTIONS,
  TRAINING_STYLES,
  buildHandleSuggestions,
  getStepProgress,
  isPremiumPlan,
  normalizeHandle,
  validateOnboardingStep,
} from "@/lib/onboarding"
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  Edit3,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
  Zap,
  Lock,
} from "lucide-react"

const cardMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.22 },
}

function OptionCard({ selected, title, description, meta, icon, onClick, tone = "emerald" }) {
  const selectedClass = tone === "purple"
    ? "border-purple-300 bg-purple-400/15 shadow-purple-500/10"
    : "border-emerald-300 bg-emerald-400/15 shadow-emerald-500/10"

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left shadow-lg transition active:scale-[0.99] ${
        selected ? selectedClass : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
      }`}
    >
      <span className={`mt-0.5 rounded-xl p-2 ${selected ? "bg-white text-slate-950" : "bg-slate-900 text-slate-300"}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="font-black text-white">{title}</span>
          {selected && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />}
        </span>
        <span className="mt-1 block text-sm font-semibold leading-5 text-slate-300">{description}</span>
        {meta && <span className="mt-3 inline-flex rounded-full bg-slate-950/70 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{meta}</span>}
      </span>
    </button>
  )
}

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    goal: "",
    username: "",
    avatar: "panda",
    trainingStyle: "balanced",
    experienceLevel: "",
    trainingDays: "",
    planChoice: "yearly",
  })
  const [loading, setLoading] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [validationError, setValidationError] = useState("")
  const [acceptTrialTerms, setAcceptTrialTerms] = useState(false)

  const activeCharacter = getCharacter(formData.avatar)
  const activeGoal = GOAL_OPTIONS.find((goal) => goal.id === formData.goal)
  const activeStyle = TRAINING_STYLES.find((style) => style.id === formData.trainingStyle)
  const activePlan = PLAN_OPTIONS.find((plan) => plan.id === formData.planChoice) || PLAN_OPTIONS[0]
  const premiumSelected = isPremiumPlan(formData.planChoice)
  const progressPercent = getStepProgress(step)

  const coachLine = useMemo(() => {
    if (step === 1) return "Your training arc starts here."
    if (step === 2) return "Choose the result you want first. We tailor everything from that."
    if (step === 3) return "Experience calibration keeps progression realistic from day one."
    if (step === 4) return "Your weekly availability drives the structure of your plan."
    if (step === 5) return "Baseline details sharpen your coaching recommendations."
    if (step === 6) return "Starter plan preview generated from your answers."
    if (step === 7) return premiumSelected ? "Premium trial details are transparent before checkout." : "Free mode keeps setup fast."
    if (step === 8) return `${activeCharacter.name} is ready to train with you.`
    if (step === 10) return "Review once, then launch."
    return "A tighter setup creates better daily guidance."
  }, [activeCharacter.name, premiumSelected, step])

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const rawName = user.user_metadata?.full_name || user.user_metadata?.name || "athlete"
      setSuggestions(buildHandleSuggestions(rawName, Math.floor(Math.random() * 89) + 10))
    }
    getUserData()
  }, [])

  const updateForm = (patch) => setFormData((current) => ({ ...current, ...patch }))

  const nextStep = () => {
    setValidationError("")
    const error = validateOnboardingStep(step, formData, { acceptTrialTerms })
    if (error) {
      setValidationError(error)
      return
    }
    setStep((prev) => Math.min(prev + 1, ONBOARDING_STEPS.length))
  }

  const prevStep = () => {
    setValidationError("")
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const handleUsernameStep = async () => {
    setValidationError("")
    const error = validateOnboardingStep(9, formData)
    if (error) {
      setValidationError(error)
      return
    }

    setCheckingUsername(true)
    const { data } = await supabase.from("profiles").select("id").eq("username", formData.username).maybeSingle()
    setCheckingUsername(false)
    if (data) return setValidationError("That handle is already taken.")
    setStep(10)
  }

  const finishSignup = async () => {
    setValidationError("")
    if (premiumSelected && !acceptTrialTerms) {
      setStep(7)
      setValidationError("Confirm the 7-day trial and renewal terms before starting premium.")
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        age: parseInt(formData.age, 10) || null,
        weight: parseFloat(formData.weight) || null,
        goal: formData.goal,
        username: formData.username,
        avatar: formData.avatar,
        tier: "free",
      })

      if (error) {
        setValidationError(error.message)
        setLoading(false)
        return
      }
    }

    if (premiumSelected) {
      const yearlyOfferUrl = process.env.NEXT_PUBLIC_STRIPE_YEARLY_OFFER_TRIAL_URL || ""
      const monthlyTrialUrl = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_TRIAL_URL || ""
      const checkout = formData.planChoice === "yearly" ? yearlyOfferUrl : monthlyTrialUrl
      if (checkout) {
        window.location.href = checkout
        return
      }
    }

    window.location.href = "/dashboard?app=1"
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400 text-sm font-black text-slate-950">BJ</div>
            <div>
              <p className="text-sm font-black leading-tight">BJ Fit</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Setup</p>
            </div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-black text-slate-300">
            {step} / {ONBOARDING_STEPS.length}
          </div>
        </div>

        <section className="grid flex-1 items-center gap-6 py-4 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
          <aside className="relative hidden min-h-[650px] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl shadow-black/40 lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_20%,rgba(52,211,153,0.25),transparent_32%),radial-gradient(circle_at_80%_45%,rgba(56,189,248,0.18),transparent_30%),linear-gradient(160deg,#020617_0%,#0f172a_55%,#111827_100%)]" />
            <div className="relative flex h-full flex-col justify-between p-8">
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-200">Character-first coaching</span>
                <Sparkles className="text-cyan-200" size={22} />
              </div>
              <div className="mx-auto flex w-full max-w-sm flex-1 items-center justify-center">
                <div className="relative w-full">
                  <div className="absolute inset-x-10 bottom-10 h-24 rounded-full bg-black/30 blur-2xl" />
                  <CharacterPortrait characterId={formData.avatar} size={300} className="relative mx-auto border border-white/15 shadow-2xl shadow-black/30" />
                </div>
              </div>
              <div className="grid gap-3">
                <div className="rounded-3xl border border-white/10 bg-black/25 p-5 backdrop-blur">
                  <p className="text-3xl font-black leading-tight">{activeCharacter.name} training arc</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{coachLine}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {["Personal plan", "Daily quests", "AI insights"].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center text-xs font-black text-slate-300">{item}</div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="mx-auto w-full max-w-md lg:max-w-xl">
            <div className="mb-4 lg:hidden">
              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900 p-4">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(52,211,153,0.22),transparent_34%),linear-gradient(135deg,#020617,#111827)]" />
                <div className="relative flex items-center gap-4">
                  <CharacterPortrait characterId={formData.avatar} size={88} className="border border-white/15" />
                  <div className="min-w-0">
                    <p className="text-xl font-black">{activeCharacter.name} setup</p>
                    <p className="mt-1 text-sm font-semibold leading-5 text-slate-300">{coachLine}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <div className="mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                <span>{ONBOARDING_STEPS[step - 1].label}</span>
                <span>{progressPercent}% ready</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-white" />
              </div>
            </div>

            <motion.div layout className="relative rounded-[2rem] border border-white/10 bg-slate-900/95 p-5 shadow-2xl shadow-black/30 sm:p-6">
              {step > 1 && (
                <button type="button" onClick={prevStep} className="absolute left-5 top-5 rounded-full border border-white/10 bg-white/[0.03] p-2 text-slate-400 transition hover:text-white">
                  <ChevronLeft size={18} />
                </button>
              )}

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="welcome" {...cardMotion} className="space-y-6 pt-8 text-center sm:pt-6">
                    <span className="mx-auto inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-200">
                      90-second setup
                    </span>
                    <div>
                      <h1 className="text-4xl font-black leading-none tracking-normal sm:text-5xl">Build your training identity.</h1>
                      <p className="mx-auto mt-4 max-w-sm text-sm font-semibold leading-6 text-slate-300">
                        Pick a character, calibrate your goal, and launch with a plan that starts simple and gets smarter as you log.
                      </p>
                    </div>
                    <div className="grid gap-3 text-left">
                      {[
                        ["Character progression", "Your workouts level up a visible training companion."],
                        ["Goal calibration", "Setup choices tune the way BJ Fit prioritizes guidance."],
                        ["Transparent upgrade", "Premium trial terms are shown before checkout."],
                      ].map(([title, text]) => (
                        <div key={title} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                          <div>
                            <p className="font-black">{title}</p>
                            <p className="mt-1 text-sm font-semibold leading-5 text-slate-400">{text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="goal" {...cardMotion} className="space-y-5 pt-8 sm:pt-6">
                    <div className="text-center">
                      <h2 className="text-3xl font-black">What is your primary goal?</h2>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">We shape your starter plan and coaching around this.</p>
                    </div>
                    <div className="grid gap-3">
                      {GOAL_OPTIONS.map((goal) => (
                        <OptionCard
                          key={goal.id}
                          selected={formData.goal === goal.id}
                          title={goal.title}
                          description={goal.description}
                          meta={goal.signal}
                          icon={<Target size={18} />}
                          onClick={() => updateForm({ goal: goal.id })}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="experience" {...cardMotion} className="space-y-5 pt-8 sm:pt-6">
                    <div className="text-center">
                      <h2 className="text-3xl font-black">How experienced are you?</h2>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">This keeps progression realistic and safe.</p>
                    </div>
                    <div className="grid gap-3">
                      {EXPERIENCE_OPTIONS.map((item) => (
                        <OptionCard
                          key={item.id}
                          selected={formData.experienceLevel === item.id}
                          title={item.title}
                          description={item.description}
                          icon={<Target size={18} />}
                          onClick={() => updateForm({ experienceLevel: item.id })}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div key="schedule" {...cardMotion} className="space-y-5 pt-8 sm:pt-6">
                    <div className="text-center">
                      <h2 className="text-3xl font-black">How many days can you train?</h2>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">We build your weekly structure from this.</p>
                    </div>
                    <div className="grid gap-3">
                      {SCHEDULE_OPTIONS.map((item) => (
                        <OptionCard
                          key={item.id}
                          selected={formData.trainingDays === item.id}
                          title={item.title}
                          description="Consistent schedule beats perfect plans."
                          icon={<Zap size={18} />}
                          onClick={() => updateForm({ trainingDays: item.id })}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div key="baseline" {...cardMotion} className="space-y-5 pt-8 sm:pt-6">
                    <div className="text-center">
                      <h2 className="text-3xl font-black">Set your baseline.</h2>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">Used only to personalize progression context.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Age</span>
                        <input type="number" inputMode="numeric" className="mt-2 w-full bg-transparent text-2xl font-black text-white outline-none placeholder:text-slate-700" placeholder="32" value={formData.age} onChange={(e) => updateForm({ age: e.target.value })} />
                      </label>
                      <label className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Weight</span>
                        <div className="mt-2 flex items-end gap-2">
                          <input type="number" inputMode="decimal" className="min-w-0 flex-1 bg-transparent text-2xl font-black text-white outline-none placeholder:text-slate-700" placeholder="185" value={formData.weight} onChange={(e) => updateForm({ weight: e.target.value })} />
                          <span className="pb-1 text-xs font-black text-slate-500">lb</span>
                        </div>
                      </label>
                    </div>
                  </motion.div>
                )}

                {step === 6 && (
                  <motion.div key="preview" {...cardMotion} className="space-y-5 pt-8 sm:pt-6">
                    <div className="text-center">
                      <h2 className="text-3xl font-black">Your starter plan is ready.</h2>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">Built from your goal, experience, and weekly schedule.</p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                      <div className="flex justify-between text-xs font-black uppercase tracking-wider text-slate-500"><span>Primary focus</span><span>{formData.goal?.replace("_", " ") || "Goal"}</span></div>
                      <div className="mt-3 flex justify-between text-xs font-black uppercase tracking-wider text-slate-500"><span>Weekly target</span><span>{formData.trainingDays || "3"} sessions</span></div>
                      <div className="mt-3 flex justify-between text-xs font-black uppercase tracking-wider text-slate-500"><span>Coach style</span><span>{formData.trainingStyle}</span></div>
                    </div>
                  </motion.div>
                )}

                {step === 7 && (
                  <motion.div key="premium" {...cardMotion} className="space-y-5 pt-8 sm:pt-6">
                    <div className="text-center">
                      <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-purple-300/30 bg-purple-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-purple-200">
                        <Sparkles size={13} /> Optional upgrade
                      </span>
                      <h2 className="mt-4 text-3xl font-black">Start with the right coach layer.</h2>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">Free keeps logging available. Premium adds deeper AI analysis once your workout history starts building.</p>
                    </div>
                    <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs font-bold text-slate-200">
                      <p className="flex items-center gap-2"><BadgeCheck size={14} className="text-emerald-300" /> Personalized progression based on your logged sessions</p>
                      <p className="flex items-center gap-2"><BadgeCheck size={14} className="text-emerald-300" /> Upgrade is optional and does not block free training logs</p>
                      <p className="flex items-center gap-2"><BadgeCheck size={14} className="text-emerald-300" /> Trial terms shown now before any checkout redirect</p>
                    </div>
                    <div className="grid gap-3">
                      {PLAN_OPTIONS.map((plan) => (
                        <OptionCard
                          key={plan.id}
                          selected={formData.planChoice === plan.id}
                          title={plan.title}
                          description={`${plan.price} - ${plan.trial}`}
                          meta={plan.renewal}
                          tone={plan.id === "free" ? "emerald" : "purple"}
                          icon={plan.id === "free" ? <ShieldCheck size={18} /> : <LockKeyhole size={18} />}
                          onClick={() => updateForm({ planChoice: plan.id })}
                        />
                      ))}
                    </div>
                    {premiumSelected && (
                      <label className="flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                        <input type="checkbox" checked={acceptTrialTerms} onChange={(e) => setAcceptTrialTerms(e.target.checked)} className="mt-1 h-4 w-4 accent-emerald-400" />
                        <span className="text-sm font-bold leading-6 text-amber-50">
                          I understand there is no charge today. The 7-day trial starts at checkout, then BJ Fit renews on this plan unless canceled before trial end: {activePlan.renewal}.
                        </span>
                      </label>
                    )}
                  </motion.div>
                )}

                {step === 8 && (
                  <motion.div key="character" {...cardMotion} className="space-y-5 pt-8 sm:pt-6">
                    <div className="text-center">
                      <h2 className="text-3xl font-black">Choose your coach avatar.</h2>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">This becomes the visual center of your profile, shop, and progression loop.</p>
                    </div>
                    <AvatarPicker selectedAvatar={formData.avatar} onSelect={(id) => updateForm({ avatar: id })} />
                  </motion.div>
                )}

                {step === 9 && (
                  <motion.div key="handle" {...cardMotion} className="space-y-5 pt-8 sm:pt-6">
                    <div className="text-center">
                      <h2 className="text-3xl font-black">Claim your handle.</h2>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">Keep it short. It will anchor your profile and future sharing surfaces.</p>
                    </div>
                    <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.04] p-4 focus-within:border-emerald-300">
                      <span className="pr-2 text-xl font-black text-slate-500">@</span>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => updateForm({ username: normalizeHandle(e.target.value) })}
                        placeholder="username"
                        className="w-full bg-transparent text-xl font-black text-white outline-none placeholder:text-slate-700"
                      />
                    </div>
                    {suggestions.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-2">
                        {suggestions.map((suggestion) => (
                          <button key={suggestion} type="button" onClick={() => updateForm({ username: suggestion })} className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-200">
                            @{suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {step === 10 && (
                  <motion.div key="review" {...cardMotion} className="space-y-5 pt-8 sm:pt-6">
                    <div className="text-center">
                      <h2 className="text-3xl font-black">Ready to launch.</h2>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">Your setup is saved first. Premium checkout opens only if you selected a trial plan.</p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                      <div className="flex items-center gap-4">
                        <CharacterPortrait characterId={formData.avatar} size={72} className="border border-white/15" />
                        <div className="min-w-0">
                          <p className="text-xl font-black">@{formData.username}</p>
                          <p className="text-sm font-semibold text-slate-400">{activeCharacter.name} - {activeCharacter.rank}</p>
                        </div>
                      </div>
                      <div className="mt-5 grid gap-3 text-sm">
                        <div className="flex justify-between gap-4"><span className="font-bold text-slate-500">Goal</span><span className="font-black text-white">{activeGoal?.title || "Not set"}</span></div>
                        <div className="flex justify-between gap-4"><span className="font-bold text-slate-500">Style</span><span className="font-black text-white">{activeStyle?.title || "Balanced"}</span></div>
                        <div className="flex justify-between gap-4"><span className="font-bold text-slate-500">Experience</span><span className="font-black text-white">{formData.experienceLevel || "Intermediate"}</span></div>
                        <div className="flex justify-between gap-4"><span className="font-bold text-slate-500">Training days</span><span className="font-black text-white">{formData.trainingDays || "3"}</span></div>
                        <div className="flex justify-between gap-4"><span className="font-bold text-slate-500">Plan</span><span className="font-black text-white">{activePlan.title}</span></div>
                        <div className="flex justify-between gap-4"><span className="font-bold text-slate-500">Trial</span><span className="text-right font-black text-white">{premiumSelected ? "7 days before billing" : "Not selected"}</span></div>
                      </div>
                    </div>
                    <button type="button" onClick={() => setStep(2)} className="flex w-full items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 transition hover:text-white">
                      <Edit3 size={14} /> Edit setup
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {validationError && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-5 flex items-start gap-2 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm font-bold leading-5 text-red-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {validationError}
                </motion.div>
              )}

              <div className="mt-7">
                {step < 9 && step !== 7 && (
                  <button type="button" onClick={nextStep} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 font-black text-slate-950 transition hover:bg-slate-200">
                    Continue <ArrowRight size={18} />
                  </button>
                )}
                {step === 9 && (
                  <button type="button" onClick={handleUsernameStep} disabled={checkingUsername} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 font-black text-slate-950 transition hover:bg-slate-200 disabled:opacity-50">
                    {checkingUsername ? "Checking handle..." : "Continue"} <ArrowRight size={18} />
                  </button>
                )}
                {step === 7 && (
                  <button type="button" onClick={nextStep} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 font-black text-slate-950 transition hover:bg-slate-200">
                    {premiumSelected ? "Review trial setup" : "Continue free"} <ArrowRight size={18} />
                  </button>
                )}
                {step === 10 && (
                  <div className="space-y-3">
                    <button type="button" onClick={finishSignup} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-300 py-4 font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition active:scale-[0.99] disabled:opacity-60">
                      {loading ? "Saving setup..." : <><UserCheck size={20} /> {premiumSelected ? "Start 7-Day Trial" : "Enter BJ Fit"}</>}
                    </button>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                      <p className="flex items-center justify-center gap-2 text-center text-xs font-bold leading-5 text-slate-400">
                        <Lock size={12} /> Secure checkout redirect only if premium is selected.
                      </p>
                      <p className="mt-1 flex items-center justify-center gap-2 text-center text-xs font-bold leading-5 text-slate-500">
                        <CalendarClock size={14} /> {premiumSelected ? `No charge today. ${activePlan.renewal}.` : "No trial or billing selected."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  )
}

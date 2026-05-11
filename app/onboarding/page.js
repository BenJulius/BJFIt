"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import AnimatedPanda from "@/components/AnimatedPanda"
import AvatarPicker from "@/components/AvatarPicker"
import { supabase } from "@/lib/supabase"
import { Sparkles, AlertCircle, ChevronLeft, Edit3, UserCheck } from "lucide-react"

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({ age: "", weight: "", goal: "", username: "", avatar: "panda" })
  const [loading, setLoading] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [validationError, setValidationError] = useState("")
  const [planChoice, setPlanChoice] = useState("yearly")
  const [acceptTrialTerms, setAcceptTrialTerms] = useState(false)
  const [acceptDataTerms, setAcceptDataTerms] = useState(false)
  const stepLabels = ["Character", "Goal", "Stats", "Weight", "Handle", "Training", "Offer", "Agreement", "Review"]
  const progressPercent = Math.round((step / stepLabels.length) * 100)

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const rawName = user.user_metadata?.full_name || user.user_metadata?.name || "athlete"
      const base = rawName.toLowerCase().replace(/[^a-z0-9]/g, "")
      const first = rawName.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "")
      setSuggestions([base, `${base}${Math.floor(Math.random() * 99) + 1}`, `${first}_lifts`])
    }
    getUserData()
  }, [])

  const nextStep = () => {
    setValidationError("")
    if (step === 2 && !formData.goal) return setValidationError("Please select a goal.")
    if (step === 3 && !formData.age) return setValidationError("Age is required.")
    if (step === 4 && !formData.weight) return setValidationError("Weight is required.")
    if (step === 8 && (!acceptDataTerms || !acceptTrialTerms)) return setValidationError("Accept all agreement terms to continue.")
    setStep((prev) => prev + 1)
  }

  const prevStep = () => {
    setValidationError("")
    setStep((prev) => prev - 1)
  }

  const handleUsernameStep = async () => {
    setValidationError("")
    if (!formData.username || formData.username.length < 3) {
      setValidationError("Username must be at least 3 characters.")
      return
    }
    setCheckingUsername(true)
    const { data } = await supabase.from("profiles").select("id").eq("username", formData.username).maybeSingle()
    setCheckingUsername(false)
    if (data) return setValidationError("That handle is already taken.")
    setStep(6)
  }

  const finishSignup = async () => {
    setValidationError("")
    if (!acceptDataTerms || !acceptTrialTerms) return setValidationError("Accept all agreement terms to continue.")
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

    const yearlyOfferUrl = process.env.NEXT_PUBLIC_STRIPE_YEARLY_OFFER_TRIAL_URL || ""
    const monthlyTrialUrl = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_TRIAL_URL || ""
    const checkout = planChoice === "yearly" ? yearlyOfferUrl : monthlyTrialUrl
    if (checkout) {
      window.location.href = checkout
      return
    }

    window.location.href = "/dashboard?app=1"
  }

  return (
    <div className="flex h-screen max-w-md flex-col justify-center bg-slate-950 p-6 mx-auto">
      <div className="flex justify-center mb-8">
        <AnimatedPanda message={step === 7 ? "Big offer unlocked." : step === 9 ? "Ready to launch." : "Let us tune your training."} />
      </div>

      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl relative">
        {step > 1 && <button onClick={prevStep} className="absolute left-6 top-6 text-slate-500 hover:text-white"><ChevronLeft size={20} /></button>}

        <div className="mb-5">
          <div className="mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
            <span>{stepLabels[step - 1]}</span>
            <span>{step} / {stepLabels.length}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && <AvatarPicker selectedAvatar={formData.avatar} onSelect={(id) => setFormData({ ...formData, avatar: id })} />}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white text-center">Primary Goal?</h2>
              <select className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 font-bold text-white" value={formData.goal} onChange={(e) => setFormData({ ...formData, goal: e.target.value })}>
                <option value="">Select a goal</option>
                <option value="build_muscle">Build Muscle</option>
                <option value="lose_fat">Lose Fat</option>
                <option value="endurance">Endurance</option>
              </select>
            </div>
          )}

          {step === 3 && <div className="space-y-4"><h2 className="text-2xl font-bold text-white text-center">How old are you?</h2><input type="number" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-center font-bold text-white" placeholder="Years" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} /></div>}
          {step === 4 && <div className="space-y-4"><h2 className="text-2xl font-bold text-white text-center">Current weight?</h2><input type="number" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-center font-bold text-white" placeholder="lbs" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} /></div>}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white text-center">Claim your Handle</h2>
              <div className="flex items-center rounded-xl border border-slate-700 bg-slate-950 p-3">
                <span className="px-2 font-bold text-slate-400">@</span>
                <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })} placeholder="username" className="w-full bg-transparent font-bold text-white outline-none" />
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((sug, i) => <button key={i} type="button" onClick={() => setFormData({ ...formData, username: sug })} className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400">@{sug}</button>)}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4 text-center">
              <h2 className="text-2xl font-bold text-white">Training Style</h2>
              <div className="grid gap-2 text-left">
                {["Focused", "Balanced", "Aggressive"].map((style) => <div key={style} className="rounded-xl border border-slate-700 bg-slate-950 p-3 font-bold text-white">{style}</div>)}
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-5 text-center">
              <div className="inline-block rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-3"><Sparkles className="h-8 w-8 text-pink-400" /></div>
              <h2 className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-3xl font-black text-transparent">80% Off Yearly During Signup</h2>
              <p className="text-sm font-bold leading-6 text-slate-300">Start with a free 7-day trial, then auto-renews on your chosen plan.</p>
              <button type="button" onClick={() => setPlanChoice("yearly")} className={`w-full rounded-2xl border p-4 text-left ${planChoice === "yearly" ? "border-emerald-400 bg-emerald-400/10" : "border-slate-700 bg-slate-950/60"}`}>
                <p className="text-xs font-black uppercase tracking-wider text-emerald-300">Yearly Signup Offer</p>
                <p className="text-lg font-black text-white">$20 first year</p>
                <p className="text-xs font-bold text-slate-300 line-through">$100/year regular price</p>
              </button>
              <button type="button" onClick={() => setPlanChoice("monthly")} className={`w-full rounded-2xl border p-4 text-left ${planChoice === "monthly" ? "border-cyan-400 bg-cyan-400/10" : "border-slate-700 bg-slate-950/60"}`}>
                <p className="text-xs font-black uppercase tracking-wider text-cyan-300">Monthly</p>
                <p className="text-lg font-black text-white">$10/month after trial</p>
              </button>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white text-center">Agreement</h2>
              <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-4 text-sm font-semibold leading-6 text-slate-200">
                BJ Fit will use your account info for authentication and billing setup. You agree to a 7-day free trial and automatic renewal on your selected plan unless canceled before billing.
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-950 p-3">
                <input type="checkbox" checked={acceptDataTerms} onChange={(e) => setAcceptDataTerms(e.target.checked)} className="mt-1" />
                <span className="text-xs font-bold text-slate-200">I agree to Privacy Policy and Terms.</span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-950 p-3">
                <input type="checkbox" checked={acceptTrialTerms} onChange={(e) => setAcceptTrialTerms(e.target.checked)} className="mt-1" />
                <span className="text-xs font-bold text-slate-200">I agree to trial + automatic recurring billing.</span>
              </label>
            </div>
          )}

          {step === 9 && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold text-white text-center">Ready to start?</h2>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5 space-y-3">
                <div className="flex justify-between"><span className="text-xs font-bold uppercase text-slate-500">Handle</span><span className="font-black text-white">@{formData.username}</span></div>
                <div className="flex justify-between"><span className="text-xs font-bold uppercase text-slate-500">Avatar</span><span className="font-black text-white capitalize">{formData.avatar}</span></div>
                <div className="flex justify-between"><span className="text-xs font-bold uppercase text-slate-500">Plan</span><span className="font-black text-white capitalize">{planChoice}</span></div>
              </div>
              <button onClick={() => setStep(1)} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-white uppercase"><Edit3 size={14} /> Change details</button>
            </div>
          )}
        </AnimatePresence>

        {validationError && <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-red-400"><AlertCircle size={14} /> {validationError}</motion.div>}

        <div className="mt-8">
          {step < 5 && <button onClick={nextStep} className="w-full rounded-xl bg-white py-4 font-black text-black hover:bg-slate-200">Continue</button>}
          {step === 5 && <button onClick={handleUsernameStep} disabled={checkingUsername} className="w-full rounded-xl bg-white py-4 font-black text-black hover:bg-slate-200 disabled:opacity-50">{checkingUsername ? "Verifying..." : "Continue"}</button>}
          {step >= 6 && step <= 8 && <button onClick={nextStep} className="w-full rounded-xl bg-white py-4 font-black text-black hover:bg-slate-200">{step === 8 ? "Review Profile" : "Continue"}</button>}
          {step === 9 && (
            <div className="w-full flex flex-col gap-3">
              <button onClick={finishSignup} disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 py-4 font-black text-white">
                {loading ? "Saving..." : <span className="inline-flex items-center gap-2"><UserCheck size={20} /> Start 7-Day Trial</span>}
              </button>
              <p className="text-center text-xs font-bold text-slate-500">After trial: {planChoice === "yearly" ? "$100/year standard" : "$10/month"} unless canceled.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}


"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, LogOut, Trash2, Edit2, Save, X, Coins } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { differenceInDays } from "date-fns";
import AvatarPicker from "@/components/AvatarPicker";
import LevelCompanion from "@/components/LevelCompanion";
import CharacterPortrait from "@/components/CharacterPortrait";
import { getCharacterLevel, getCharacterShop, MAX_CHARACTER_LEVEL, SHOP_CATEGORIES } from "@/lib/characters";
import { awardAdTokens, getCharacterProgress, getCharacterState, initializeCharacterProgress, purchaseUpgrade } from "@/lib/characterProgress";
import InstallPrompt from "@/components/InstallPrompt";
import NotificationManager from "@/components/NotificationManager";
import { showRewardedAd } from "@/lib/rewardedAds";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [characterState, setCharacterState] = useState(null);
  const [shopMessage, setShopMessage] = useState("");
  const [shopCategory, setShopCategory] = useState("tops");
  const [selectedShopItem, setSelectedShopItem] = useState(null);
  const [showMaxPreview, setShowMaxPreview] = useState(false);
  const [adClaiming, setAdClaiming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);
  
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");
  const [usernamePaymentReady, setUsernamePaymentReady] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ age: "", weight: "", goal: "", avatar: "panda" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setProfile(data);
        setCharacterState(getCharacterState(session.user.id));
        setUsername(data?.username || "");
        setEditForm({
          age: data?.age || "",
          weight: data?.weight || "",
          goal: data?.goal || "",
          avatar: data?.avatar || "panda" // Load their saved avatar
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const saveUsername = async () => {
    setUsernameError("");
    setUsernameSuccess("");
    if (!usernamePaymentReady) {
      setUsernameError("Username changes require a $0.99 unlock first.");
      return;
    }
    
    if (profile.last_username_change) {
      const daysSinceChange = differenceInDays(new Date(), new Date(profile.last_username_change));
      if (daysSinceChange < 30) {
        setUsernameError(`You can change your username again in ${30 - daysSinceChange} days.`);
        return;
      }
    }

    const { data: existing } = await supabase.from('profiles').select('id').eq('username', username).single();
    if (existing && existing.id !== profile.id) {
      setUsernameError("Username already taken.");
      return;
    }

    const isoDate = new Date().toISOString();
    await supabase.from('profiles').update({ 
      username, 
      last_username_change: isoDate 
    }).eq('id', profile.id);
    
    setProfile({ ...profile, last_username_change: isoDate });
    setUsernamePaymentReady(false);
    setUsernameSuccess("Username updated!");
  };

  const unlockUsernameChange = () => {
    const link = process.env.NEXT_PUBLIC_USERNAME_CHANGE_PAYMENT_LINK;
    if (link) {
      window.open(link, "_blank", "noopener,noreferrer");
    }
    setUsernamePaymentReady(true);
    setUsernameSuccess("Unlock activated. You can submit one username change.");
  };

  const saveProfileDetails = async () => {
    setSavingProfile(true);
    await supabase.from('profiles').update({
      age: parseInt(editForm.age) || null,
      weight: parseFloat(editForm.weight) || null,
      goal: editForm.goal,
      avatar: editForm.avatar // Save the new avatar choice to the database!
    }).eq('id', profile.id);
    
    setProfile({ ...profile, age: editForm.age, weight: editForm.weight, goal: editForm.goal, avatar: editForm.avatar });
    if (userId) setCharacterState(initializeCharacterProgress(userId, editForm.avatar));
    setIsEditing(false);
    setSavingProfile(false);
  };

  const handleUpgrade = (upgradeId) => {
    if (!userId) return;
    const result = purchaseUpgrade(userId, profile.avatar || "panda", upgradeId);
    setCharacterState(getCharacterState(userId));
    setShopMessage(result.ok ? "Character updated." : result.reason);
  };

  const handleWatchAd = async () => {
    if (!userId) return;
    if (adClaiming) return;
    setAdClaiming(true);
    setShopMessage("");
    const result = await showRewardedAd({
      onStatus: (text) => setShopMessage(text),
    });
    if (!result.rewarded) {
      setShopMessage(result.reason || "Ad was not completed. No tokens awarded.");
      setAdClaiming(false);
      return;
    }
    const next = awardAdTokens(userId, 3);
    setCharacterState(next);
    setShopMessage("Reward granted: +3 tokens.");
    setAdClaiming(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (confirmed) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from('profiles').delete().eq('id', session.user.id);
        await supabase.auth.signOut();
        window.location.href = "/";
      }
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-950"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;
  if (!profile) return null;
  const activeCharacterId = profile.avatar || "panda";
  const progress = getCharacterProgress(userId, activeCharacterId);
  const shop = getCharacterShop(activeCharacterId);
  const categoryItems = shop[shopCategory] || [];
  const previewItem = selectedShopItem || categoryItems[0];
  const previewEquipped = previewItem ? [...new Set([...progress.equipped, previewItem.id])] : progress.equipped;
  const previewXP = showMaxPreview ? MAX_CHARACTER_LEVEL : progress.xp;
  const previewOwned = previewItem ? progress.owned.includes(previewItem.id) : false;
  const previewEquippedAlready = previewItem ? progress.equipped.includes(previewItem.id) : false;

  return (
    <div className="p-5 pt-10 pb-32 max-w-md mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-200/70 p-1 dark:bg-slate-900/80">
        {[
          { id: "overview", label: "Overview" },
          { id: "locker", label: "Locker" },
          { id: "account", label: "Account" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-2 py-2 text-[11px] font-black uppercase tracking-wider ${
              activeTab === tab.id
                ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4 mb-8">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/5 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <CharacterPortrait characterId={activeCharacterId} size={72} className="border border-white/20 shadow-lg" />
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">Active Character</p>
              <p className="text-lg font-black text-slate-900 dark:text-white capitalize">{activeCharacterId}</p>
              <p className="text-xs font-bold text-slate-500">Locker styles and level form sync in real time.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab("account");
                setIsEditing(true);
              }}
              className="rounded-xl border border-slate-200 bg-slate-100 p-2 text-slate-700 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              title="Edit character"
            >
              <Edit2 size={16} />
            </button>
          </div>
        </div>
        <LevelCompanion
          totalXP={profile.total_xp || 0}
          size="compact"
          characterId={activeCharacterId}
          characterXP={previewXP}
          equipped={progress.equipped}
        />
        
        <div className="w-full space-y-2 mt-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-400/20 dark:bg-amber-400/10">
            <p className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">Premium Username Change</p>
            <p className="mt-1 text-xs font-bold text-amber-700/90 dark:text-amber-200">Each username change costs $0.99.</p>
            <button
              type="button"
              onClick={unlockUsernameChange}
              className="mt-2 rounded-xl bg-amber-400 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-950"
            >
              Unlock Change ($0.99)
            </button>
          </div>
          <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2 focus-within:ring-2 ring-blue-500 transition-all">
            <span className="text-slate-400 font-bold px-3">@</span>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="username"
              className="bg-transparent flex-1 font-bold text-slate-900 dark:text-white outline-none"
            />
            <button onClick={saveUsername} disabled={!usernamePaymentReady} className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white rounded-lg hover:bg-blue-500 hover:text-white transition-colors disabled:opacity-50">
              Save
            </button>
          </div>
          {usernameError && <p className="text-xs font-bold text-red-500 flex items-center gap-1"><AlertCircle size={12}/> {usernameError}</p>}
          {usernameSuccess && <p className="text-xs font-bold text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12}/> {usernameSuccess}</p>}
        </div>
      </motion.div>
      )}

      {activeTab === "locker" && (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-white/5 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Character Shop</h2>
            <p className="text-xs font-bold text-slate-500">One daily exercise log earns one token.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-sm font-black text-amber-600 dark:text-amber-300">
            <Coins size={16} /> {characterState?.tokens || 0}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMaxPreview((v) => !v)}
            className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider ${showMaxPreview ? "bg-cyan-400 text-slate-950" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}
          >
            {showMaxPreview ? "Viewing Max Form" : "Preview Max Form"}
          </button>
          <button
            type="button"
            onClick={handleWatchAd}
            disabled={adClaiming}
            className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-950 disabled:opacity-60"
          >
            {adClaiming ? "Loading Ad..." : "Watch Ad +3 Tokens"}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            ["Owned", progress.owned.length],
            ["Equipped", progress.equipped.length],
            ["Tokens", characterState?.tokens || 0],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
              <p className="text-lg font-black text-slate-900 dark:text-white">{value}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
          <div className="flex justify-between text-xs font-black uppercase tracking-wider text-slate-500">
            <span>{activeCharacterId} level {getCharacterLevel(progress.xp)}</span>
            <span>Max {MAX_CHARACTER_LEVEL}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400" style={{ width: `${Math.round((getCharacterLevel(progress.xp) / MAX_CHARACTER_LEVEL) * 100)}%` }} />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {SHOP_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setShopCategory(category.id);
                setSelectedShopItem(null);
              }}
              className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider ${shopCategory === category.id ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {previewItem && (
          <div className="grid grid-cols-[120px_1fr] gap-4 rounded-3xl bg-slate-50 p-4 dark:bg-slate-950">
            <div className={`relative overflow-hidden rounded-2xl ${previewOwned ? "" : "grayscale"}`}>
              <LevelCompanion
                totalXP={profile.total_xp || 0}
                size="compact"
                characterId={activeCharacterId}
                characterXP={previewXP}
                equipped={previewEquipped}
              />
              {!previewOwned && <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 text-xs font-black uppercase text-white">Locked</div>}
            </div>
            <div className="flex min-w-0 flex-col justify-center">
              <p className="font-black text-slate-900 dark:text-white">{previewItem.name}</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{previewOwned ? "Unlocked style. Equip it to update your character." : "Locked preview. Buy it with daily training tokens."}</p>
              <button
                type="button"
                onClick={() => handleUpgrade(previewItem.id)}
                className="mt-4 rounded-xl bg-emerald-400 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-950 disabled:opacity-50"
                disabled={previewEquippedAlready}
              >
                {previewEquippedAlready ? "Equipped" : previewOwned ? "Equip" : `Buy ${previewItem.cost} Tokens`}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {categoryItems.map((item) => {
            const owned = progress.owned.includes(item.id);
            const equipped = progress.equipped.includes(item.id);
            const tileEquipped = [...new Set([...progress.equipped.filter((id) => id !== item.id), item.id])];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedShopItem(item)}
                className={`relative overflow-hidden rounded-2xl border p-2 ${previewItem?.id === item.id ? "border-emerald-400 bg-emerald-400/10" : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"}`}
              >
                <div className={`relative h-24 overflow-hidden rounded-xl border border-white/10 ${owned ? "" : "grayscale"}`}>
                  <LevelCompanion
                    totalXP={profile.total_xp || 0}
                    size="compact"
                    characterId={activeCharacterId}
                    characterXP={previewXP}
                    equipped={tileEquipped}
                  />
                  <div className="absolute left-1 top-1">
                    <CharacterPortrait characterId={activeCharacterId} size={26} className="border border-white/30 shadow" />
                  </div>
                  {!owned && <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 text-[10px] font-black uppercase text-white">Locked</div>}
                </div>
                <p className="mt-2 truncate text-[10px] font-black uppercase tracking-wider text-slate-500">{equipped ? "Equipped" : item.name}</p>
              </button>
            );
          })}
        </div>
        {shopMessage && <p className="text-xs font-bold text-emerald-500">{shopMessage}</p>}
      </motion.div>
      )}

      {activeTab === "overview" && (
      <div className="mb-6 space-y-3">
        <NotificationManager />
        <InstallPrompt />
      </div>
      )}

      {activeTab === "account" && (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-xl space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Account Details</h2>
          <button onClick={() => setIsEditing(!isEditing)} className="text-blue-500 hover:text-blue-600 transition-colors p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
            {isEditing ? <X size={16} /> : <Edit2 size={16} />}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div key="editing" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              
              {/* Avatar Picker injected right into your edit form */}
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <AvatarPicker 
                  selectedAvatar={editForm.avatar} 
                  onSelect={(id) => setEditForm({...editForm, avatar: id})} 
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Age</label>
                  <input type="number" value={editForm.age} onChange={(e) => setEditForm({...editForm, age: e.target.value})} className="mt-1 w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Weight (lbs)</label>
                  <input type="number" value={editForm.weight} onChange={(e) => setEditForm({...editForm, weight: e.target.value})} className="mt-1 w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Primary Goal</label>
                  <select value={editForm.goal} onChange={(e) => setEditForm({...editForm, goal: e.target.value})} className="mt-1 w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select a goal</option>
                    <option value="build_muscle">Build Muscle</option>
                    <option value="lose_fat">Lose Fat</option>
                    <option value="endurance">Endurance</option>
                  </select>
                </div>
              </div>

              <button onClick={saveProfileDetails} disabled={savingProfile} className="w-full mt-4 bg-blue-500 text-white font-bold p-4 rounded-xl flex justify-center items-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-500/25">
                {savingProfile ? "Saving..." : <><Save size={18} /> Save Changes</>}
              </button>
            </motion.div>
          ) : (
            <motion.div key="viewing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    Stats 
                    <button onClick={() => setShowStats(!showStats)} className="text-blue-500 hover:text-blue-400 p-1">
                      {showStats ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </label>
                  <div className="mt-1 transition-all">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {showStats ? `${profile?.weight || 0} lbs` : "*** lbs"}
                    </p>
                    <p className="text-sm font-medium text-slate-500">
                      {profile?.age ? `${profile.age} years old` : "Age not set"}
                    </p>
                  </div>
                </div>
              <div className="text-right">
                   <p className="text-xs font-bold text-slate-400 uppercase mb-1">Subscription</p>
                   <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${profile?.tier === 'premium' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                     {profile?.tier || 'Free'}
                   </span>
                </div>
              </div>
              {profile?.tier !== "premium" && (
                <div className="rounded-2xl border border-purple-300 bg-purple-50 p-4 dark:border-purple-400/20 dark:bg-purple-500/10">
                  <p className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">Premium Coach</p>
                  <p className="mt-1 text-sm font-bold leading-6 text-purple-950 dark:text-purple-100">Unlock Gemini diagnostics, recovery risk flags, and smarter next-workout priorities from your logs.</p>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Goal</label>
                <p className="text-lg font-bold text-slate-900 dark:text-white capitalize mt-1">
                  {profile?.goal?.replace('_', ' ') || "Not set"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      )}

      {activeTab === "account" && (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-3">
        <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 p-4 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-2xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
          <LogOut size={18} /> Log Out
        </button>
        <button onClick={handleDeleteAccount} className="w-full flex items-center justify-center gap-2 p-4 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 font-bold rounded-2xl hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors">
          <Trash2 size={18} /> Delete Account
        </button>
      </motion.div>
      )}
    </div>
  );
}

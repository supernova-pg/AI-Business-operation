'use client'

import { useState } from 'react'
import { Check, Clipboard, ShieldAlert, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function WhatsappSettings() {
  const [copied, setCopied] = useState(false)
  const webhookUrl = 'https://platform-antigravity.vercel.app/api/webhook/whatsapp'
  const verifyToken = 'antigravity_verification_token_secure_123'

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-3xl space-y-8 font-sans">
      <div className="p-6 rounded-xl border border-slate-900 bg-slate-900/10 space-y-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-cyan-400" />
          <span>Meta Developer Console Credentials</span>
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Configure these webhook values in the Meta App Dashboard under WhatsApp &gt; Configuration to pipe message webhooks to this tenant.
        </p>

        {/* Webhook Callback URI */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400">Callback URL</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="flex-1 h-10 px-3 bg-slate-950 border border-slate-900 rounded-lg text-xs text-slate-400 font-mono focus:outline-none"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => copyToClipboard(webhookUrl)}
              className="h-10 w-10 border-slate-900 hover:bg-slate-900 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {/* Verification Token */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400">Verify Token</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={verifyToken}
              className="flex-1 h-10 px-3 bg-slate-950 border border-slate-900 rounded-lg text-xs text-slate-400 font-mono focus:outline-none"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => copyToClipboard(verifyToken)}
              className="h-10 w-10 border-slate-900 hover:bg-slate-900 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Settings inputs */}
      <form onSubmit={(e) => { e.preventDefault(); alert('Settings saved successfully!'); }} className="p-6 rounded-xl border border-slate-900 bg-slate-900/20 space-y-6">
        <h4 className="font-bold text-sm text-slate-200">Tenant WhatsApp Credentials</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400">WhatsApp Phone Number ID</label>
            <input
              type="text"
              placeholder="e.g. 109283748291039"
              className="w-full h-10 px-3 bg-slate-950 border border-slate-900 hover:border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400">WhatsApp Business Account ID</label>
            <input
              type="text"
              placeholder="e.g. 293810293810923"
              className="w-full h-10 px-3 bg-slate-950 border border-slate-900 hover:border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/40"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400">System User Permanent Access Token</label>
          <input
            type="password"
            placeholder="EAAGy8b37..."
            className="w-full h-10 px-3 bg-slate-950 border border-slate-900 hover:border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/40"
          />
        </div>

        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-500 text-xs">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <p className="leading-relaxed">
            Ensure your access token is a permanent system user token generated in Business Manager with `whatsapp_business_messaging` permissions, otherwise communications will disconnect when tokens expire.
          </p>
        </div>

        <Button type="submit" className="bg-white hover:bg-slate-100 text-black font-semibold rounded-lg px-4 h-9 shadow-md cursor-pointer">
          Save Settings
        </Button>
      </form>
    </div>
  )
}

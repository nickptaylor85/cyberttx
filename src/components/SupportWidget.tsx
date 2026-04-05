"use client";
import { useState } from "react";

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function send() {
    if (!message.trim()) return;
    setSent(true); setMessage("");
    setTimeout(() => { setSent(false); setOpen(false); }, 2000);
  }

  return (
    <>
      <button onClick={() => setOpen(!open)} className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-cyber-600 text-white flex items-center justify-center shadow-lg shadow-cyber-900/50 hover:bg-cyber-500 transition-colors">
        {open ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>}
      </button>
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-80 bg-surface-1 border border-surface-3 rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-cyber-600 p-4"><p className="text-white font-semibold text-sm">ThreatCast Support</p><p className="text-cyber-100 text-xs">We typically respond within 2 hours</p></div>
          <div className="p-4">
            {sent ? <p className="text-green-400 text-sm text-center py-4">Message sent! We&apos;ll get back to you soon.</p> : <>
              <textarea className="cyber-input w-full h-24 resize-none text-sm" placeholder="Describe your issue or question..." value={message} onChange={e => setMessage(e.target.value)} />
              <div className="flex items-center justify-between mt-3">
                <a href="mailto:support@threatcast.io" className="text-gray-500 text-xs hover:text-gray-300">Or email us</a>
                <button onClick={send} disabled={!message.trim()} className="cyber-btn-primary text-xs disabled:opacity-50">Send</button>
              </div>
            </>}
          </div>
        </div>
      )}
    </>
  );
}

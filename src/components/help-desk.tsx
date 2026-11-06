import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, ExternalLink, Headphones, Mail, MapPin, Phone } from 'lucide-react';
import { Button } from './ui/button';
import { HumanVerification } from './human-verification';
import { assistanceSchema, assistanceTypes } from '@/lib/ngo';
import { api, type PublicConfig } from '@/lib/api';

export function HelpDesk() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [reference, setReference] = useState('');
  const [id, setId] = useState('');
  const [humanToken, setHumanToken] = useState('');
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => { setId(crypto.randomUUID()); api<PublicConfig>('/api/config').then(setConfig).catch(() => setMessage('Online requests are unavailable. Please call our team.')); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const parsed = assistanceSchema.safeParse(Object.fromEntries(fields));
    if (!parsed.success) { setMessage(parsed.error.issues[0]?.message || 'Check your details.'); return; }
    setSending(true); setMessage('');
    try {
      const result = await api<{ id: string }>('/api/assistance', { ...parsed.data, id, humanToken, consent: fields.get('consent') === 'on', website: fields.get('website') });
      setReference(result.id); form.reset();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to submit. Please call our team.'); }
    finally { setSending(false); setHumanToken(''); setResetKey(key => key + 1); }
  }
  return <div className="grid md:grid-cols-2 gap-6">
    <div className="space-y-3">
      <a href="tel:+917568896804" className="flex items-center gap-3 bg-heal-soft p-4 rounded-xl"><span className="icon-badge bg-card"><Phone/></span><span><span className="text-xs text-muted-foreground block">NGO helpline</span><strong className="text-base">+91 75688 96804</strong></span><ArrowRight size={17} className="ml-auto"/></a>
      <a href="mailto:houseofdoctorsngo@gmail.com" className="flex items-center gap-3 p-3"><Mail size={20}/><span className="text-xs break-all">houseofdoctorsngo@gmail.com</span></a>
      <a href="https://www.google.com/maps/search/?api=1&query=Udaipur%2C%20Rajasthan%2C%20India" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3"><MapPin size={20}/><span className="text-xs">Udaipur, Rajasthan, India</span><ExternalLink size={14}/></a>
      <a className="inline-flex items-center gap-2 text-xs font-medium p-3" href="https://wa.me/917568896804" target="_blank" rel="noopener noreferrer"><Headphones size={18}/>Contact on WhatsApp<ExternalLink size={12}/></a>
      <p className="text-xs text-muted-foreground px-3 leading-6">This form is not monitored continuously. For urgent help, call directly. Please do not send medical records or identity documents through this form.</p>
    </div>
    <div>{reference ? <div role="status" className="bg-heal-soft p-6 rounded-xl"><CheckCircle2 className="mb-3"/><h3 className="text-xl">Your request has been received.</h3><p className="text-xs mt-3 break-all">Reference: {reference}</p><p className="text-xs leading-6 mt-2">Our team can review your request. This does not confirm an appointment or ambulance dispatch.</p><Button variant="heal" className="mt-4" onClick={() => { setReference(''); setId(crypto.randomUUID()); }}>Send another request</Button></div> :
      <form onSubmit={submit}><h3 className="text-xl mb-4">Request assistance</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <label><span className="field-label">Your name</span><input name="name" autoComplete="name" required minLength={2} maxLength={100} placeholder="Full name" className="field"/></label>
          <label><span className="field-label">Phone number</span><input type="tel" name="phone" autoComplete="tel" required maxLength={14} placeholder="+91 9876543210" className="field"/></label>
          <label><span className="field-label">Village / City</span><input name="village" required minLength={2} maxLength={120} placeholder="Your village or city" className="field"/></label>
          <label><span className="field-label">Type of assistance</span><select name="assistance_type" className="field">{assistanceTypes.map(type => <option key={type}>{type}</option>)}</select></label>
        </div>
        <label className="hidden" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
        <label className="flex items-start gap-2 text-xs leading-5 mt-4"><input name="consent" type="checkbox" required className="mt-1"/><span>I agree that the NGO may store these details and contact me about this request. <a className="underline" href="#privacy">Privacy information</a></span></label>
        <HumanVerification siteKey={config?.turnstileSiteKey || null} action="assistance" onToken={setHumanToken} resetKey={resetKey}/>
        <Button variant="mission" type="submit" disabled={sending || !config?.assistanceEnabled || (!!config.turnstileSiteKey && !humanToken)} className="w-full mt-3">{sending ? 'Sending…' : 'Send assistance request'}<ArrowRight/></Button>
        {config && !config.assistanceEnabled && <p className="text-xs mt-3">Online requests are not enabled yet. Please use the phone or email links.</p>}
        {message && <p className="text-destructive text-xs mt-3" role="alert">{message}</p>}
      </form>}
    </div>
  </div>;
}

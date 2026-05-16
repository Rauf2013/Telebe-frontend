import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  amount: number;
  onPay: () => Promise<void> | void;
}

export default function CardPaymentForm({ amount, onPay }: Props) {
  const { t } = useTranslation();
  const [number, setNumber] = useState('');
  const [cardholder, setCardholder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  // Format card number: groups of 4 separated by spaces (xxxx xxxx xxxx xxxx)
  function formatNumber(v: string) {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
  }
  function formatExpiry(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + '/' + digits.slice(2);
  }

  // Detect card brand based on first digit(s)
  const numClean = number.replace(/\s/g, '');
  const brand: 'visa' | 'mastercard' | 'amex' | 'unknown' =
    numClean.startsWith('4')                     ? 'visa'
    : /^5[1-5]/.test(numClean)                   ? 'mastercard'
    : /^3[47]/.test(numClean)                    ? 'amex'
    :                                              'unknown';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');

    if (numClean.length < 13) { setErr(t('student.card.invalidNumber')); return; }
    if (!cardholder.trim())   { setErr(t('student.card.invalidName')); return; }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) { setErr(t('student.card.invalidExpiry')); return; }
    const [mm, yy] = expiry.split('/').map(Number);
    if (mm < 1 || mm > 12) { setErr(t('student.card.invalidExpiry')); return; }
    const now = new Date(); const cy = now.getFullYear() % 100; const cm = now.getMonth() + 1;
    if (yy < cy || (yy === cy && mm < cm)) { setErr(t('student.card.invalidExpiry')); return; }
    if (cvv.length < 3) { setErr(t('student.card.invalidCvv')); return; }

    setSubmitting(true);
    try {
      // Simülasyon — gerçek payment processor yok
      await new Promise(r => setTimeout(r, 800));
      await onPay();
    } catch {
      setErr(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Card preview */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 rounded-2xl p-6 text-white aspect-[1.586/1] max-w-sm shadow-xl overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-500/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-20 h-20 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col h-full justify-between">
          {/* Chip + brand */}
          <div className="flex items-start justify-between">
            <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-300 to-amber-500 shadow-inner" />
            <CardBrand brand={brand} />
          </div>

          {/* Card number */}
          <div className="font-mono text-xl tracking-[0.18em] mt-4">
            {number.padEnd(19, '•').replace(/(.{4}) ?/g, '$1 ').trim() || '•••• •••• •••• ••••'}
          </div>

          {/* Holder + expiry */}
          <div className="flex items-end justify-between text-xs mt-3">
            <div>
              <p className="text-slate-400 text-[10px] uppercase tracking-widest">{t('student.card.cardholder')}</p>
              <p className="font-medium uppercase mt-0.5">{cardholder || t('student.card.cardholderPlaceholder')}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] uppercase tracking-widest">{t('student.card.expiry')}</p>
              <p className="font-mono mt-0.5">{expiry || 'MM/YY'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        <div>
          <label className="label">{t('student.card.number')}</label>
          <input className="input font-mono tracking-wider" type="text" inputMode="numeric"
                 placeholder="1234 5678 9012 3456"
                 value={number}
                 onChange={e => setNumber(formatNumber(e.target.value))}
                 maxLength={19} required autoComplete="cc-number" />
        </div>

        <div>
          <label className="label">{t('student.card.cardholder')}</label>
          <input className="input uppercase" type="text"
                 placeholder={t('student.card.cardholderPlaceholder')}
                 value={cardholder}
                 onChange={e => setCardholder(e.target.value)}
                 required autoComplete="cc-name" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{t('student.card.expiry')}</label>
            <input className="input font-mono" type="text" inputMode="numeric"
                   placeholder="MM/YY"
                   value={expiry}
                   onChange={e => setExpiry(formatExpiry(e.target.value))}
                   maxLength={5} required autoComplete="cc-exp" />
          </div>
          <div>
            <label className="label">{t('student.card.cvv')}</label>
            <input className="input font-mono" type="text" inputMode="numeric"
                   placeholder="123"
                   value={cvv}
                   onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                   maxLength={4} required autoComplete="cc-csc" />
          </div>
        </div>
      </div>

      {err && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>
      )}

      <button type="submit" disabled={submitting}
              className="btn-primary w-full text-base py-3.5 disabled:opacity-50 disabled:cursor-not-allowed">
        {submitting ? (
          <>
            <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
            {t('student.card.processing')}
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {t('student.card.payButton', { amount })}
          </>
        )}
      </button>

      <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        SSL · 256-bit encrypted
      </p>
    </form>
  );
}

function CardBrand({ brand }: { brand: 'visa' | 'mastercard' | 'amex' | 'unknown' }) {
  if (brand === 'visa') {
    return <div className="text-2xl font-bold italic tracking-tight">VISA</div>;
  }
  if (brand === 'mastercard') {
    return (
      <div className="flex">
        <div className="w-7 h-7 rounded-full bg-red-500 mr-[-10px]" />
        <div className="w-7 h-7 rounded-full bg-amber-400" />
      </div>
    );
  }
  if (brand === 'amex') {
    return <div className="text-sm font-bold uppercase bg-white/20 px-2 py-0.5 rounded">Amex</div>;
  }
  return <div className="w-10 h-7 rounded bg-white/10" />;
}

'use client';
/* oxlint-disable next/no-img-element -- The QR is a generated data URL with explicit dimensions, not a remotely optimized photograph. */
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
export default function VoucherCode({ code }: { code: string }) {
  const [src, setSrc] = useState(''),
    [copied, setCopied] = useState(false);
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(code, {
      width: 220,
      margin: 2,
      color: { dark: '#244e3a', light: '#ffffff' },
    })
      .then((url) => {
        if (active) setSrc(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [code]);
  return (
    <div className="voucher-code">
      {src && (
        <img src={src} width={220} height={220} alt="Scannable voucher code" />
      )}
      <code>{code}</code>
      <Button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? 'Code copied' : 'Copy voucher code'}
      </Button>
    </div>
  );
}

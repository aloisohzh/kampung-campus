/* oxlint-disable next/no-img-element -- Display the supplied brand artwork unchanged at a fixed size. */
export function Brand({ stacked = false }: { stacked?: boolean }) {
  return (
    <span className={`brand-lockup${stacked ? ' brand-stacked' : ''}`}>
      <img
        className="campus-logo"
        src="/brand/kampung-campus.png"
        width={394}
        height={394}
        alt=""
      />
      <span className="brand-name">
        <span>Kampung</span> <span>Campus</span>
      </span>
    </span>
  );
}

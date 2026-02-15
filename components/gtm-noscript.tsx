/**
 * Renders the GTM noscript iframe as a server component.
 * <noscript> is safe for SSR -- it only executes when JS is disabled,
 * so there is no server/client mismatch risk.
 *
 * Previously this was a client component with useEffect mount guard,
 * which caused "removeChild" hydration errors because React saw null
 * on the server but a <noscript> node on the client.
 */
export function GtmNoscript({ gtmId }: { gtmId: string }) {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}

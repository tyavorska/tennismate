type InlineScriptProps = {
  html: string;
};

// Runs during HTML parsing on the server. On the client it is `text/plain` so React
// does not warn about rendering a <script> tag. suppressHydrationWarning covers the type mismatch.
export function InlineScript({ html }: InlineScriptProps) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

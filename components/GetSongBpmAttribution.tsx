/** Required backlink when using the GetSongBPM API — https://getsongbpm.com/api */
export function GetSongBpmAttribution() {
  return (
    <footer
      style={{
        padding: '12px 24px',
        textAlign: 'center',
        fontSize: 12,
        color: 'var(--mo-text-3)',
        borderTop: '1px solid var(--mo-hairline)',
        background: 'var(--mo-bg)',
      }}
    >
      BPM data via{' '}
      <a
        href="https://getsongbpm.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'var(--mo-text-2)', textDecoration: 'underline' }}
      >
        GetSongBPM
      </a>
    </footer>
  );
}

/** Runs before paint so theme matches localStorage (default: dark). */
export function ThemeScript() {
  const script = `(function(){try{var t=localStorage.getItem('mo-dark');if(t==='false')document.documentElement.removeAttribute('data-theme');else document.documentElement.dataset.theme='dark';}catch(e){document.documentElement.dataset.theme='dark';}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

// Renders text as masked words so headings can rise into view line by line.
export default function SplitWords({ text, as: Tag = 'h2', className = '' }) {
  const words = text.split(' ');
  const heading = /^h[1-6]$/.test(Tag);
  const a11y = heading ? { 'aria-label': text } : { 'aria-hidden': true };
  return (
    <Tag className={`split ${className}`} data-reveal="words" {...a11y}>
      {words.map((w, i) => (
        <span className="w" key={i} aria-hidden="true">
          <span className="wi">{w}</span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </Tag>
  );
}

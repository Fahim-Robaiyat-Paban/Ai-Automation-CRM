export default function SectionHeading({ children, className = "" }) {
  return (
    <h2
      className={`text-xs font-medium uppercase tracking-wide text-mute ${className}`}
    >
      {children}
    </h2>
  );
}

export function VoiceWave({ active }) {
  return (
    <div className={`skillora-wave ${active ? "is-active" : ""}`} aria-hidden="true">
      {Array.from({ length: 9 }).map((_, index) => (
        <span key={index} style={{ "--i": index }} />
      ))}
    </div>
  );
}

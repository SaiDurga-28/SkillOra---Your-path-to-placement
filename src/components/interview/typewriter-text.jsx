import { useEffect, useState } from "react";

export function TypewriterText({ text, speed = 18, className = "" }) {
  const [visibleText, setVisibleText] = useState("");

  useEffect(() => {
    setVisibleText("");
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setVisibleText(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, speed);

    return () => window.clearInterval(timer);
  }, [text, speed]);

  return (
    <span className={className}>
      {visibleText}
      {visibleText.length < text.length && <span className="skillora-caret" />}
    </span>
  );
}

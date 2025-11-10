// apps/web/src/components/AudioCue.jsx
import React, { useEffect, useRef } from "react";

/**
 * En osynlig "cue"-markör för en sektion:
 * <AudioCue track="cw_theme_portal" />
 * 
 * Sätter data-audio på sin wrapper. Observern i core/sound/index plockar upp det.
 */
export default function AudioCue({ track, as = "div", className = "", style = {}, children }) {
  const Wrapper = as;
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && track) {
      ref.current.setAttribute("data-audio", track);
    }
  }, [track]);

  return (
    <Wrapper ref={ref} className={className} style={style}>
      {children}
    </Wrapper>
  );
}

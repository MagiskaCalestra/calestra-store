import { useEffect, useRef, useState } from "react";

export function useClickSound(){
  const [enabled,setEnabled] = useState(()=>localStorage.getItem("sound")!=="off");
  const beep = useRef(null);
  useEffect(()=>{
    const a = new Audio("/click.mp3"); // valfri fil, lägg i public/
    a.volume = 0.25;
    beep.current = a;
  },[]);
  useEffect(()=>{ localStorage.setItem("sound", enabled?"on":"off"); },[enabled]);
  const play = ()=>{ if(enabled && beep.current){ try{ beep.current.currentTime=0; beep.current.play(); }catch{} } };
  return { enabled, setEnabled, play };
}

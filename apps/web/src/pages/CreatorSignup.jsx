import React, { useState } from "react";

export default function CreatorSignup() {
  const [name, setName] = useState("");
  const [mail, setMail] = useState("");
  const [user, setUser] = useState("");
  const [done, setDone] = useState(false);

  function submit(e){
    e.preventDefault();
    if(!name || !mail || !user) return;
    // Mock: spara i localStorage tills backend är klar
    const list = JSON.parse(localStorage.getItem("creators") || "[]");
    const id = user.toLowerCase().replace(/[^a-z0-9_-]/g,"");
    list.push({ id, name, mail, created: Date.now() });
    localStorage.setItem("creators", JSON.stringify(list));
    localStorage.setItem("calestra_aff_ref", id);
    setDone(true);
  }

  if (done) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-white">
        <h1 className="text-2xl font-semibold">Välkommen som Calestra Creatorâ„¢</h1>
        <p className="opacity-80 mt-2">Din delningslänk:</p>
        <code className="block mt-2 p-3 rounded-lg bg-black/40 ring-1 ring-white/10">
          {`${window.location.origin}/?ref=${user}`}
        </code>
        <p className="opacity-70 mt-3">Spara länken och dela på sociala medier. Försäljningar spåras automatiskt.</p>
        <a className="inline-block mt-4 px-4 py-2 rounded-xl bg-amber-400 text-black font-medium" href="/member">
          Gå till medlemssidan
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-white">
      <h1 className="text-2xl font-semibold">Bli Calestra Creatorâ„¢</h1>
      <p className="opacity-80 mt-2">Tjäna provision per såld vara. Fyll i dina uppgifter för att få din ref-kod.</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Namn"
               className="w-full h-12 rounded-xl bg-black/30 ring-1 ring-white/10 px-3" />
        <input value={mail} onChange={e=>setMail(e.target.value)} placeholder="E-post"
               className="w-full h-12 rounded-xl bg-black/30 ring-1 ring-white/10 px-3" />
        <input value={user} onChange={e=>setUser(e.target.value)} placeholder="Önskat användarnamn (ref-kod)"
               className="w-full h-12 rounded-xl bg-black/30 ring-1 ring-white/10 px-3" />
        <button className="px-5 py-3 rounded-xl bg-amber-400 text-black font-medium">Skapa konto</button>
      </form>
    </div>
  );
}

import Image from "next/image";

export default function Home() {
  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      background: "linear-gradient(to bottom, #fefcea, #f1daff)", 
      textAlign: "center", 
      padding: "2rem" 
    }}>
      <Image 
        src="/logo.png" 
        alt="Calestra Logotyp" 
        width={250} 
        height={250} 
        style={{ marginBottom: "2rem" }} 
      />
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#222" }}>
        En magisk butik där känsla, själ och stil möts.
      </h1>
      <p style={{ fontSize: "1.1rem", color: "#444", marginTop: "1.5rem", maxWidth: "600px" }}>
        “Se in i dig. Med vad du har på dig. Var skulle det passa in – om det gör?”
      </p>
    </div>
  );
}

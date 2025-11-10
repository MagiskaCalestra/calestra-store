export default function Index(){
  return (
    <div>
      <h2>Calestra Admin</h2>
      <p>Välkommen till kommandocentralen.</p>
      <p className="small">Tips: lås upp lokalt genom att köra <code>localStorage.setItem("cw.admin","1")</code> i devtools.</p>
    </div>
  );
}

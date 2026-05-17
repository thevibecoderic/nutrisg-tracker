export default function MacroPieChart({ pro, carb, fat }) {
  const proKcal  = pro * 4;
  const carbKcal = carb * 4;
  const fatKcal  = fat * 9;
  const total    = proKcal + carbKcal + fatKcal;

  if (total === 0) return null;

  const proP  = proKcal  / total;
  const carbP = carbKcal / total;
  const fatP  = fatKcal  / total;

  // SVG donut chart
  const r = 40, cx = 60, cy = 60, stroke = 14;
  const circ = 2 * Math.PI * r;

  const slices = [
    { pct: proP,  color:"#e05252", label:"Protein",  val:Math.round(proP*100) },
    { pct: carbP, color:"#e09c28", label:"Carbs",    val:Math.round(carbP*100) },
    { pct: fatP,  color:"#5ca3e0", label:"Fat",      val:Math.round(fatP*100) },
  ];

  let offset = 0;

  return (
    <div style={{background:"var(--surface)",borderRadius:16,padding:16,marginBottom:16}}>
      <p style={{margin:"0 0 12px",fontWeight:700,fontSize:14}}>Macro split</p>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <svg width={120} height={120} style={{flexShrink:0}}>
          {slices.map((s,i) => {
            const dash = s.pct * circ;
            const gap  = circ - dash;
            const el = (
              <circle key={i}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset * circ}
                style={{transform:"rotate(-90deg)",transformOrigin:`${cx}px ${cy}px`}}
              />
            );
            offset += s.pct;
            return el;
          })}
          <text x={cx} y={cy-4} textAnchor="middle" style={{fontSize:13,fontWeight:800,fill:"var(--text)"}}>
            {Math.round(total)}
          </text>
          <text x={cx} y={cy+10} textAnchor="middle" style={{fontSize:9,fill:"var(--muted)"}}>
            kcal
          </text>
        </svg>
        <div style={{display:"flex",flexDirection:"column",gap:8,flex:1}}>
          {slices.map(s=>(
            <div key={s.label}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontSize:12,color:"var(--muted)",display:"flex",alignItems:"center",gap:5}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:s.color,display:"inline-block"}}/>
                  {s.label}
                </span>
                <span style={{fontSize:12,fontWeight:700,color:s.color}}>{s.val}%</span>
              </div>
              <div style={{height:4,borderRadius:2,background:"var(--border)"}}>
                <div style={{height:"100%",borderRadius:2,background:s.color,width:`${s.val}%`,transition:"width 0.4s"}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

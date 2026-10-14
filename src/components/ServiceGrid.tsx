import Link from "next/link";
import {ArrowUpRight,RadioTower,BrainCircuit,Network,Code2,Server,Blocks,Headset} from "lucide-react";
import type {ComponentType} from "react";
const icons:Record<string,ComponentType<{size?:number;strokeWidth?:number}>>={"radio-tower":RadioTower,"brain-circuit":BrainCircuit,"network":Network,"code-2":Code2,"server":Server,"blocks":Blocks,"headset":Headset};
type Entry={id:string;slug:string;title:string;eyebrow:string;summary:string;icon:string;imageUrl:string};
export default function ServiceGrid({items}:{items:Entry[]}){return <div className="services-grid">{items.map((s,i)=>{const Icon=icons[s.icon]||Network;return <Link className="service-card" key={s.id} href={`/solutions/${s.slug}`}><div className="card-top"><span className="service-number">0{i+1}</span><span className="service-icon"><Icon size={22} strokeWidth={1.7}/></span></div><div className="service-text"><h3>{s.title}</h3><p>{s.summary}</p></div><div className="service-end"><span>{s.eyebrow}</span><span className="arrow-round"><ArrowUpRight size={19}/></span></div></Link>})}</div>}

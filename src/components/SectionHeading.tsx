import {ArrowUpRight} from "lucide-react";
import Link from "next/link";
export default function SectionHeading({eyebrow,title,description,link,linkText}:{eyebrow:string;title:string;description?:string;link?:string;linkText?:string}){return <div className="section-heading"><div><div className="eyebrow"><span className="small-tick"/>{eyebrow}</div><h2>{title}</h2>{description&&<p>{description}</p>}</div>{link&&<Link className="text-link" href={link}>{linkText||"Explore more"}<ArrowUpRight size={18}/></Link>}</div>}

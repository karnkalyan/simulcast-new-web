import { prisma } from "@/lib/db";
import { fallbackSettings,staticServices,staticProjects } from "@/lib/constants";
export async function getSettings() { try {return await prisma.siteSettings.findUnique({where:{id:"main"}}) ?? fallbackSettings;}catch{return fallbackSettings;} }
export async function getServices(){try {return await prisma.service.findMany({where:{published:true},orderBy:{sortOrder:"asc"}});}catch{return staticServices;} }
export async function getService(slug:string){const services=await getServices();return services.find(x=>x.slug===slug)??null;}
export async function getProjects(){try{return await prisma.project.findMany({where:{published:true},orderBy:[{sortOrder:"asc"},{createdAt:"desc"}]});}catch{return staticProjects;} }
export async function getProject(slug:string){const projects=await getProjects();return projects.find(x=>x.slug===slug)??null;}
export async function getPosts(){try{return await prisma.post.findMany({where:{published:true},orderBy:{publishedAt:"desc"}});}catch{return [];} }
export async function getPost(slug:string){try {return await prisma.post.findFirst({where:{slug,published:true}})}catch{return null} }

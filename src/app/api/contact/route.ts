import {submitInquiry} from "@/server/controllers/lead.controller";
export async function POST(request:Request){return submitInquiry(request)}

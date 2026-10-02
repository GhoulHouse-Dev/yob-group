import { handleQuoteEstimate } from "@/lib/quote/server";
export const runtime = "nodejs";
export async function POST(request: Request) { return handleQuoteEstimate(request); }

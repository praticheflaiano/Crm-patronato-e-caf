import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Free, key-less embeddings using Supabase's built-in gte-small model (384 dims).
// Accepts { input: string } or { input: string[] } and returns { embeddings: number[][] }.
// JWT verification is on, so only authenticated callers reach this function.
//
// gte-small is memory-heavy on the edge runtime: embedding many texts in one
// invocation trips WORKER_RESOURCE_LIMIT. We therefore cap the batch low; the
// app sends small batches and retries per batch.

// @ts-ignore - Supabase global is provided by the edge runtime
const model = new Supabase.ai.Session("gte-small");

const MAX_INPUTS = 8;

Deno.serve(async (req: Request) => {
  try {
    const body = await req.json().catch(() => null);
    const raw = body?.input;
    if (raw === undefined || raw === null) {
      return new Response(JSON.stringify({ error: "Missing 'input'" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const inputs: string[] = Array.isArray(raw) ? raw.map((x) => String(x)) : [String(raw)];
    if (inputs.length === 0) {
      return new Response(JSON.stringify({ error: "Provide at least one input" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (inputs.length > MAX_INPUTS) {
      return new Response(
        JSON.stringify({ error: `Too many inputs (max ${MAX_INPUTS} per call)` }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const embeddings: number[][] = [];
    for (const text of inputs) {
      const trimmed = text.slice(0, 8000); // guard against oversized chunks
      const output = await model.run(trimmed, { mean_pool: true, normalize: true });
      embeddings.push(output as number[]);
    }

    return new Response(JSON.stringify({ embeddings }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "embedding failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

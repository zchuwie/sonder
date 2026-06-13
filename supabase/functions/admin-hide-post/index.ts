import { handleOptions } from "../_shared/cors.ts";
import { moderate } from "../_shared/moderate.ts";
import { error, json } from "../_shared/responses.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  try {
    return json(await moderate(req, "hidden"));
  } catch (cause) {
    return error(
      cause instanceof Error ? cause.message : "Unable to hide post",
      403,
    );
  }
});

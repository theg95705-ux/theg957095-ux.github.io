export const config = {
  runtime: "edge",
};

const TRIPO_API = "https://api.tripo3d.ai/v2/openapi";

export default async function handler(request) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  const apiKey = process.env.TRIPO_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "TRIPO_API_KEY is not configured in Vercel." }),
      {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // GET = check task status
    if (request.method === "GET") {
      const url = new URL(request.url);
      const taskId = url.searchParams.get("task_id");

      if (!taskId) {
        return new Response(
          JSON.stringify({ error: "Missing task_id" }),
          {
            status: 400,
            headers: { ...headers, "Content-Type": "application/json" },
          }
        );
      }

      const response = await fetch(
        `${TRIPO_API}/task/${encodeURIComponent(taskId)}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      const text = await response.text();

      return new Response(text, {
        status: response.status,
        headers: {
          ...headers,
          "Content-Type":
            response.headers.get("content-type") || "application/json",
        },
      });
    }

    // POST = create task
    if (request.method === "POST") {
      const body = await request.json();

      const response = await fetch(`${TRIPO_API}/task`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const text = await response.text();

      return new Response(text, {
        status: response.status,
        headers: {
          ...headers,
          "Content-Type":
            response.headers.get("content-type") || "application/json",
        },
      });
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...headers, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message || "Server error",
      }),
      {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      }
    );
  }
}

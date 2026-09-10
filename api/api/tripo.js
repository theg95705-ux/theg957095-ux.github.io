const TRIPO_API = "https://api.tripo3d.ai/v2/openapi";

export default async function handler(request) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: cors,
    });
  }

  const apiKey = process.env.TRIPO_API_KEY;

  if (!apiKey) {
    return json(
      { error: "TRIPO_API_KEY is missing from Vercel Environment Variables." },
      500,
      cors
    );
  }

  try {
    // =========================
    // GET = poll task
    // =========================
    if (request.method === "GET") {
      const url = new URL(request.url);
      const taskId = url.searchParams.get("task_id");

      if (!taskId) {
        return json({ error: "Missing task_id" }, 400, cors);
      }

      const response = await fetch(
        `${TRIPO_API}/task/${encodeURIComponent(taskId)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      const text = await response.text();

      return new Response(text, {
        status: response.status,
        headers: {
          ...cors,
          "Content-Type":
            response.headers.get("content-type") ||
            "application/json",
        },
      });
    }

    // =========================
    // POST = upload OR create task
    // =========================
    if (request.method === "POST") {
      const contentType =
        request.headers.get("content-type") || "";

      // IMAGE UPLOAD
      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();

        const response = await fetch(
          `${TRIPO_API}/upload/sts`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
            body: formData,
          }
        );

        const text = await response.text();

        return new Response(text, {
          status: response.status,
          headers: {
            ...cors,
            "Content-Type":
              response.headers.get("content-type") ||
              "application/json",
          },
        });
      }

      // CREATE 3D TASK
      const body = await request.json();

      const response = await fetch(
        `${TRIPO_API}/task`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const text = await response.text();

      return new Response(text, {
        status: response.status,
        headers: {
          ...cors,
          "Content-Type":
            response.headers.get("content-type") ||
            "application/json",
        },
      });
    }

    return json(
      { error: `Method ${request.method} not allowed` },
      405,
      cors
    );

  } catch (error) {
    console.error(error);

    return json(
      {
        error: error?.message || "Backend error",
      },
      500,
      cors
    );
  }
}

function json(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json",
    },
  });
}

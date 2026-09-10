export const config = {
  runtime: "edge",
};

const TRIPO_API = "https://api.tripo3d.ai/v2/openapi";

export default async function handler(request) {

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle browser CORS check
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Get the secret API key from Vercel
  const apiKey = process.env.TRIPO_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "TRIPO_API_KEY is not configured in Vercel.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {

    /* ==========================================
       CHECK GENERATION TASK
    ========================================== */

    if (request.method === "GET") {

      const url =
        new URL(request.url);

      const taskId =
        url.searchParams.get(
          "task_id"
        );

      if (!taskId) {

        return new Response(
          JSON.stringify({
            error: "Missing task_id",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type":
                "application/json",
            },
          }
        );

      }

      const response =
        await fetch(
          `${TRIPO_API}/task/${encodeURIComponent(taskId)}`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${apiKey}`,
            },
          }
        );

      const text =
        await response.text();

      return new Response(
        text,
        {
          status:
            response.status,

          headers: {
            ...corsHeaders,

            "Content-Type":
              response.headers.get(
                "content-type"
              ) ||
              "application/json",
          },
        }
      );

    }


    /* ==========================================
       POST REQUEST
    ========================================== */

    if (request.method === "POST") {

      const contentType =
        request.headers.get(
          "content-type"
        ) || "";


      /* ========================================
         IMAGE UPLOAD
      ======================================== */

      if (
        contentType.includes(
          "multipart/form-data"
        )
      ) {

        const formData =
          await request.formData();


        const response =
          await fetch(
            `${TRIPO_API}/upload/sts`,
            {
              method: "POST",

              headers: {
                Authorization:
                  `Bearer ${apiKey}`,
              },

              body:
                formData,
            }
          );


        const text =
          await response.text();


        return new Response(
          text,
          {
            status:
              response.status,

            headers: {
              ...corsHeaders,

              "Content-Type":
                response.headers.get(
                  "content-type"
                ) ||
                "application/json",
            },
          }
        );

      }


      /* ========================================
         CREATE 3D MODEL TASK
      ======================================== */

      const body =
        await request.json();


      const response =
        await fetch(
          `${TRIPO_API}/task`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${apiKey}`,

              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(body),
          }
        );


      const text =
        await response.text();


      return new Response(
        text,
        {
          status:
            response.status,

          headers: {
            ...corsHeaders,

            "Content-Type":
              response.headers.get(
                "content-type"
              ) ||
              "application/json",
          },
        }
      );

    }


    /* ==========================================
       INVALID METHOD
    ========================================== */

    return new Response(
      JSON.stringify({
        error: "Method not allowed",
      }),
      {
        status: 405,

        headers: {
          ...corsHeaders,

          "Content-Type":
            "application/json",
        },
      }
    );

  } catch (error) {

    console.error(
      "Forge3D backend error:",
      error
    );


    return new Response(
      JSON.stringify({
        error:
          error.message ||
          "Backend error",
      }),
      {
        status: 500,

        headers: {
          ...corsHeaders,

          "Content-Type":
            "application/json",
        },
      }
    );

  }

}

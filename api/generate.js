export default async function handler(req, res) {
    // Allow requests from your Forge3D website
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const apiKey = process.env.TRIPO_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: "TRIPO_API_KEY is not configured on the server."
            });
        }

        const contentType =
            req.headers["content-type"] || "";

        if (!contentType.includes("multipart/form-data")) {
            return res.status(400).json({
                error: "Request must be multipart/form-data."
            });
        }

        // Vercel parses the incoming multipart request.
        const formData = await req.formData();

        const image = formData.get("image");
        const prompt = formData.get("prompt");
        const mode = formData.get("mode");

        const quality =
            formData.get("quality") || "Standard";

        const pbr =
            formData.get("pbr") === "true";

        const roblox =
            formData.get("roblox") === "true";

        const lowpoly =
            formData.get("lowpoly") === "true";


        /*
        ==================================================
        IMAGE TO 3D
        ==================================================
        */

        if (mode === "image") {

            if (!image) {
                return res.status(400).json({
                    error: "No image was uploaded."
                });
            }

            /*
            Upload image to Tripo
            */

            const uploadForm =
                new FormData();

            uploadForm.append(
                "file",
                image,
                image.name || "image.png"
            );


            const uploadResponse =
                await fetch(
                    "https://openapi.tripo3d.ai/v3/files",
                    {
                        method: "POST",

                        headers: {
                            "Authorization":
                                `Bearer ${apiKey}`
                        },

                        body: uploadForm
                    }
                );


            const uploadData =
                await uploadResponse.json();


            if (
                !uploadResponse.ok ||
                uploadData.code !== 0
            ) {

                return res.status(500).json({
                    error:
                        uploadData.message ||
                        "Tripo image upload failed."
                });

            }


            const fileToken =
                uploadData.data.file_token;


            /*
            Create image-to-3D task
            */

            const taskBody = {

                input:
                    fileToken,

                model:
                    "P2-20260801",

                texture:
                    true,

                pbr:
                    pbr

            };


            /*
            Quality
            */

            if (quality === "Standard") {

                taskBody.texture_quality =
                    "standard";

            }

            if (quality === "High") {

                taskBody.texture_quality =
                    "detailed";

            }

            if (quality === "Ultra") {

                taskBody.texture_quality =
                    "extreme";

            }


            /*
            Low-poly / Roblox
            */

            if (lowpoly || roblox) {

                taskBody.smart_low_poly =
                    true;

            }


            /*
            Face limit for Roblox mode
            */

            if (roblox) {

                taskBody.face_limit =
                    10000;

            }


            const taskResponse =
                await fetch(
                    "https://openapi.tripo3d.ai/v3/generation/image-to-model",
                    {
                        method: "POST",

                        headers: {

                            "Authorization":
                                `Bearer ${apiKey}`,

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify(
                                taskBody
                            )
                    }
                );


            const taskData =
                await taskResponse.json();


            if (
                !taskResponse.ok ||
                taskData.code !== 0
            ) {

                return res.status(500).json({
                    error:
                        taskData.message ||
                        "Tripo failed to create the task."
                });

            }


            return res.status(200).json({

                task_id:
                    taskData.data.task_id

            });

        }


        /*
        ==================================================
        TEXT TO 3D
        ==================================================
        */

        if (mode === "text") {

            let finalPrompt =
                prompt ||
                "A detailed game-ready 3D object";


            if (roblox) {

                finalPrompt +=
                    ", optimized for Roblox, game-ready, efficient geometry";

            }


            if (lowpoly) {

                finalPrompt +=
                    ", low polygon geometry";

            }


            const taskBody = {

                prompt:
                    finalPrompt,

                model:
                    "P2-20260801",

                texture:
                    true,

                pbr:
                    pbr

            };


            if (quality === "Standard") {

                taskBody.texture_quality =
                    "standard";

            }

            if (quality === "High") {

                taskBody.texture_quality =
                    "detailed";

            }

            if (quality === "Ultra") {

                taskBody.texture_quality =
                    "extreme";

            }


            if (lowpoly || roblox) {

                taskBody.smart_low_poly =
                    true;

            }


            if (roblox) {

                taskBody.face_limit =
                    10000;

            }


            const response =
                await fetch(
                    "https://openapi.tripo3d.ai/v3/generation/text-to-model",
                    {
                        method: "POST",

                        headers: {

                            "Authorization":
                                `Bearer ${apiKey}`,

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify(
                                taskBody
                            )
                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                data.code !== 0
            ) {

                return res.status(500).json({
                    error:
                        data.message ||
                        "Tripo failed to create the task."
                });

            }


            return res.status(200).json({

                task_id:
                    data.data.task_id

            });

        }


        return res.status(400).json({
            error: "Invalid generation mode."
        });


    } catch (error) {

        console.error(error);

        return res.status(500).json({

            error:
                error.message ||
                "Server error."

        });

    }

}

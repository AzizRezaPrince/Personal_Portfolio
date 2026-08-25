import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-static";

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), "data", "portfolio.json");
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, "utf-8");
            const data = JSON.parse(fileContent);
            return NextResponse.json(data, {
                status: 200,
                headers: {
                    "Cache-Control": "no-store, max-age=0",
                },
            });
        }
        return NextResponse.json({ error: "portfolio.json not found" }, { status: 404 });
    } catch (e: unknown) {
        return NextResponse.json(
            { error: e instanceof Error ? e.message : "Failed to read portfolio data" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();

        if (!payload || !payload.hero || !payload.about || !payload.projects) {
            return NextResponse.json(
                { error: "Invalid portfolio data structure provided." },
                { status: 400 }
            );
        }

        const dataToSave = {
            ...payload,
            updatedAt: payload.updatedAt || Date.now(),
        };

        const jsonString = JSON.stringify(dataToSave, null, 2);

        // 1. Write to data/portfolio.json
        const dataPath = path.join(process.cwd(), "data", "portfolio.json");
        const dataDir = path.dirname(dataPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(dataPath, jsonString, "utf-8");

        // 2. Write to public/portfolio.json for static access
        const publicPath = path.join(process.cwd(), "public", "portfolio.json");
        const publicDir = path.dirname(publicPath);
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }
        fs.writeFileSync(publicPath, jsonString, "utf-8");

        return NextResponse.json(
            {
                success: true,
                message: "Successfully saved to data/portfolio.json and public/portfolio.json on disk.",
                updatedAt: dataToSave.updatedAt,
            },
            {
                status: 200,
                headers: {
                    "Cache-Control": "no-store, max-age=0",
                },
            }
        );
    } catch (e: unknown) {
        console.error("Error saving portfolio data to disk:", e);
        return NextResponse.json(
            {
                success: false,
                error: e instanceof Error ? e.message : "Failed to write portfolio data to disk.",
            },
            { status: 500 }
        );
    }
}

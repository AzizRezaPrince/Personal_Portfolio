import { PortfolioData } from "@/app/data/portfolioData";

const GITHUB_TOKEN_KEY = "portfolio_github_pat_token";
const GITHUB_REPO_KEY = "portfolio_github_repo";
const DEFAULT_REPO = "AzizRezaPrince/Personal_Portfolio";

export function getStoredGitHubToken(): string {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(GITHUB_TOKEN_KEY) || "";
}

export function saveStoredGitHubToken(token: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(GITHUB_TOKEN_KEY, token.trim());
}

export function getStoredGitHubRepo(): string {
    if (typeof window === "undefined") return DEFAULT_REPO;
    return localStorage.getItem(GITHUB_REPO_KEY) || DEFAULT_REPO;
}

export function saveStoredGitHubRepo(repo: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(GITHUB_REPO_KEY, repo.trim() || DEFAULT_REPO);
}

// Safely encode Unicode string to base64 for GitHub REST API
function utf8ToBase64(str: string): string {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

interface GitHubCommitResponse {
    success: boolean;
    error?: string;
    commitSha?: string;
    htmlUrl?: string;
}

async function commitFileToGitHub(
    repo: string,
    filePath: string,
    content: string,
    token: string,
    commitMessage: string
): Promise<{ success: boolean; error?: string }> {
    const cleanRepo = repo.replace(/^https:\/\/github\.com\//, "").replace(/\.git$/, "").trim();
    const apiUrl = `https://api.github.com/repos/${cleanRepo}/contents/${filePath}`;

    const headers: Record<string, string> = {
        Authorization: `Bearer ${token.trim()}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
    };

    // 1. Get existing file SHA if file exists on GitHub
    let existingSha: string | undefined = undefined;
    try {
        const getRes = await fetch(apiUrl, {
            method: "GET",
            headers,
            cache: "no-store",
        });
        if (getRes.ok) {
            const fileData = await getRes.json();
            existingSha = fileData.sha;
        }
    } catch {
        // If file does not exist or fetch fails, proceed without SHA
    }

    // 2. Put updated content
    const base64Content = utf8ToBase64(content);
    const bodyPayload: Record<string, unknown> = {
        message: commitMessage,
        content: base64Content,
        branch: "main",
    };

    if (existingSha) {
        bodyPayload.sha = existingSha;
    }

    const putRes = await fetch(apiUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify(bodyPayload),
    });

    if (!putRes.ok) {
        const errJson = await putRes.json().catch(() => ({}));
        const msg =
            (errJson as { message?: string }).message ||
            `GitHub API Error: ${putRes.status} ${putRes.statusText}`;
        return { success: false, error: msg };
    }

    return { success: true };
}

export async function publishPortfolioToGitHub(
    portfolioData: PortfolioData,
    token?: string,
    repo?: string,
    customMessage?: string
): Promise<GitHubCommitResponse> {
    const activeToken = token || getStoredGitHubToken();
    const activeRepo = repo || getStoredGitHubRepo();
    const message =
        customMessage ||
        `Update portfolio content via Admin Panel [${new Date().toLocaleString()}]`;

    if (!activeToken) {
        return {
            success: false,
            error: "GitHub Personal Access Token is required to commit changes.",
        };
    }

    const jsonString = JSON.stringify(portfolioData, null, 2);

    try {
        // 1. Commit to data/portfolio.json
        const res1 = await commitFileToGitHub(
            activeRepo,
            "data/portfolio.json",
            jsonString,
            activeToken,
            message
        );

        if (!res1.success) {
            return res1;
        }

        // 2. Also commit to public/portfolio.json to keep static live build in sync
        const res2 = await commitFileToGitHub(
            activeRepo,
            "public/portfolio.json",
            jsonString,
            activeToken,
            message
        );

        if (!res2.success) {
            return res2;
        }

        const cleanRepo = activeRepo
            .replace(/^https:\/\/github\.com\//, "")
            .replace(/\.git$/, "")
            .trim();

        return {
            success: true,
            htmlUrl: `https://github.com/${cleanRepo}/actions`,
        };
    } catch (e: unknown) {
        return {
            success: false,
            error:
                e instanceof Error
                    ? e.message
                    : "Failed to connect and publish to GitHub API.",
        };
    }
}

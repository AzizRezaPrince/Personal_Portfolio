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

export function clearStoredGitHubToken() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(GITHUB_TOKEN_KEY);
}

// Safely encode Unicode string to base64 for GitHub REST API in safe chunks
function utf8ToBase64(str: string): string {
    const bytes = new TextEncoder().encode(str);
    const CHUNK_SIZE = 8192;
    let binary = "";
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        const chunk = bytes.subarray(i, i + CHUNK_SIZE);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return btoa(binary);
}

interface GitHubCommitResponse {
    success: boolean;
    error?: string;
    commitSha?: string;
    htmlUrl?: string;
}

/**
 * Verify GitHub Token and Repository access
 */
export async function testGitHubConnection(token: string, repo: string): Promise<{ success: boolean; error?: string; repoName?: string }> {
    const cleanRepo = repo.replace(/^https:\/\/github\.com\//, "").replace(/\.git$/, "").trim();
    if (!token.trim()) {
        return { success: false, error: "Please enter a GitHub Personal Access Token." };
    }
    if (!cleanRepo) {
        return { success: false, error: "Please enter a valid repository name (e.g. AzizRezaPrince/Personal_Portfolio)." };
    }

    try {
        const res = await fetch(`https://api.github.com/repos/${cleanRepo}`, {
            headers: {
                Authorization: `Bearer ${token.trim()}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            cache: "no-store",
        });

        if (res.status === 401) {
            return { success: false, error: "Invalid Personal Access Token. Please check your token and ensure it has 'repo' permissions." };
        }
        if (res.status === 404) {
            return { success: false, error: `Repository '${cleanRepo}' not found or token lacks access to it.` };
        }
        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            return { success: false, error: errJson.message || `GitHub API error: ${res.status}` };
        }

        const data = await res.json();
        return { success: true, repoName: data.full_name };
    } catch (e: unknown) {
        return { success: false, error: e instanceof Error ? e.message : "Network error connecting to GitHub." };
    }
}

/**
 * Commit both data/portfolio.json and public/portfolio.json atomically to GitHub main branch
 */
export async function publishPortfolioToGitHub(
    portfolioData: PortfolioData,
    token?: string,
    repo?: string,
    customMessage?: string
): Promise<GitHubCommitResponse> {
    const activeToken = (token || getStoredGitHubToken()).trim();
    const activeRepo = (repo || getStoredGitHubRepo()).trim().replace(/^https:\/\/github\.com\//, "").replace(/\.git$/, "");
    const message =
        customMessage ||
        `Update portfolio content via Admin Portal [${new Date().toLocaleString()}]`;

    if (!activeToken) {
        return {
            success: false,
            error: "GitHub Personal Access Token is required to publish to GitHub.",
        };
    }

    const dataToPublish: PortfolioData = {
        ...portfolioData,
        updatedAt: Date.now(),
    };

    const jsonString = JSON.stringify(dataToPublish, null, 2);

    const headers: Record<string, string> = {
        Authorization: `Bearer ${activeToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
    };

    try {
        // Step 1: Get the latest commit SHA of the main branch
        const refRes = await fetch(
            `https://api.github.com/repos/${activeRepo}/git/ref/heads/main`,
            { headers, cache: "no-store" }
        );

        if (!refRes.ok) {
            const err = await refRes.json().catch(() => ({}));
            if (refRes.status === 401) {
                return { success: false, error: "Invalid GitHub Token. Please verify permissions ('repo' scope)." };
            }
            if (refRes.status === 404) {
                // Try 'master' branch if 'main' doesn't exist
                const masterRes = await fetch(
                    `https://api.github.com/repos/${activeRepo}/git/ref/heads/master`,
                    { headers, cache: "no-store" }
                );
                if (!masterRes.ok) {
                    return { success: false, error: err.message || `Branch 'main' not found on repository ${activeRepo}.` };
                }
            } else {
                return { success: false, error: err.message || `Failed to fetch main branch ref (${refRes.status}).` };
            }
        }

        const refData = await refRes.json();
        const latestCommitSha = refData.object.sha;

        // Step 2: Get the tree of the latest commit
        const commitRes = await fetch(
            `https://api.github.com/repos/${activeRepo}/git/commits/${latestCommitSha}`,
            { headers, cache: "no-store" }
        );

        if (!commitRes.ok) {
            return { success: false, error: "Failed to retrieve commit tree from GitHub." };
        }

        const commitData = await commitRes.json();
        const baseTreeSha = commitData.tree.sha;

        // Step 3: Create a new tree with both data/portfolio.json and public/portfolio.json
        const treePayload = {
            base_tree: baseTreeSha,
            tree: [
                {
                    path: "data/portfolio.json",
                    mode: "100644",
                    type: "blob",
                    content: jsonString,
                },
                {
                    path: "public/portfolio.json",
                    mode: "100644",
                    type: "blob",
                    content: jsonString,
                },
            ],
        };

        const treeRes = await fetch(
            `https://api.github.com/repos/${activeRepo}/git/trees`,
            {
                method: "POST",
                headers,
                body: JSON.stringify(treePayload),
            }
        );

        if (!treeRes.ok) {
            const treeErr = await treeRes.json().catch(() => ({}));
            return { success: false, error: treeErr.message || "Failed to create updated file tree on GitHub." };
        }

        const treeData = await treeRes.json();
        const newTreeSha = treeData.sha;

        // Step 4: Create a new commit pointing to the new tree
        const newCommitPayload = {
            message,
            tree: newTreeSha,
            parents: [latestCommitSha],
        };

        const newCommitRes = await fetch(
            `https://api.github.com/repos/${activeRepo}/git/commits`,
            {
                method: "POST",
                headers,
                body: JSON.stringify(newCommitPayload),
            }
        );

        if (!newCommitRes.ok) {
            const commitErr = await newCommitRes.json().catch(() => ({}));
            return { success: false, error: commitErr.message || "Failed to create commit on GitHub." };
        }

        const newCommitData = await newCommitRes.json();
        const newCommitSha = newCommitData.sha;

        // Step 5: Update branch reference to point to the new commit
        const updateRefRes = await fetch(
            `https://api.github.com/repos/${activeRepo}/git/refs/heads/main`,
            {
                method: "PATCH",
                headers,
                body: JSON.stringify({
                    sha: newCommitSha,
                    force: false,
                }),
            }
        );

        if (!updateRefRes.ok) {
            const updateRefErr = await updateRefRes.json().catch(() => ({}));
            return { success: false, error: updateRefErr.message || "Failed to update main branch ref." };
        }

        return {
            success: true,
            commitSha: newCommitSha,
            htmlUrl: `https://github.com/${activeRepo}/actions`,
        };
    } catch (e: unknown) {
        // Fallback: If git tree API encountered an issue, try sequential contents API
        try {
            return await fallbackSequentialCommit(activeRepo, jsonString, activeToken, message);
        } catch {
            return {
                success: false,
                error: e instanceof Error ? e.message : "Network error while publishing to GitHub.",
            };
        }
    }
}

/**
 * Fallback mechanism using Contents API
 */
async function fallbackSequentialCommit(
    repo: string,
    content: string,
    token: string,
    commitMessage: string
): Promise<GitHubCommitResponse> {
    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
    };

    const files = ["data/portfolio.json", "public/portfolio.json"];
    for (const filePath of files) {
        const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
        let sha: string | undefined = undefined;
        try {
            const getRes = await fetch(apiUrl, { method: "GET", headers, cache: "no-store" });
            if (getRes.ok) {
                const f = await getRes.json();
                sha = f.sha;
            }
        } catch {
            // ignore
        }

        const putRes = await fetch(apiUrl, {
            method: "PUT",
            headers,
            body: JSON.stringify({
                message: commitMessage,
                content: utf8ToBase64(content),
                branch: "main",
                ...(sha ? { sha } : {}),
            }),
        });

        if (!putRes.ok) {
            const err = await putRes.json().catch(() => ({}));
            return { success: false, error: err.message || `Failed to commit ${filePath}` };
        }
    }

    return {
        success: true,
        htmlUrl: `https://github.com/${repo}/actions`,
    };
}

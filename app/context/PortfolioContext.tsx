"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getBasePath } from "@/app/utils/basePath";
import {
    PortfolioData,
    defaultPortfolioData,
    HeroData,
    EducationItem,
    ExperienceItem,
    ProjectItem,
    ContactItem,
    AwardCertificateItem,
} from "@/app/data/portfolioData";

interface AdminCredentials {
    username: string;
    passcode: string;
}

const DEFAULT_CREDENTIALS: AdminCredentials = {
    username: "prince_aziz",
    passcode: "1751dbbl",
};

const DATA_STORAGE_KEY = "portfolio_custom_data_v1";
const CREDS_STORAGE_KEY = "portfolio_admin_creds_v1";
const SESSION_STORAGE_KEY = "portfolio_admin_auth_session";

interface PortfolioContextType {
    data: PortfolioData;
    isLoaded: boolean;
    isAuthenticated: boolean;
    lastSavedAt: number | null;
    isSaving: boolean;
    login: (username: string, passcode: string) => boolean;
    logout: () => void;
    updateCredentials: (newUsername: string, newPasscode: string) => void;
    getCredentials: () => AdminCredentials;
    updateHero: (hero: HeroData) => void;
    updateAbout: (about: PortfolioData["about"]) => void;
    addEducation: (item: Omit<EducationItem, "id">) => void;
    updateEducation: (id: string, item: Partial<EducationItem>) => void;
    deleteEducation: (id: string) => void;
    reorderEducation: (items: EducationItem[]) => void;
    addExperience: (item: Omit<ExperienceItem, "id">) => void;
    updateExperience: (id: string, item: Partial<ExperienceItem>) => void;
    deleteExperience: (id: string) => void;
    reorderExperience: (items: ExperienceItem[]) => void;
    addProject: (item: Omit<ProjectItem, "id">) => void;
    updateProject: (id: string, item: Partial<ProjectItem>) => void;
    deleteProject: (id: string) => void;
    reorderProjects: (items: ProjectItem[]) => void;
    addCertificate: (item: Omit<AwardCertificateItem, "id">) => void;
    updateCertificate: (id: string, item: Partial<AwardCertificateItem>) => void;
    deleteCertificate: (id: string) => void;
    reorderCertificates: (items: AwardCertificateItem[]) => void;
    updateContact: (contact: PortfolioData["contact"]) => void;
    updateFooter: (footer: PortfolioData["footer"]) => void;
    resetToDefaults: () => void;
    exportJSON: () => string;
    importJSON: (jsonString: string) => { success: boolean; error?: string };
    saveAllNow: () => Promise<boolean>;
}

const PortfolioContext = createContext<PortfolioContextType | null>(null);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
    const [data, setData] = useState<PortfolioData>(defaultPortfolioData);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Load data from LocalStorage and remote on mount
    useEffect(() => {
        let localTimestamp = 0;
        let localDataParsed: PortfolioData | null = null;

        // 1. First load from localStorage for immediate render
        try {
            const savedData = localStorage.getItem(DATA_STORAGE_KEY);
            if (savedData) {
                localDataParsed = JSON.parse(savedData);
                if (localDataParsed && localDataParsed.hero) {
                    // Fall back to default certificates if localStorage has empty array or undefined
                    if (!localDataParsed.certificates || localDataParsed.certificates.length === 0) {
                        localDataParsed.certificates = defaultPortfolioData.certificates || [];
                    }
                    localTimestamp = localDataParsed.updatedAt || 1;
                    setData(localDataParsed);
                    setLastSavedAt(localTimestamp);
                }
            }
        } catch (e) {
            console.error("Failed to load portfolio data from localStorage", e);
        }

        // 2. Fetch fresh live data from local API or static portfolio.json
        const fetchInitialData = async () => {
            try {
                let fetchedData: PortfolioData | null = null;

                // Try local API route first if available
                try {
                    const apiRes = await fetch("/api/portfolio", { cache: "no-store" });
                    if (apiRes.ok) {
                        fetchedData = await apiRes.json();
                    }
                } catch {
                    // Ignore API fetch error in static export
                }

                // Fallback to static public/portfolio.json
                if (!fetchedData) {
                    const basePath = getBasePath();
                    const jsonRes = await fetch(`${basePath}/portfolio.json?t=${Date.now()}`, { cache: "no-store" });
                    if (jsonRes.ok) {
                        fetchedData = await jsonRes.json();
                    }
                }

                if (fetchedData && fetchedData.hero) {
                    const remoteTimestamp = fetchedData.updatedAt || 0;

                    // Intelligently preserve certificates from remote or local source
                    const finalCertificates =
                        fetchedData.certificates && fetchedData.certificates.length > 0
                            ? fetchedData.certificates
                            : localDataParsed?.certificates && localDataParsed.certificates.length > 0
                            ? localDataParsed.certificates
                            : defaultPortfolioData.certificates || [];

                    const dataToSet: PortfolioData = {
                        ...fetchedData,
                        certificates: finalCertificates,
                    };

                    // Always update state if remote is newer, or if local is missing certificates
                    if (
                        !localDataParsed ||
                        remoteTimestamp >= localTimestamp ||
                        (fetchedData.certificates && fetchedData.certificates.length > 0 && (!localDataParsed.certificates || localDataParsed.certificates.length === 0))
                    ) {
                        setData(dataToSet);
                        setLastSavedAt(remoteTimestamp || Date.now());
                        try {
                            localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(dataToSet));
                        } catch {
                            // ignore storage errors
                        }
                    } else {
                        const localWithCerts: PortfolioData = {
                            ...localDataParsed,
                            certificates: finalCertificates,
                        };
                        setData(localWithCerts);
                    }
                }
            } catch {
                // Fallback to existing loaded state
            }
        };

        fetchInitialData();

        // 3. Check authentication session
        try {
            const authSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
            if (authSession === "true") {
                setIsAuthenticated(true);
            }
        } catch (e) {
            console.error("Failed to check auth session", e);
        }

        setIsLoaded(true);

        // 4. Listen for storage events (multi-tab sync)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === DATA_STORAGE_KEY && e.newValue) {
                try {
                    const updated = JSON.parse(e.newValue);
                    if (updated && updated.hero) {
                        setData(updated);
                        setLastSavedAt(updated.updatedAt || Date.now());
                    }
                } catch (err) {
                    console.error("Sync error:", err);
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    // Helper to persist data to localStorage, local disk API, and state
    const persistData = useCallback((newData: PortfolioData) => {
        const now = Date.now();
        const dataWithTimestamp: PortfolioData = {
            ...newData,
            updatedAt: now,
        };

        // 1. Update React state immediately
        setData(dataWithTimestamp);
        setLastSavedAt(now);
        setIsSaving(true);

        // 2. Persist to localStorage
        try {
            localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(dataWithTimestamp));
        } catch (e) {
            console.error("Failed to save portfolio data to localStorage", e);
        }

        // 3. Persist to local disk files via Next.js API route
        fetch("/api/portfolio", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dataWithTimestamp),
        })
            .catch(() => {
                // In static exported environment, this will gracefully fail without errors
            })
            .finally(() => {
                setIsSaving(false);
            });
    }, []);

    // Manual Save trigger
    const saveAllNow = useCallback(async (): Promise<boolean> => {
        const now = Date.now();
        const dataWithTimestamp: PortfolioData = {
            ...data,
            updatedAt: now,
        };

        setData(dataWithTimestamp);
        setLastSavedAt(now);

        try {
            localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(dataWithTimestamp));
        } catch {
            // ignore
        }

        try {
            const res = await fetch("/api/portfolio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataWithTimestamp),
            });
            return res.ok;
        } catch {
            return false;
        }
    }, [data]);

    // Authentication helpers
    const getCredentials = (): AdminCredentials => {
        try {
            const saved = localStorage.getItem(CREDS_STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error(e);
        }
        return DEFAULT_CREDENTIALS;
    };

    const login = (username: string, passcode: string): boolean => {
        const creds = getCredentials();
        if (
            username.trim().toLowerCase() === creds.username.trim().toLowerCase() &&
            passcode.trim() === creds.passcode.trim()
        ) {
            setIsAuthenticated(true);
            try {
                sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
            } catch (e) {
                console.error(e);
            }
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
        try {
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
        } catch (e) {
            console.error(e);
        }
    };

    const updateCredentials = (newUsername: string, newPasscode: string) => {
        const creds: AdminCredentials = {
            username: newUsername.trim() || DEFAULT_CREDENTIALS.username,
            passcode: newPasscode.trim() || DEFAULT_CREDENTIALS.passcode,
        };
        try {
            localStorage.setItem(CREDS_STORAGE_KEY, JSON.stringify(creds));
        } catch (e) {
            console.error("Failed to save credentials", e);
        }
    };

    // Hero updates
    const updateHero = (hero: HeroData) => {
        persistData({ ...data, hero });
    };

    // About updates
    const updateAbout = (about: PortfolioData["about"]) => {
        persistData({ ...data, about });
    };

    // Education updates
    const addEducation = (item: Omit<EducationItem, "id">) => {
        const newItem: EducationItem = {
            ...item,
            id: `edu-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        };
        persistData({ ...data, education: [...data.education, newItem] });
    };

    const updateEducation = (id: string, updated: Partial<EducationItem>) => {
        const updatedList = data.education.map((edu) =>
            edu.id === id ? { ...edu, ...updated } : edu
        );
        persistData({ ...data, education: updatedList });
    };

    const deleteEducation = (id: string) => {
        persistData({
            ...data,
            education: data.education.filter((edu) => edu.id !== id),
        });
    };

    const reorderEducation = (items: EducationItem[]) => {
        persistData({ ...data, education: items });
    };

    // Experience updates
    const addExperience = (item: Omit<ExperienceItem, "id">) => {
        const newItem: ExperienceItem = {
            ...item,
            id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        };
        persistData({ ...data, experience: [...data.experience, newItem] });
    };

    const updateExperience = (id: string, updated: Partial<ExperienceItem>) => {
        const updatedList = data.experience.map((exp) =>
            exp.id === id ? { ...exp, ...updated } : exp
        );
        persistData({ ...data, experience: updatedList });
    };

    const deleteExperience = (id: string) => {
        persistData({
            ...data,
            experience: data.experience.filter((exp) => exp.id !== id),
        });
    };

    const reorderExperience = (items: ExperienceItem[]) => {
        persistData({ ...data, experience: items });
    };

    // Project updates
    const addProject = (item: Omit<ProjectItem, "id">) => {
        const newItem: ProjectItem = {
            ...item,
            id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        };
        persistData({ ...data, projects: [...data.projects, newItem] });
    };

    const updateProject = (id: string, updated: Partial<ProjectItem>) => {
        const updatedList = data.projects.map((proj) =>
            proj.id === id ? { ...proj, ...updated } : proj
        );
        persistData({ ...data, projects: updatedList });
    };

    const deleteProject = (id: string) => {
        persistData({
            ...data,
            projects: data.projects.filter((proj) => proj.id !== id),
        });
    };

    const reorderProjects = (items: ProjectItem[]) => {
        persistData({ ...data, projects: items });
    };

    // Certificate updates
    const addCertificate = (item: Omit<AwardCertificateItem, "id">) => {
        const newItem: AwardCertificateItem = {
            ...item,
            id: `cert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        };
        const currentCerts = data.certificates || [];
        persistData({ ...data, certificates: [...currentCerts, newItem] });
    };

    const updateCertificate = (id: string, updated: Partial<AwardCertificateItem>) => {
        const currentCerts = data.certificates || [];
        const updatedList = currentCerts.map((cert) =>
            cert.id === id ? { ...cert, ...updated } : cert
        );
        persistData({ ...data, certificates: updatedList });
    };

    const deleteCertificate = (id: string) => {
        const currentCerts = data.certificates || [];
        persistData({
            ...data,
            certificates: currentCerts.filter((cert) => cert.id !== id),
        });
    };

    const reorderCertificates = (items: AwardCertificateItem[]) => {
        persistData({ ...data, certificates: items });
    };

    // Contact & Footer
    const updateContact = (contact: PortfolioData["contact"]) => {
        persistData({ ...data, contact });
    };

    const updateFooter = (footer: PortfolioData["footer"]) => {
        persistData({ ...data, footer });
    };

    // Backup & Restore
    const resetToDefaults = () => {
        persistData(defaultPortfolioData);
    };

    const exportJSON = () => {
        return JSON.stringify(data, null, 2);
    };

    const importJSON = (jsonString: string): { success: boolean; error?: string } => {
        try {
            const parsed = JSON.parse(jsonString);
            if (!parsed.hero || !parsed.about || !parsed.projects) {
                return { success: false, error: "Invalid portfolio data schema format." };
            }
            persistData(parsed);
            return { success: true };
        } catch (e: unknown) {
            return {
                success: false,
                error: e instanceof Error ? e.message : "Failed to parse JSON string.",
            };
        }
    };

    return (
        <PortfolioContext.Provider
            value={{
                data,
                isLoaded,
                isAuthenticated,
                lastSavedAt,
                isSaving,
                login,
                logout,
                updateCredentials,
                getCredentials,
                updateHero,
                updateAbout,
                addEducation,
                updateEducation,
                deleteEducation,
                reorderEducation,
                addExperience,
                updateExperience,
                deleteExperience,
                reorderExperience,
                addProject,
                updateProject,
                deleteProject,
                reorderProjects,
                addCertificate,
                updateCertificate,
                deleteCertificate,
                reorderCertificates,
                updateContact,
                updateFooter,
                resetToDefaults,
                exportJSON,
                importJSON,
                saveAllNow,
            }}
        >
            {children}
        </PortfolioContext.Provider>
    );
}

export function usePortfolioData() {
    const context = useContext(PortfolioContext);
    if (!context) {
        throw new Error("usePortfolioData must be used within a PortfolioProvider");
    }
    return context;
}

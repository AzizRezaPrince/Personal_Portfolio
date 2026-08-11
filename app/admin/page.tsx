"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePortfolioData } from "@/app/context/PortfolioContext";
import {
    EducationItem,
    ExperienceItem,
    ProjectItem,
    ContactItem,
} from "@/app/data/portfolioData";
import {
    getStoredGitHubToken,
    saveStoredGitHubToken,
    getStoredGitHubRepo,
    saveStoredGitHubRepo,
    publishPortfolioToGitHub,
} from "@/app/utils/githubSync";
import { getBasePath } from "@/app/utils/basePath";

type TabType =
    | "hero"
    | "about"
    | "skills"
    | "education"
    | "experience"
    | "projects"
    | "contact"
    | "settings";

export default function AdminPage() {
    const {
        data,
        isLoaded,
        isAuthenticated,
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
        updateContact,
        updateFooter,
        resetToDefaults,
        exportJSON,
        importJSON,
    } = usePortfolioData();

    // Login state
    const [loginUsername, setLoginUsername] = useState("");
    const [loginPasscode, setLoginPasscode] = useState("");
    const [loginError, setLoginError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Active tab
    const [activeTab, setActiveTab] = useState<TabType>("hero");

    // Toast notification state
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage(null);
        }, 3000);
    };

    const formatImageUrl = (img: string) => {
        if (!img) return "";
        if (img.startsWith("data:") || img.startsWith("http://") || img.startsWith("https://")) {
            return img;
        }
        const basePath = getBasePath();
        if (img.startsWith("/")) {
            return `${basePath}${img}`;
        }
        return `${basePath}/${img}`;
    };

    // GitHub Auto-Publish State
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [publishToken, setPublishToken] = useState("");
    const [publishRepo, setPublishRepo] = useState("AzizRezaPrince/Personal_Portfolio");
    const [publishStatus, setPublishStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [publishMessage, setPublishMessage] = useState("");
    const [actionsUrl, setActionsUrl] = useState("");

    // Hero local form state
    const [heroForm, setHeroForm] = useState(data.hero);

    // About local form state
    const [bioParagraphs, setBioParagraphs] = useState<string[]>(data.about.bio);
    const [newBioInput, setNewBioInput] = useState("");

    // Skills local state
    const [skillsList, setSkillsList] = useState<string[]>(data.about.skills);
    const [newSkillInput, setNewSkillInput] = useState("");

    // Languages local state
    const [languagesList, setLanguagesList] = useState<string[]>(data.about.languages);
    const [newLanguageInput, setNewLanguageInput] = useState("");

    // Education modal / form
    const [editingEdu, setEditingEdu] = useState<EducationItem | null>(null);
    const [isEduModalOpen, setIsEduModalOpen] = useState(false);
    const [eduForm, setEduForm] = useState({
        degree: "",
        institution: "",
        year: "",
        grade: "",
    });

    // Experience modal / form
    const [editingExp, setEditingExp] = useState<ExperienceItem | null>(null);
    const [isExpModalOpen, setIsExpModalOpen] = useState(false);
    const [expForm, setExpForm] = useState({
        role: "",
        organization: "",
        year: "",
        description: "",
    });

    // Project modal / form
    const [editingProj, setEditingProj] = useState<ProjectItem | null>(null);
    const [isProjModalOpen, setIsProjModalOpen] = useState(false);
    const [projForm, setProjForm] = useState({
        title: "",
        desc: "",
        tags: "",
        image: "",
        demoUrl: "",
        githubUrl: "",
        featured: true,
    });
    const projectFileInputRef = useRef<HTMLInputElement>(null);

    // Contact form state
    const [contactTitle, setContactTitle] = useState(data.contact.title);
    const [contactSubtitle, setContactSubtitle] = useState(data.contact.subtitle);
    const [contactItems, setContactItems] = useState<ContactItem[]>(data.contact.items);
    const [newContactItem, setNewContactItem] = useState<Omit<ContactItem, "id">>({
        label: "",
        value: "",
        type: "email",
        url: "",
    });
    const [footerCopyright, setFooterCopyright] = useState(data.footer.copyright);

    // Settings state
    const [newAdminUser, setNewAdminUser] = useState("");
    const [newAdminPass, setNewAdminPass] = useState("");
    const [importJsonText, setImportJsonText] = useState("");
    const importFileInputRef = useRef<HTMLInputElement>(null);

    // Sync local forms when data is loaded/updated
    useEffect(() => {
        if (isLoaded) {
            setHeroForm(data.hero);
            setBioParagraphs(data.about.bio);
            setSkillsList(data.about.skills);
            setLanguagesList(data.about.languages);
            setContactTitle(data.contact.title);
            setContactSubtitle(data.contact.subtitle);
            setContactItems(data.contact.items);
            setFooterCopyright(data.footer.copyright);
            const currentCreds = getCredentials();
            setNewAdminUser(currentCreds.username);
            setPublishToken(getStoredGitHubToken());
            setPublishRepo(getStoredGitHubRepo());
        }
    }, [data, isLoaded]);

    const handlePublishToGitHub = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!publishToken.trim()) {
            setPublishStatus("error");
            setPublishMessage("Please enter your GitHub Personal Access Token (PAT).");
            return;
        }

        saveStoredGitHubToken(publishToken);
        saveStoredGitHubRepo(publishRepo);

        setPublishStatus("loading");
        setPublishMessage("Connecting to GitHub and committing portfolio updates...");

        try {
            const res = await publishPortfolioToGitHub(
                data,
                publishToken,
                publishRepo,
                `Update portfolio via Admin Panel [${new Date().toLocaleTimeString()}]`
            );

            if (res.success) {
                setPublishStatus("success");
                setActionsUrl(res.htmlUrl || `https://github.com/${publishRepo}/actions`);
                showToast("🚀 Successfully committed to GitHub! Live site is deploying...");
            } else {
                setPublishStatus("error");
                setPublishMessage(res.error || "Failed to commit changes to GitHub repository.");
            }
        } catch (err: unknown) {
            setPublishStatus("error");
            setPublishMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
        }
    };

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError("");
        const success = login(loginUsername, loginPasscode);
        if (success) {
            showToast("Welcome back, Prince!");
        } else {
            setLoginError("Invalid username or password. Please try again.");
        }
    };

    // Save Hero
    const handleSaveHero = (e: React.FormEvent) => {
        e.preventDefault();
        updateHero(heroForm);
        showToast("Hero section updated successfully!");
    };

    // Save Bio
    const handleSaveBio = () => {
        updateAbout({
            ...data.about,
            bio: bioParagraphs,
        });
        showToast("About bio updated successfully!");
    };

    const handleAddBioParagraph = () => {
        if (!newBioInput.trim()) return;
        const updated = [...bioParagraphs, newBioInput.trim()];
        setBioParagraphs(updated);
        setNewBioInput("");
        updateAbout({
            ...data.about,
            bio: updated,
        });
        showToast("Bio paragraph added!");
    };

    const handleDeleteBioParagraph = (index: number) => {
        const updated = bioParagraphs.filter((_, i) => i !== index);
        setBioParagraphs(updated);
        updateAbout({
            ...data.about,
            bio: updated,
        });
        showToast("Bio paragraph removed!");
    };

    // Skills & Languages
    const handleAddSkill = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newSkillInput.trim()) return;
        if (skillsList.includes(newSkillInput.trim())) {
            showToast("Skill already exists!");
            return;
        }
        const updated = [...skillsList, newSkillInput.trim()];
        setSkillsList(updated);
        setNewSkillInput("");
        updateAbout({
            ...data.about,
            skills: updated,
        });
        showToast("Skill added!");
    };

    const handleDeleteSkill = (skillToDelete: string) => {
        const updated = skillsList.filter((s) => s !== skillToDelete);
        setSkillsList(updated);
        updateAbout({
            ...data.about,
            skills: updated,
        });
        showToast("Skill removed!");
    };

    const handleAddLanguage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newLanguageInput.trim()) return;
        const updated = [...languagesList, newLanguageInput.trim()];
        setLanguagesList(updated);
        setNewLanguageInput("");
        updateAbout({
            ...data.about,
            languages: updated,
        });
        showToast("Language added!");
    };

    const handleDeleteLanguage = (index: number) => {
        const updated = languagesList.filter((_, i) => i !== index);
        setLanguagesList(updated);
        updateAbout({
            ...data.about,
            languages: updated,
        });
        showToast("Language removed!");
    };

    // Education Handlers
    const openAddEduModal = () => {
        setEditingEdu(null);
        setEduForm({ degree: "", institution: "", year: "", grade: "" });
        setIsEduModalOpen(true);
    };

    const openEditEduModal = (edu: EducationItem) => {
        setEditingEdu(edu);
        setEduForm({
            degree: edu.degree,
            institution: edu.institution,
            year: edu.year,
            grade: edu.grade || "",
        });
        setIsEduModalOpen(true);
    };

    const handleSaveEdu = (e: React.FormEvent) => {
        e.preventDefault();
        if (!eduForm.degree || !eduForm.institution) {
            showToast("Please provide at least Degree and Institution");
            return;
        }

        if (editingEdu) {
            updateEducation(editingEdu.id, eduForm);
            showToast("Education item updated!");
        } else {
            addEducation(eduForm);
            showToast("New education item added!");
        }
        setIsEduModalOpen(false);
    };

    const handleMoveEdu = (index: number, direction: "up" | "down") => {
        const newEdu = [...data.education];
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newEdu.length) return;
        const [moved] = newEdu.splice(index, 1);
        newEdu.splice(targetIndex, 0, moved);
        reorderEducation(newEdu);
        showToast("Education reordered!");
    };

    // Experience Handlers
    const openAddExpModal = () => {
        setEditingExp(null);
        setExpForm({ role: "", organization: "", year: "", description: "" });
        setIsExpModalOpen(true);
    };

    const openEditExpModal = (exp: ExperienceItem) => {
        setEditingExp(exp);
        setExpForm({
            role: exp.role,
            organization: exp.organization,
            year: exp.year,
            description: exp.description,
        });
        setIsExpModalOpen(true);
    };

    const handleSaveExp = (e: React.FormEvent) => {
        e.preventDefault();
        if (!expForm.role || !expForm.organization) {
            showToast("Please provide Role and Organization");
            return;
        }

        if (editingExp) {
            updateExperience(editingExp.id, expForm);
            showToast("Experience item updated!");
        } else {
            addExperience(expForm);
            showToast("New experience item added!");
        }
        setIsExpModalOpen(false);
    };

    const handleMoveExp = (index: number, direction: "up" | "down") => {
        const newExp = [...data.experience];
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newExp.length) return;
        const [moved] = newExp.splice(index, 1);
        newExp.splice(targetIndex, 0, moved);
        reorderExperience(newExp);
        showToast("Experience reordered!");
    };

    // Project Handlers
    const openAddProjModal = () => {
        setEditingProj(null);
        setProjForm({
            title: "",
            desc: "",
            tags: "",
            image: "",
            demoUrl: "",
            githubUrl: "",
            featured: true,
        });
        setIsProjModalOpen(true);
    };

    const openEditProjModal = (proj: ProjectItem) => {
        setEditingProj(proj);
        setProjForm({
            title: proj.title,
            desc: proj.desc,
            tags: proj.tags.join(", "),
            image: proj.image,
            demoUrl: proj.demoUrl || "",
            githubUrl: proj.githubUrl || "",
            featured: proj.featured ?? true,
        });
        setIsProjModalOpen(true);
    };

    const handleProjectImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Convert image file to base64 Data URL
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === "string") {
                setProjForm((prev) => ({ ...prev, image: reader.result as string }));
                showToast("Project image loaded!");
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSaveProj = (e: React.FormEvent) => {
        e.preventDefault();
        if (!projForm.title) {
            showToast("Please enter a Project Title");
            return;
        }

        const tagsArray = projForm.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

        const projectPayload = {
            title: projForm.title,
            desc: projForm.desc,
            tags: tagsArray,
            image: projForm.image,
            demoUrl: projForm.demoUrl,
            githubUrl: projForm.githubUrl,
            featured: projForm.featured,
        };

        if (editingProj) {
            updateProject(editingProj.id, projectPayload);
            showToast("Project updated!");
        } else {
            addProject(projectPayload);
            showToast("New project added!");
        }
        setIsProjModalOpen(false);
    };

    const handleMoveProj = (index: number, direction: "up" | "down") => {
        const newProj = [...data.projects];
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newProj.length) return;
        const [moved] = newProj.splice(index, 1);
        newProj.splice(targetIndex, 0, moved);
        reorderProjects(newProj);
        showToast("Projects reordered!");
    };

    // Contact & Footer Handlers
    const handleSaveContact = (e: React.FormEvent) => {
        e.preventDefault();
        updateContact({
            title: contactTitle,
            subtitle: contactSubtitle,
            items: contactItems,
        });
        updateFooter({
            copyright: footerCopyright,
        });
        showToast("Contact and footer settings updated!");
    };

    const handleAddContactItem = () => {
        if (!newContactItem.label || !newContactItem.value) {
            showToast("Please fill in Label and Value");
            return;
        }
        const newItem: ContactItem = {
            ...newContactItem,
            id: `contact-${Date.now()}`,
        };
        const updated = [...contactItems, newItem];
        setContactItems(updated);
        setNewContactItem({ label: "", value: "", type: "email", url: "" });
        updateContact({
            title: contactTitle,
            subtitle: contactSubtitle,
            items: updated,
        });
        showToast("Contact item added!");
    };

    const handleDeleteContactItem = (id: string) => {
        const updated = contactItems.filter((item) => item.id !== id);
        setContactItems(updated);
        updateContact({
            title: contactTitle,
            subtitle: contactSubtitle,
            items: updated,
        });
        showToast("Contact item removed!");
    };

    // Settings Handlers
    const handleSaveCredentials = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAdminUser || !newAdminPass) {
            showToast("Username and password cannot be empty");
            return;
        }
        updateCredentials(newAdminUser, newAdminPass);
        setNewAdminPass("");
        showToast("Admin credentials updated successfully!");
    };

    const handleDownloadJSON = () => {
        const jsonStr = exportJSON();
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `portfolio-data-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Downloaded portfolio-data.json backup!");
    };

    const handleCopyJSON = () => {
        const jsonStr = exportJSON();
        navigator.clipboard.writeText(jsonStr);
        showToast("Portfolio JSON copied to clipboard!");
    };

    const handleImportJSONFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                const res = importJSON(content);
                if (res.success) {
                    showToast("Portfolio data imported successfully!");
                } else {
                    showToast(`Import failed: ${res.error}`);
                }
            }
        };
        reader.readAsText(file);
    };

    const handleImportJSONText = () => {
        if (!importJsonText.trim()) return;
        const res = importJSON(importJsonText);
        if (res.success) {
            setImportJsonText("");
            showToast("Portfolio data imported successfully!");
        } else {
            showToast(`Import failed: ${res.error}`);
        }
    };

    const handleResetAll = () => {
        if (window.confirm("Are you sure you want to reset all portfolio data to default? This will overwrite your custom modifications.")) {
            resetToDefaults();
            showToast("Portfolio reset to default successfully!");
        }
    };

    // If not authenticated, render Login Screen
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen w-full bg-[#0a0a0c] text-white flex items-center justify-center p-6 relative overflow-hidden">
                {/* Background Ambient Glow */}
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md bg-[#141419]/90 border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative z-10"
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 mx-auto mb-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-center text-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.25)]">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">
                            Admin Portal
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Portfolio Content Management System
                        </p>
                    </div>

                    {loginError && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-2"
                        >
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {loginError}
                        </motion.div>
                    )}

                    <form onSubmit={handleLoginSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={loginUsername}
                                    onChange={(e) => setLoginUsername(e.target.value)}
                                    placeholder="Enter admin username"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                />
                                <div className="absolute right-3.5 top-3.5 text-gray-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={loginPasscode}
                                    onChange={(e) => setLoginPasscode(e.target.value)}
                                    placeholder="Enter admin password"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all pr-11"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-3.5 text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] cursor-pointer"
                        >
                            Sign In to Dashboard
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-white/5 text-center">
                        <Link
                            href="/"
                            className="text-xs text-gray-500 hover:text-purple-400 transition-colors inline-flex items-center gap-1"
                        >
                            ← Back to Portfolio Website
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Authenticated Admin Dashboard
    return (
        <div className="min-h-screen bg-[#0d0d11] text-white flex flex-col selection:bg-purple-500 selection:text-white">
            {/* Toast Notification */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className="fixed top-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-3 rounded-2xl shadow-[0_10px_30px_rgba(168,85,247,0.4)] border border-white/20 flex items-center gap-3 font-medium text-sm"
                    >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 w-full bg-[#131318]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-lg shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                        P
                    </div>
                    <div>
                        <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                            Prince Portfolio Manager
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-normal">
                                Live Sync
                            </span>
                        </h1>
                        <p className="text-xs text-gray-400">
                            Editing Aziz Reza Prince&apos;s Portfolio
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setPublishStatus("idle");
                            setPublishMessage("");
                            setIsPublishModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3.5 py-2 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] cursor-pointer"
                    >
                        <svg className="w-4 h-4 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span>Publish to Live</span>
                    </button>

                    <Link
                        href="/"
                        target="_blank"
                        className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white px-3 py-2 rounded-xl transition-all"
                    >
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Live Website
                    </Link>

                    <button
                        onClick={handleDownloadJSON}
                        title="Download JSON backup"
                        className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 px-3 py-2 rounded-xl transition-all cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export JSON
                    </button>

                    <button
                        onClick={logout}
                        className="inline-flex items-center gap-1.5 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 px-3 py-2 rounded-xl transition-all cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-8 gap-8">
                {/* Navigation Sidebar */}
                <aside className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                    {[
                        { id: "hero", label: "Hero & Intro", icon: "✨" },
                        { id: "about", label: "About Bio", icon: "👤" },
                        { id: "skills", label: "Skills & Languages", icon: "⚡" },
                        { id: "education", label: "Education", icon: "🎓", count: data.education.length },
                        { id: "experience", label: "Work Experience", icon: "💼", count: data.experience.length },
                        { id: "projects", label: "Projects", icon: "🚀", count: data.projects.length },
                        { id: "contact", label: "Contact & Footer", icon: "📬" },
                        { id: "settings", label: "Settings & Backup", icon: "⚙️" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                                activeTab === tab.id
                                    ? "bg-purple-600/20 text-purple-200 border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-transparent"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </div>
                            {tab.count !== undefined && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    activeTab === tab.id
                                        ? "bg-purple-500/30 text-purple-200"
                                        : "bg-white/10 text-gray-400"
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </aside>

                {/* Tab Panels */}
                <main className="flex-1 min-w-0 bg-[#141419]/90 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                    {/* TAB 1: HERO */}
                    {activeTab === "hero" && (
                        <div>
                            <div className="border-b border-white/10 pb-4 mb-6">
                                <h2 className="text-2xl font-bold text-white">Hero & Scroll Overlay</h2>
                                <p className="text-sm text-gray-400 mt-1">
                                    Configure your main header text and scroll-animated statements.
                                </p>
                            </div>

                            <form onSubmit={handleSaveHero} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                                            Hero Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={heroForm.name}
                                            onChange={(e) =>
                                                setHeroForm({ ...heroForm, name: e.target.value })
                                            }
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                                            Subtitle / Role
                                        </label>
                                        <input
                                            type="text"
                                            value={heroForm.title}
                                            onChange={(e) =>
                                                setHeroForm({ ...heroForm, title: e.target.value })
                                            }
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                                    <h3 className="text-sm font-semibold text-purple-300">
                                        Scroll Section 2 (Left Aligned Statement)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Prefix Text</label>
                                            <input
                                                type="text"
                                                value={heroForm.tagline1Prefix}
                                                onChange={(e) =>
                                                    setHeroForm({
                                                        ...heroForm,
                                                        tagline1Prefix: e.target.value,
                                                    })
                                                }
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Highlighted Text</label>
                                            <input
                                                type="text"
                                                value={heroForm.tagline1Highlight}
                                                onChange={(e) =>
                                                    setHeroForm({
                                                        ...heroForm,
                                                        tagline1Highlight: e.target.value,
                                                    })
                                                }
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                                    <h3 className="text-sm font-semibold text-purple-300">
                                        Scroll Section 3 (Right Aligned Statement)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Prefix Text</label>
                                            <input
                                                type="text"
                                                value={heroForm.tagline2Prefix}
                                                onChange={(e) =>
                                                    setHeroForm({
                                                        ...heroForm,
                                                        tagline2Prefix: e.target.value,
                                                    })
                                                }
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Highlighted Text</label>
                                            <input
                                                type="text"
                                                value={heroForm.tagline2Highlight}
                                                onChange={(e) =>
                                                    setHeroForm({
                                                        ...heroForm,
                                                        tagline2Highlight: e.target.value,
                                                    })
                                                }
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="bg-purple-600 hover:bg-purple-500 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] cursor-pointer"
                                >
                                    Save Hero Changes
                                </button>
                            </form>
                        </div>
                    )}

                    {/* TAB 2: ABOUT BIO */}
                    {activeTab === "about" && (
                        <div>
                            <div className="border-b border-white/10 pb-4 mb-6">
                                <h2 className="text-2xl font-bold text-white">About Me Bio</h2>
                                <p className="text-sm text-gray-400 mt-1">
                                    Manage the introductory paragraphs displayed in the About section.
                                </p>
                            </div>

                            <div className="space-y-4 mb-8">
                                {bioParagraphs.map((para, index) => (
                                    <div
                                        key={index}
                                        className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-3 group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-mono text-purple-400">
                                                Paragraph {index + 1}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteBioParagraph(index)}
                                                className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <textarea
                                            rows={3}
                                            value={para}
                                            onChange={(e) => {
                                                const updated = [...bioParagraphs];
                                                updated[index] = e.target.value;
                                                setBioParagraphs(updated);
                                            }}
                                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:border-purple-500 focus:outline-none"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-3 mb-6">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300">
                                    Add New Paragraph
                                </label>
                                <textarea
                                    rows={3}
                                    value={newBioInput}
                                    onChange={(e) => setNewBioInput(e.target.value)}
                                    placeholder="Write a new paragraph for your bio..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-purple-500 focus:outline-none"
                                />
                                <button
                                    onClick={handleAddBioParagraph}
                                    className="bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-4 py-2 rounded-xl transition-all cursor-pointer"
                                >
                                    + Add Paragraph
                                </button>
                            </div>

                            <button
                                onClick={handleSaveBio}
                                className="bg-purple-600 hover:bg-purple-500 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] cursor-pointer"
                            >
                                Save Bio Changes
                            </button>
                        </div>
                    )}

                    {/* TAB 3: SKILLS & LANGUAGES */}
                    {activeTab === "skills" && (
                        <div className="space-y-10">
                            {/* Skills Section */}
                            <div>
                                <div className="border-b border-white/10 pb-4 mb-6">
                                    <h2 className="text-2xl font-bold text-white">Skills Chips</h2>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Add, delete, or organize your technical and creative skill badges.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2.5 mb-6">
                                    {skillsList.map((skill) => (
                                        <span
                                            key={skill}
                                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-200 text-sm font-medium shadow-[0_0_10px_rgba(168,85,247,0.1)]"
                                        >
                                            {skill}
                                            <button
                                                onClick={() => handleDeleteSkill(skill)}
                                                className="text-purple-400 hover:text-red-400 transition-colors cursor-pointer text-xs"
                                                title="Delete skill"
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                <form onSubmit={handleAddSkill} className="flex gap-3 max-w-md">
                                    <input
                                        type="text"
                                        value={newSkillInput}
                                        onChange={(e) => setNewSkillInput(e.target.value)}
                                        placeholder="e.g. Next.js, Python, Tailwind"
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                                    >
                                        Add Skill
                                    </button>
                                </form>
                            </div>

                            {/* Languages Section */}
                            <div>
                                <div className="border-b border-white/10 pb-4 mb-6">
                                    <h2 className="text-2xl font-bold text-white">Languages</h2>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Languages you speak and your proficiency level.
                                    </p>
                                </div>

                                <div className="space-y-2 mb-6 max-w-md">
                                    {languagesList.map((lang, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl"
                                        >
                                            <span className="text-sm font-medium text-gray-200">{lang}</span>
                                            <button
                                                onClick={() => handleDeleteLanguage(index)}
                                                className="text-red-400 hover:text-red-300 text-xs transition-colors cursor-pointer"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <form onSubmit={handleAddLanguage} className="flex gap-3 max-w-md">
                                    <input
                                        type="text"
                                        value={newLanguageInput}
                                        onChange={(e) => setNewLanguageInput(e.target.value)}
                                        placeholder="e.g. German (Basic)"
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                                    >
                                        Add Language
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: EDUCATION */}
                    {activeTab === "education" && (
                        <div>
                            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Education History</h2>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Academic milestones, institutions, and degrees.
                                    </p>
                                </div>
                                <button
                                    onClick={openAddEduModal}
                                    className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                                >
                                    + Add Education
                                </button>
                            </div>

                            <div className="space-y-4">
                                {data.education.map((edu, index) => (
                                    <div
                                        key={edu.id}
                                        className="p-5 bg-white/5 border border-white/10 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:border-purple-500/30 transition-all"
                                    >
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-bold text-white">
                                                    {edu.institution}
                                                </h3>
                                                <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                                                    {edu.year}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-300 mt-1">{edu.degree}</p>
                                            {edu.grade && (
                                                <p className="text-xs text-gray-400 mt-1">{edu.grade}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 self-end md:self-center">
                                            <button
                                                onClick={() => handleMoveEdu(index, "up")}
                                                disabled={index === 0}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300"
                                                title="Move up"
                                            >
                                                ▲
                                            </button>
                                            <button
                                                onClick={() => handleMoveEdu(index, "down")}
                                                disabled={index === data.education.length - 1}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300"
                                                title="Move down"
                                            >
                                                ▼
                                            </button>
                                            <button
                                                onClick={() => openEditEduModal(edu)}
                                                className="px-3 py-1.5 bg-white/10 hover:bg-purple-600/30 text-xs font-medium rounded-lg text-white transition-all cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => deleteEducation(edu.id)}
                                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-xs font-medium rounded-lg text-red-300 transition-all cursor-pointer"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 5: WORK EXPERIENCE */}
                    {activeTab === "experience" && (
                        <div>
                            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Work Experience</h2>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Roles, clubs, internships, and professional organizations.
                                    </p>
                                </div>
                                <button
                                    onClick={openAddExpModal}
                                    className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                                >
                                    + Add Experience
                                </button>
                            </div>

                            <div className="space-y-4">
                                {data.experience.map((exp, index) => (
                                    <div
                                        key={exp.id}
                                        className="p-5 bg-white/5 border border-white/10 rounded-2xl flex flex-col md:flex-row items-start justify-between gap-4 group hover:border-purple-500/30 transition-all"
                                    >
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-3 mb-1">
                                                <h3 className="text-lg font-bold text-white">
                                                    {exp.role}
                                                </h3>
                                                <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                                                    {exp.year}
                                                </span>
                                            </div>
                                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                                {exp.organization}
                                            </h4>
                                            <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                                                {exp.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 self-end md:self-start">
                                            <button
                                                onClick={() => handleMoveExp(index, "up")}
                                                disabled={index === 0}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300"
                                                title="Move up"
                                            >
                                                ▲
                                            </button>
                                            <button
                                                onClick={() => handleMoveExp(index, "down")}
                                                disabled={index === data.experience.length - 1}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300"
                                                title="Move down"
                                            >
                                                ▼
                                            </button>
                                            <button
                                                onClick={() => openEditExpModal(exp)}
                                                className="px-3 py-1.5 bg-white/10 hover:bg-purple-600/30 text-xs font-medium rounded-lg text-white transition-all cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => deleteExperience(exp.id)}
                                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-xs font-medium rounded-lg text-red-300 transition-all cursor-pointer"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 6: PROJECTS */}
                    {activeTab === "projects" && (
                        <div>
                            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Projects Portfolio</h2>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Showcase your mobile apps, UI/UX designs, and web platforms.
                                    </p>
                                </div>
                                <button
                                    onClick={openAddProjModal}
                                    className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                                >
                                    + Add Project
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {data.projects.map((proj, index) => (
                                    <div
                                        key={proj.id}
                                        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group hover:border-purple-500/40 transition-all flex flex-col justify-between"
                                    >
                                        <div className="relative h-44 w-full bg-black/40 overflow-hidden">
                                            {proj.image ? (
                                                <img
                                                    src={formatImageUrl(proj.image)}
                                                    alt={proj.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                                                    No Image Uploaded
                                                </div>
                                            )}
                                            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-xs text-purple-300 border border-white/10">
                                                #{index + 1}
                                            </div>
                                        </div>

                                        <div className="p-5 flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex flex-wrap gap-1.5 mb-2">
                                                    {proj.tags.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                                <h3 className="text-xl font-bold text-white mb-1">
                                                    {proj.title}
                                                </h3>
                                                <p className="text-xs text-gray-300 leading-relaxed mb-4">
                                                    {proj.desc}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleMoveProj(index, "up")}
                                                        disabled={index === 0}
                                                        className="p-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-xs text-gray-300"
                                                        title="Move left/up"
                                                    >
                                                        ◀
                                                    </button>
                                                    <button
                                                        onClick={() => handleMoveProj(index, "down")}
                                                        disabled={index === data.projects.length - 1}
                                                        className="p-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-xs text-gray-300"
                                                        title="Move right/down"
                                                    >
                                                        ▶
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openEditProjModal(proj)}
                                                        className="px-3 py-1 bg-white/10 hover:bg-purple-600/30 text-xs font-medium rounded-lg text-white transition-all cursor-pointer"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => deleteProject(proj.id)}
                                                        className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-xs font-medium rounded-lg text-red-300 transition-all cursor-pointer"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 7: CONTACT & FOOTER */}
                    {activeTab === "contact" && (
                        <div>
                            <div className="border-b border-white/10 pb-4 mb-6">
                                <h2 className="text-2xl font-bold text-white">Contact & Footer</h2>
                                <p className="text-sm text-gray-400 mt-1">
                                    Manage contact info, academic/personal emails, and footer notice.
                                </p>
                            </div>

                            <form onSubmit={handleSaveContact} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                                            Contact Section Title
                                        </label>
                                        <input
                                            type="text"
                                            value={contactTitle}
                                            onChange={(e) => setContactTitle(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                                            Footer Copyright Notice
                                        </label>
                                        <input
                                            type="text"
                                            value={footerCopyright}
                                            onChange={(e) => setFooterCopyright(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                                        Contact Subtitle / Description
                                    </label>
                                    <input
                                        type="text"
                                        value={contactSubtitle}
                                        onChange={(e) => setContactSubtitle(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                                        required
                                    />
                                </div>

                                {/* Contact Cards List */}
                                <div className="space-y-4 pt-4 border-t border-white/10">
                                    <h3 className="text-sm font-semibold text-purple-300">
                                        Contact Cards
                                    </h3>
                                    {contactItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between gap-4"
                                        >
                                            <div>
                                                <span className="text-xs font-mono text-purple-400 uppercase tracking-wider">
                                                    {item.label} ({item.type})
                                                </span>
                                                <p className="text-sm font-medium text-white">{item.value}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteContactItem(item.id)}
                                                className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}

                                    {/* Add Contact Item Form */}
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                            + Add New Contact Card
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <input
                                                type="text"
                                                placeholder="Label (e.g. Phone, LinkedIn)"
                                                value={newContactItem.label}
                                                onChange={(e) =>
                                                    setNewContactItem({
                                                        ...newContactItem,
                                                        label: e.target.value,
                                                    })
                                                }
                                                className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Display Value (e.g. +880...)"
                                                value={newContactItem.value}
                                                onChange={(e) =>
                                                    setNewContactItem({
                                                        ...newContactItem,
                                                        value: e.target.value,
                                                    })
                                                }
                                                className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                                            />
                                            <select
                                                value={newContactItem.type}
                                                onChange={(e) =>
                                                    setNewContactItem({
                                                        ...newContactItem,
                                                        type: e.target.value as "email" | "link" | "phone",
                                                    })
                                                }
                                                className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                                            >
                                                <option value="email">Email</option>
                                                <option value="link">Web Link / Profile</option>
                                                <option value="phone">Phone Number</option>
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddContactItem}
                                            className="bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-4 py-2 rounded-xl transition-all cursor-pointer"
                                        >
                                            Add Card
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="bg-purple-600 hover:bg-purple-500 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] cursor-pointer"
                                >
                                    Save Contact Settings
                                </button>
                            </form>
                        </div>
                    )}

                    {/* TAB 8: SETTINGS & BACKUP */}
                    {activeTab === "settings" && (
                        <div className="space-y-10">
                            {/* Security / Passcode */}
                            <div>
                                <div className="border-b border-white/10 pb-4 mb-6">
                                    <h2 className="text-2xl font-bold text-white">Security & Login</h2>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Update your Admin portal login username and password.
                                    </p>
                                </div>

                                <form onSubmit={handleSaveCredentials} className="space-y-4 max-w-md">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                                            Admin Username
                                        </label>
                                        <input
                                            type="text"
                                            value={newAdminUser}
                                            onChange={(e) => setNewAdminUser(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            placeholder="Enter new password"
                                            value={newAdminPass}
                                            onChange={(e) => setNewAdminPass(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                                    >
                                        Update Credentials
                                    </button>
                                </form>
                            </div>

                            {/* Data Backup & Restore */}
                            <div>
                                <div className="border-b border-white/10 pb-4 mb-6">
                                    <h2 className="text-2xl font-bold text-white">Backup & GitHub Sync</h2>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Update your portfolio directly on GitHub or export/import JSON backups.
                                    </p>
                                </div>

                                <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl space-y-4 mb-6">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                                            <span>🐙</span> Direct GitHub API Auto-Publish (Method 2)
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPublishStatus("idle");
                                                setPublishMessage("");
                                                setIsPublishModalOpen(true);
                                            }}
                                            className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer"
                                        >
                                            🚀 Publish Now
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-300 leading-relaxed">
                                        When you click <strong>Publish to Live</strong>, your admin panel automatically commits <code className="text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">data/portfolio.json</code> directly to your GitHub repository using GitHub REST API. GitHub Actions will then rebuild and redeploy your live site automatically in ~30 seconds!
                                    </p>
                                    <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                        <span>Target Repo: <strong className="text-white font-mono">{publishRepo || "AzizRezaPrince/Personal_Portfolio"}</strong></span>
                                        <span>•</span>
                                        <span>Token: <span className="text-emerald-400 font-mono">{publishToken ? "•••••••• (Configured)" : "Not Set Yet"}</span></span>
                                    </div>
                                </div>

                                <div className="p-5 bg-purple-500/10 border border-purple-500/30 rounded-2xl space-y-3 mb-6">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                                            <span>✏️</span> Manual GitHub Web Editor
                                        </h3>
                                        <a
                                            href="https://github.com/AzizRezaPrince/Personal_Portfolio/edit/main/data/portfolio.json"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg transition-all shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                                        >
                                            Edit on GitHub.com →
                                        </a>
                                    </div>
                                    <p className="text-xs text-gray-300 leading-relaxed">
                                        Alternatively, you can edit <code className="text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/30">data/portfolio.json</code> directly on GitHub using their web code editor.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-4 mb-6">
                                    <button
                                        onClick={handleDownloadJSON}
                                        className="bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download JSON File
                                    </button>

                                    <button
                                        onClick={handleCopyJSON}
                                        className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200 text-xs font-medium px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                        Copy JSON to Clipboard
                                    </button>

                                    <button
                                        onClick={() => importFileInputRef.current?.click()}
                                        className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-200 text-xs font-medium px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
                                        </svg>
                                        Upload JSON File
                                    </button>
                                    <input
                                        type="file"
                                        accept=".json"
                                        ref={importFileInputRef}
                                        onChange={handleImportJSONFile}
                                        className="hidden"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                                        Paste JSON to Restore
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Paste JSON configuration string here..."
                                        value={importJsonText}
                                        onChange={(e) => setImportJsonText(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-mono text-gray-300 focus:outline-none focus:border-purple-500"
                                    />
                                    <button
                                        onClick={handleImportJSONText}
                                        disabled={!importJsonText.trim()}
                                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white text-xs font-medium px-4 py-2 rounded-xl transition-all cursor-pointer"
                                    >
                                        Import Pasted JSON
                                    </button>
                                </div>
                            </div>

                            {/* Reset Section */}
                            <div className="pt-6 border-t border-red-500/20">
                                <h3 className="text-base font-bold text-red-400 mb-1">
                                    Danger Zone
                                </h3>
                                <p className="text-xs text-gray-400 mb-4">
                                    Reset all portfolio text, experiences, and projects to initial state.
                                </p>
                                <button
                                    onClick={handleResetAll}
                                    className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                                >
                                    Reset Everything to Default
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* MODAL: EDUCATION */}
            <AnimatePresence>
                {isEduModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#18181f] border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                        >
                            <h3 className="text-xl font-bold text-white mb-4">
                                {editingEdu ? "Edit Education" : "Add Education"}
                            </h3>
                            <form onSubmit={handleSaveEdu} className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Institution Name</label>
                                    <input
                                        type="text"
                                        value={eduForm.institution}
                                        onChange={(e) =>
                                            setEduForm({ ...eduForm, institution: e.target.value })
                                        }
                                        placeholder="e.g. PSTU"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Degree / Level</label>
                                    <input
                                        type="text"
                                        value={eduForm.degree}
                                        onChange={(e) =>
                                            setEduForm({ ...eduForm, degree: e.target.value })
                                        }
                                        placeholder="e.g. Bachelor of Science in CSE"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Duration / Year</label>
                                        <input
                                            type="text"
                                            value={eduForm.year}
                                            onChange={(e) =>
                                                setEduForm({ ...eduForm, year: e.target.value })
                                            }
                                            placeholder="e.g. 2022 - Present"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Grade / GPA (Optional)</label>
                                        <input
                                            type="text"
                                            value={eduForm.grade}
                                            onChange={(e) =>
                                                setEduForm({ ...eduForm, grade: e.target.value })
                                            }
                                            placeholder="e.g. GPA: 5.00 / 5.00"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setIsEduModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white transition-all cursor-pointer"
                                    >
                                        {editingEdu ? "Save Changes" : "Create Item"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: EXPERIENCE */}
            <AnimatePresence>
                {isExpModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#18181f] border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                        >
                            <h3 className="text-xl font-bold text-white mb-4">
                                {editingExp ? "Edit Experience" : "Add Experience"}
                            </h3>
                            <form onSubmit={handleSaveExp} className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Role / Designation</label>
                                    <input
                                        type="text"
                                        value={expForm.role}
                                        onChange={(e) =>
                                            setExpForm({ ...expForm, role: e.target.value })
                                        }
                                        placeholder="e.g. Assistant General Secretary"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Organization / Club</label>
                                    <input
                                        type="text"
                                        value={expForm.organization}
                                        onChange={(e) =>
                                            setExpForm({ ...expForm, organization: e.target.value })
                                        }
                                        placeholder="e.g. CSE Club PSTU"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Duration / Years</label>
                                    <input
                                        type="text"
                                        value={expForm.year}
                                        onChange={(e) =>
                                            setExpForm({ ...expForm, year: e.target.value })
                                        }
                                        placeholder="e.g. 2025 - Present"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Description (Bullets/Multiline)</label>
                                    <textarea
                                        rows={4}
                                        value={expForm.description}
                                        onChange={(e) =>
                                            setExpForm({ ...expForm, description: e.target.value })
                                        }
                                        placeholder="Describe your responsibilities and achievements..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setIsExpModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white transition-all cursor-pointer"
                                    >
                                        {editingExp ? "Save Changes" : "Create Item"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: PROJECT */}
            <AnimatePresence>
                {isProjModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#18181f] border border-white/10 rounded-3xl p-6 w-full max-w-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] my-8"
                        >
                            <h3 className="text-xl font-bold text-white mb-4">
                                {editingProj ? "Edit Project" : "Add Project"}
                            </h3>
                            <form onSubmit={handleSaveProj} className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Project Title</label>
                                    <input
                                        type="text"
                                        value={projForm.title}
                                        onChange={(e) =>
                                            setProjForm({ ...projForm, title: e.target.value })
                                        }
                                        placeholder="e.g. Prismio"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Short Description</label>
                                    <input
                                        type="text"
                                        value={projForm.desc}
                                        onChange={(e) =>
                                            setProjForm({ ...projForm, desc: e.target.value })
                                        }
                                        placeholder="e.g. Interactive 3D Learning App"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">
                                        Tags (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={projForm.tags}
                                        onChange={(e) =>
                                            setProjForm({ ...projForm, tags: e.target.value })
                                        }
                                        placeholder="e.g. Flutter, 3D Visualization, UI"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                                    />
                                </div>

                                {/* Image section with file upload or URL */}
                                <div className="space-y-2">
                                    <label className="block text-xs text-gray-400">
                                        Project Image (Upload File or Enter URL / Path)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={projForm.image}
                                            onChange={(e) =>
                                                setProjForm({ ...projForm, image: e.target.value })
                                            }
                                            placeholder="/prismio.png or https://..."
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => projectFileInputRef.current?.click()}
                                            className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                                        >
                                            Upload File
                                        </button>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            ref={projectFileInputRef}
                                            onChange={handleProjectImageUpload}
                                            className="hidden"
                                        />
                                    </div>
                                    {projForm.image && (
                                        <div className="relative h-28 w-full rounded-xl overflow-hidden bg-black/40 border border-white/10">
                                            <img
                                                src={formatImageUrl(projForm.image)}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Live Demo URL</label>
                                        <input
                                            type="text"
                                            value={projForm.demoUrl}
                                            onChange={(e) =>
                                                setProjForm({ ...projForm, demoUrl: e.target.value })
                                            }
                                            placeholder="https://..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">GitHub Repo URL</label>
                                        <input
                                            type="text"
                                            value={projForm.githubUrl}
                                            onChange={(e) =>
                                                setProjForm({ ...projForm, githubUrl: e.target.value })
                                            }
                                            placeholder="https://github.com/..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setIsProjModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white transition-all cursor-pointer"
                                    >
                                        {editingProj ? "Save Changes" : "Create Project"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: GITHUB AUTO-PUBLISH (METHOD 2) */}
            <AnimatePresence>
                {isPublishModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="bg-[#15151c] border border-emerald-500/30 rounded-3xl p-6 md:p-8 w-full max-w-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden"
                        >
                            {/* Ambient Glow */}
                            <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                    🐙
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">
                                        Publish to Live Portfolio
                                    </h3>
                                    <p className="text-xs text-gray-400">
                                        Auto-commit to GitHub & trigger live deployment
                                    </p>
                                </div>
                            </div>

                            {/* Status Notifications */}
                            {publishStatus === "loading" && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-5 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs"
                                >
                                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0" />
                                    <span>{publishMessage}</span>
                                </motion.div>
                            )}

                            {publishStatus === "success" && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-5 p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-emerald-200 text-xs space-y-2"
                                >
                                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Published Successfully to GitHub!
                                    </div>
                                    <p className="text-gray-300 leading-relaxed">
                                        GitHub Actions is now rebuilding and deploying your changes. Your live portfolio link will update automatically in ~30 seconds!
                                    </p>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {actionsUrl && (
                                            <a
                                                href={actionsUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                            >
                                                View GitHub Deployment Progress →
                                            </a>
                                        )}
                                        <a
                                            href="https://azizrezaprince.github.io/Personal_Portfolio/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                        >
                                            Open Live Portfolio ↗
                                        </a>
                                    </div>
                                </motion.div>
                            )}

                            {publishStatus === "error" && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-xs flex items-start gap-2.5"
                                >
                                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <p className="font-semibold">{publishMessage}</p>
                                        <p className="text-gray-400 mt-1">Make sure your GitHub Token has <code className="text-red-300 font-mono">repo</code> permissions.</p>
                                    </div>
                                </motion.div>
                            )}

                            <form onSubmit={handlePublishToGitHub} className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                                            GitHub Personal Access Token (PAT)
                                        </label>
                                        <a
                                            href="https://github.com/settings/tokens/new?scopes=repo&description=Personal+Portfolio+Admin"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[11px] text-purple-400 hover:text-purple-300 underline"
                                        >
                                            Generate Token on GitHub ↗
                                        </a>
                                    </div>
                                    <input
                                        type="password"
                                        value={publishToken}
                                        onChange={(e) => setPublishToken(e.target.value)}
                                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                                        required
                                    />
                                    <p className="text-[11px] text-gray-500 mt-1">
                                        Your token is stored safely only inside your local browser.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                                        GitHub Repository
                                    </label>
                                    <input
                                        type="text"
                                        value={publishRepo}
                                        onChange={(e) => setPublishRepo(e.target.value)}
                                        placeholder="AzizRezaPrince/Personal_Portfolio"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                                        required
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setIsPublishModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={publishStatus === "loading"}
                                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-xs font-semibold text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer flex items-center gap-2"
                                    >
                                        {publishStatus === "loading" ? (
                                            <>
                                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Publishing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>🚀 Publish to Live Site Now</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

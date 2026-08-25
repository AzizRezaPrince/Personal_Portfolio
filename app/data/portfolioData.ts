import initialPortfolioData from "@/data/portfolio.json";

export interface HeroData {
    name: string;
    title: string;
    tagline1Prefix: string;
    tagline1Highlight: string;
    tagline2Prefix: string;
    tagline2Highlight: string;
}

export interface EducationItem {
    id: string;
    degree: string;
    institution: string;
    year: string;
    grade?: string;
}

export interface ExperienceItem {
    id: string;
    role: string;
    organization: string;
    year: string;
    description: string;
}

export interface ProjectItem {
    id: string;
    title: string;
    desc: string;
    tags: string[];
    image: string;
    demoUrl?: string;
    githubUrl?: string;
    featured?: boolean;
}

export interface ContactItem {
    id: string;
    label: string;
    value: string;
    type: "email" | "link" | "phone";
    url?: string;
}

export interface AwardCertificateItem {
    id: string;
    title: string;
    issuer: string;
    date: string;
    description?: string;
    category: "Award" | "Certificate" | "Honor" | "Badge";
    image?: string;
    credentialUrl?: string;
    featured?: boolean;
}

export interface PortfolioData {
    hero: HeroData;
    about: {
        bio: string[];
        skills: string[];
        languages: string[];
    };
    education: EducationItem[];
    experience: ExperienceItem[];
    projects: ProjectItem[];
    certificates?: AwardCertificateItem[];
    contact: {
        title: string;
        subtitle: string;
        items: ContactItem[];
    };
    footer: {
        copyright: string;
    };
    updatedAt?: number;
}

export const defaultPortfolioData: PortfolioData = initialPortfolioData as PortfolioData;

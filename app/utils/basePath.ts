export const getBasePath = () => {
    if (typeof window !== 'undefined') {
        // Only on GitHub Pages domain or when path explicitly begins with /Personal_Portfolio
        if (window.location.hostname.endsWith('github.io') || window.location.pathname.startsWith('/Personal_Portfolio')) {
            return '/Personal_Portfolio';
        }
        return '';
    }
    return process.env.GITHUB_ACTIONS === 'true' ? '/Personal_Portfolio' : '';
};


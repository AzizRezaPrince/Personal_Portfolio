export const getBasePath = () => {
    if (typeof window !== 'undefined') {
        if (window.location.hostname.endsWith('github.io')) {
            return '/Personal_Portfolio';
        }
    }
    return process.env.NEXT_PUBLIC_BASE_PATH || '';
};

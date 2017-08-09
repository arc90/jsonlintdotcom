// parses URL
export default function parseQuery() {
    const { search } = location;
    const query = {};
    const parts = search.replace('?', '').split('&');

    if (!search) {
        return query;
    }

    for (const part of parts) {
        const [key, value] = part.split('=');
        query[decodeURIComponent(key)] = decodeURIComponent(value || null);
    }

    return query;
}

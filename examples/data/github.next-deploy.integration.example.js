module.exports = {
    metadata: {
        name: 'github-next-deploy',
        description: 'Show when the repository will be deployed next based on a hardcoded schedule',
        match: {
            contextType: 'github',
            context: {
                'page.repository': { startsWith: 'my-org/' }
            }
        },
        requiredSecrets: [],
        cache: 60
    },
    run: async function (context, secrets = {}, dataFiles = []) {
        // Hardcoded deployment schedule:
        // Days: Tuesday, Wednesday, Thursday
        // Times (local time): 09:00, 15:00, 20:00
        const allowedDays = new Set([2, 3, 4]); // 0=Sun ... 6=Sat
        const allowedHours = [9, 15, 20];

        const now = new Date();

        function nextScheduled(nowDate) {
            const candidates = [];
            for (let d = 0; d <= 7; d++) { // look up to one week ahead
                const probe = new Date(nowDate);
                probe.setDate(nowDate.getDate() + d);
                const day = probe.getDay();
                if (!allowedDays.has(day)) continue;
                for (const h of allowedHours) {
                    const slot = new Date(probe);
                    slot.setHours(h, 0, 0, 0);
                    if (slot > nowDate) {
                        candidates.push(slot.getTime());
                    }
                }
            }
            if (candidates.length === 0) return null;
            const ts = Math.min(...candidates);
            return new Date(ts);
        }

        function formatDiff(from, to) {
            const ms = Math.max(0, to.getTime() - from.getTime());
            const HOUR = 60 * 60 * 1000;
            const DAY = 24 * HOUR;
            const days = Math.floor(ms / DAY);
            const hours = Math.floor((ms - days * DAY) / HOUR);
            if (days > 0) return `Next deploy: ${days}d ${hours}h`;
            return `Next deploy: ${hours}h`;
        }

        const next = nextScheduled(now);
        if (!next) return [];

        return [
            { type: 'text', status: 'relevant', content: formatDiff(now, next) }
        ];
    }
};


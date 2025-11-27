import { ref } from 'vue';

export function useSecureImage() {
    const refreshing = ref(false);

    const isUrlExpired = (url) => {
        if (!url) return true;
        try {
            const urlObj = new URL(url);
            const params = new URLSearchParams(urlObj.search);
            const expires = params.get('X-Amz-Expires');
            const date = params.get('X-Amz-Date');

            if (!expires || !date) return false; // Can't determine, assume valid or permanent

            // Parse X-Amz-Date (format: YYYYMMDDThhmmssZ)
            const year = parseInt(date.substring(0, 4));
            const month = parseInt(date.substring(4, 6)) - 1;
            const day = parseInt(date.substring(6, 8));
            const hour = parseInt(date.substring(9, 11));
            const minute = parseInt(date.substring(11, 13));
            const second = parseInt(date.substring(13, 15));

            const creationDate = new Date(Date.UTC(year, month, day, hour, minute, second));
            const expirationDate = new Date(creationDate.getTime() + (parseInt(expires) * 1000));

            // Add a buffer of 1 hour to be safe
            const now = new Date();
            return now >= new Date(expirationDate.getTime() - 3600000);
        } catch (e) {
            console.error('Error checking URL expiration:', e);
            return false;
        }
    };

    const getFreshUrl = async (attachment) => {
        if (!attachment.bucket || !attachment.key) {
            return attachment.url;
        }

        // Check if URL is expired or about to expire
        if (!isUrlExpired(attachment.url)) {
            return attachment.url;
        }

        console.log('URL expired or missing, refreshing signed URL for:', attachment.filename);
        refreshing.value = true;

        try {
            const response = await fetch('https://mr04m3gkk9.execute-api.us-east-1.amazonaws.com/dev/s3/signed-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bucket: attachment.bucket,
                    key: attachment.key
                })
            });

            const result = await response.json();
            if (result.success) {
                console.log('New signed URL generated');
                return result.signedUrl;
            } else {
                console.error('Failed to refresh URL:', result.error);
                return attachment.url;
            }
        } catch (error) {
            console.error('Error refreshing signed URL:', error);
            return attachment.url;
        } finally {
            refreshing.value = false;
        }
    };

    const refreshAttachments = async (attachments) => {
        if (!attachments || attachments.length === 0) return [];

        const refreshed = await Promise.all(attachments.map(async (att) => {
            const newUrl = await getFreshUrl(att);
            return { ...att, url: newUrl };
        }));

        return refreshed;
    };

    return {
        getFreshUrl,
        refreshAttachments,
        isUrlExpired,
        refreshing
    };
}

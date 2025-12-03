// src/lib/capacitorStorage.js
// Custom storage adapter for Supabase using Capacitor Preferences API

import { Preferences } from '@capacitor/preferences';

export const CapacitorStorage = {
    async getItem(key) {
        const { value } = await Preferences.get({ key });
        return value;
    },

    async setItem(key, value) {
        await Preferences.set({
            key,
            value
        });
    },

    async removeItem(key) {
        await Preferences.remove({ key });
    }
};

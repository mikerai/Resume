// src/api/users.js

import { useAuthStore } from '@/store/auth.store'; 

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Función auxiliar para acceder a la tienda de autenticación.
 * Se utiliza para asegurar que useAuthStore() se llame en el contexto de ejecución.
 * @returns {object} La tienda de autenticación de Pinia.
 */
function getAuthStore() {
    return useAuthStore();
}

// ---------------------------------------------------------
// GET /users (Protegida)
// ---------------------------------------------------------
export async function fetchUsers(params = {}) {
    const authStore = getAuthStore();
    const token = authStore.token;

    if (!token) throw new Error("No hay token disponible. El usuario no está autenticado.");
    
    const query = new URLSearchParams(params).toString();
    const url = `${API_URL}/users${query ? `?${query}` : ""}`;

    const res = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });

    if (!res.ok) throw new Error("Error al obtener usuarios");

    return res.json();
}

// ---------------------------------------------------------
// POST /users (Protegida - Asume rol Admin para crear otros)
// ---------------------------------------------------------
export async function createUser(payload) {
    const authStore = getAuthStore();
    const token = authStore.token;
    
    if (!token) throw new Error("No hay token disponible. El usuario no está autenticado.");

    const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Error al crear usuario");

    return res.json();
}

// ---------------------------------------------------------
// PUT /users/{id} (Protegida)
// ---------------------------------------------------------
export async function updateUser(id, payload) {
    const authStore = getAuthStore();
    const token = authStore.token;
    
    if (!token) throw new Error("No hay token disponible. El usuario no está autenticado.");

    const res = await fetch(`${API_URL}/users/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Error al actualizar usuario");

    return res.json();
}

// ---------------------------------------------------------
// DELETE /users/{id} (Protegida)
// ---------------------------------------------------------
export async function deleteUser(id) {
    const authStore = getAuthStore();
    const token = authStore.token;

    if (!token) throw new Error("No hay token disponible. El usuario no está autenticado.");

    const res = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });

    if (!res.ok) throw new Error("Error al eliminar usuario");

    return res.json();
}
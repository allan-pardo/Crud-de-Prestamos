const API_URL = "https://retoolapi.dev/2ZoFpQ/data";

async function realizarPeticion(url = API_URL, opciones = {}) {
    let respuesta;

    try {
        respuesta = await fetch(url, opciones);
    } catch (error) {
        throw new Error("No fue posible conectar con la API de Retool. Verifique su conexión.");
    }

    if (!respuesta.ok) {
        const detalle = await respuesta.text();
        const mensaje = detalle && detalle.length < 180
            ? detalle
            : `La API respondió con el código ${respuesta.status}.`;

        throw new Error(mensaje);
    }

    if (respuesta.status === 204) {
        return null;
    }

    const contenido = await respuesta.text();
    return contenido ? JSON.parse(contenido) : null;
}

export async function obtenerPrestamos() {
    const prestamos = await realizarPeticion();

    if (!Array.isArray(prestamos)) {
        throw new Error("La API no devolvió una lista válida de préstamos.");
    }

    return prestamos;
}

export async function obtenerPrestamo(id) {
    return realizarPeticion(`${API_URL}/${encodeURIComponent(id)}`);
}

export async function registrarPrestamo(prestamo) {
    return realizarPeticion(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prestamo)
    });
}

export async function actualizarPrestamo(id, prestamo) {
    return realizarPeticion(`${API_URL}/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prestamo)
    });
}

export async function eliminarPrestamo(id) {
    return realizarPeticion(`${API_URL}/${encodeURIComponent(id)}`, {
        method: "DELETE"
    });
}

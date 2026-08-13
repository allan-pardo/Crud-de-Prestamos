import * as prestamoService from "../services/prestamoService.js";

const formPrestamo = document.querySelector("#formPrestamo");
const prestamoId = document.querySelector("#prestamoId");
const solicitante = document.querySelector("#solicitante");
const equipo = document.querySelector("#equipo");
const fechaPrestamo = document.querySelector("#fechaPrestamo");
const estado = document.querySelector("#estado");
const tituloFormulario = document.querySelector("#tituloFormulario");
const btnGuardar = document.querySelector("#btnGuardar");
const textoBtnGuardar = document.querySelector("#textoBtnGuardar");
const btnCancelar = document.querySelector("#btnCancelar");
const btnRecargar = document.querySelector("#btnRecargar");
const tablaPrestamos = document.querySelector("#tablaPrestamos");
const estadoVacio = document.querySelector("#estadoVacio");
const mensaje = document.querySelector("#mensaje");

function mostrarMensaje(texto, tipo = "success") {
    mensaje.textContent = texto;
    mensaje.className = `alert alert-${tipo}`;
    mensaje.hidden = false;
}

function ocultarMensaje() {
    mensaje.hidden = true;
    mensaje.textContent = "";
}

function mostrarCargando() {
    estadoVacio.hidden = true;
    tablaPrestamos.innerHTML = `
        <tr>
            <td colspan="5" class="text-center py-5 text-secondary">
                <span class="spinner-border spinner-border-sm text-success me-2" aria-hidden="true"></span>
                Cargando préstamos...
            </td>
        </tr>
    `;
}

function formatearFecha(fecha) {
    if (!fecha || fecha === "Invalid date") {
        return "Sin fecha válida";
    }

    const partes = String(fecha).slice(0, 10).split("-");
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : fecha;
}

function crearCelda(texto) {
    const celda = document.createElement("td");
    celda.textContent = texto || "—";
    return celda;
}

function crearBotonAccion(accion, id, clases, icono, etiqueta) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = clases;
    boton.dataset.accion = accion;
    boton.dataset.id = id;
    boton.innerHTML = `<i class="bi ${icono} me-1" aria-hidden="true"></i>${etiqueta}`;
    return boton;
}

function mostrarPrestamos(prestamos) {
    tablaPrestamos.replaceChildren();
    estadoVacio.hidden = prestamos.length !== 0;

    for (const prestamo of prestamos) {
        const fila = document.createElement("tr");
        fila.append(
            crearCelda(prestamo.solicitante),
            crearCelda(prestamo.equipo),
            crearCelda(formatearFecha(prestamo.fechaPrestamo)),
            crearCelda(prestamo.estado)
        );

        const acciones = document.createElement("td");
        acciones.className = "text-end acciones-prestamo";
        acciones.append(
            crearBotonAccion(
                "editar",
                prestamo.id,
                "btn btn-outline-primary btn-sm me-1",
                "bi-pencil-square",
                "Editar"
            ),
            crearBotonAccion(
                "eliminar",
                prestamo.id,
                "btn btn-outline-danger btn-sm",
                "bi-trash",
                "Eliminar"
            )
        );

        fila.append(acciones);
        tablaPrestamos.append(fila);
    }
}

async function cargarPrestamos() {
    mostrarCargando();

    try {
        const prestamos = await prestamoService.obtenerPrestamos();
        mostrarPrestamos(prestamos);
        return true;
    } catch (error) {
        tablaPrestamos.replaceChildren();
        mostrarMensaje(error.message, "danger");
        return false;
    }
}

function obtenerDatosFormulario() {
    return {
        solicitante: solicitante.value.trim(),
        equipo: equipo.value,
        fechaPrestamo: fechaPrestamo.value,
        estado: estado.value.trim()
    };
}

function restablecerFormulario() {
    formPrestamo.reset();
    prestamoId.value = "";
    tituloFormulario.textContent = "Registrar préstamo";
    textoBtnGuardar.textContent = "Registrar préstamo";
    btnCancelar.hidden = true;
}

function prepararFormularioParaEditar(prestamo) {
    prestamoId.value = prestamo.id;
    solicitante.value = prestamo.solicitante ?? "";
    equipo.value = prestamo.equipo ?? "";
    fechaPrestamo.value = prestamo.fechaPrestamo && prestamo.fechaPrestamo !== "Invalid date"
        ? String(prestamo.fechaPrestamo).slice(0, 10)
        : "";
    estado.value = prestamo.estado ?? "";
    tituloFormulario.textContent = "Actualizar préstamo";
    textoBtnGuardar.textContent = "Guardar cambios";
    btnCancelar.hidden = false;
    solicitante.focus();
    formPrestamo.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function seleccionarPrestamo(id) {
    ocultarMensaje();

    try {
        const prestamo = await prestamoService.obtenerPrestamo(id);
        prepararFormularioParaEditar(prestamo);
    } catch (error) {
        mostrarMensaje(error.message, "danger");
    }
}

async function eliminarPrestamo(id) {
    const confirmado = window.confirm("¿Desea eliminar este préstamo?");

    if (!confirmado) {
        return;
    }

    ocultarMensaje();

    try {
        await prestamoService.eliminarPrestamo(id);

        if (prestamoId.value === String(id)) {
            restablecerFormulario();
        }

        const tablaActualizada = await cargarPrestamos();
        mostrarMensaje(
            tablaActualizada
                ? "Préstamo eliminado correctamente."
                : "El préstamo se eliminó, pero no fue posible recargar la tabla.",
            tablaActualizada ? "success" : "warning"
        );
    } catch (error) {
        mostrarMensaje(error.message, "danger");
    }
}

async function guardarPrestamo(evento) {
    evento.preventDefault();

    if (!formPrestamo.checkValidity()) {
        formPrestamo.reportValidity();
        return;
    }

    ocultarMensaje();
    btnGuardar.disabled = true;
    const prestamo = obtenerDatosFormulario();
    const id = prestamoId.value;

    try {
        if (id) {
            await prestamoService.actualizarPrestamo(id, prestamo);
        } else {
            await prestamoService.registrarPrestamo(prestamo);
        }

        restablecerFormulario();
        const tablaActualizada = await cargarPrestamos();
        const accionRealizada = id ? "actualizó" : "registró";
        const mensajeExito = id
            ? "Préstamo actualizado correctamente."
            : "Préstamo registrado correctamente.";

        mostrarMensaje(
            tablaActualizada
                ? mensajeExito
                : `El préstamo se ${accionRealizada}, pero no fue posible recargar la tabla.`,
            tablaActualizada ? "success" : "warning"
        );
    } catch (error) {
        mostrarMensaje(error.message, "danger");
    } finally {
        btnGuardar.disabled = false;
    }
}

formPrestamo.addEventListener("submit", guardarPrestamo);
btnCancelar.addEventListener("click", restablecerFormulario);
btnRecargar.addEventListener("click", () => {
    ocultarMensaje();
    cargarPrestamos();
});

tablaPrestamos.addEventListener("click", async (evento) => {
    const boton = evento.target.closest("button[data-accion]");

    if (!boton) {
        return;
    }

    if (boton.dataset.accion === "editar") {
        await seleccionarPrestamo(boton.dataset.id);
    } else if (boton.dataset.accion === "eliminar") {
        await eliminarPrestamo(boton.dataset.id);
    }
});

cargarPrestamos();

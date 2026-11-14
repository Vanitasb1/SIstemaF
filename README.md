# Sistema Web de Estacionamiento de Vehículos (AutoPark Pro)

Sistema web completo desarrollado cumpliendo punto por punto con los requerimientos técnicos y funcionales solicitados en la especificación.

---

## 🛠️ Tecnologías Utilizadas
- **Backend:** Node.js, Express, PostgreSQL (`pg`), `dotenv`, CORS.
- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons, jsPDF & jsPDF-AutoTable.
- **Persistencia y Adaptador Resiliente:** Soporte nativo para PostgreSQL con script SQL y modo seguro con persistencia en memoria para pruebas instantáneas.

---

## 📋 Módulos Implementados

### 1. Módulo de Gestión de Clientes
- **Registro de clientes habituales:** Datos de contacto, CI/NIT, dirección, convenios y administración de mensualidades.
- **Control de estados de mensualidad:** Detección automática de vigencia (`Al Día` vs. `Vencido`).
- **Controladores CRUD Asíncronos:** Endpoints REST en Node.js.
- **Interfaz Interactiva:** Tablas dinámicas, filtros y validaciones.

### 2. Módulo de Gestión de Vehículos
- **Registro de datos clave:** Placa, Marca, Modelo, Color, Tipo (`Auto`, `Moto`, `Camioneta`).
- **Vínculo directo:** Relación con propietario (cliente habitual o visitante ocasional).

### 3. Módulo de Celdas / Espacios de Estacionamiento
- **Configuración de espacios:** Estructura organizada por **Pisos**, **Sectores** y **Celdas** con especificación de tipo de vehículo admitido.
- **Monitoreo de estado en vivo:** Vista de celdas Disponibles vs. Ocupadas.
- **Sincronización en vivo:** Peticiones REST automáticas entre Node.js y React para reflejar el estado actual.

### 4. Módulo de Control de Entradas y Salidas (Operativa)
- **Entrada:** Registro de placa, asignación dinámica o manual de una celda disponible y generación inmediata del **Ticket de Entrada en PDF** con fecha y hora.
- **Salida:** Búsqueda rápida por placa o número de ticket, cálculo automático del tiempo transcurrido (en horas y minutos) y aplicación de la tarifa según el tipo de vehículo.

### 5. Módulo de Caja y Cobros
- **Procesamiento de pagos:** Registro de transacciones con soporte para **Efectivo** (con cálculo de cambio) y **Simulación de Pago QR**.
- **Cobro de Mensualidades:** Extensión de periodos mensuales y registro en el libro de caja.
- **Historial de Caja:** Consulta de transacciones y resumen de ingresos del día.

---

## 🔒 Regla Crítica del PDF: Soft-Delete (No eliminación física)
El sistema **no elimina registros de la base de datos**. Cuenta con mecanismos de borrado lógico mediante activación y desactivación de estado (`activo = true / false`) para:
- Clientes / Usuarios
- Vehículos
- Celdas / Espacios

---

## 📄 Exportación de Reportes a PDF
Se integró exportación nativa a PDF para:
1. **Tickets de Entrada:** Formato estándar con placa, celda asignada y marca de tiempo.
2. **Comprobantes de Pago / Salida:** Detalle de tiempo estacionado, importe cobrado y método de pago.
3. **Reporte General de Caja:** Informe detallado de recaudación y transacciones.
4. **Reporte de Clientes y Mensualidades:** Listado de abonados habituales y estado de vigencia.

---

## 🚀 Cómo Iniciar el Sistema

### Opción 1: Ejecución Rápida con 1 Clic (Recomendado)
Haz doble clic en el archivo:
```
INICIAR_SISTEMA.bat
```
Este script iniciará automáticamente tanto el Backend como el Frontend y abrirá tu navegador en `http://localhost:3000`.

### Opción 2: Inicio Manual desde Terminal

1. **Iniciar Backend:**
   ```bash
   cd backend
   npm start
   ```
   *(Servidor corriendo en `http://localhost:4000`)*

2. **Iniciar Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   *(Aplicación web corriendo en `http://localhost:3000`)*

---

## 🗄️ Base de Datos PostgreSQL (Opcional)
Si deseas conectar tu propia instancia local de PostgreSQL:
1. Ejecuta el script SQL ubicado en `backend/src/database/schema.sql`.
2. Configura las credenciales en `backend/.env`.
*(Si PostgreSQL no está encendido, el sistema utiliza su adaptador de respaldo inteligente para que puedas operar y probar todas las funciones de inmediato sin bloqueos).*

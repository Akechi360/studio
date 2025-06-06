# IEQ Nexo (Project AkechiApp)

## Descripción del Proyecto

**IEQ Nexo (anteriormente Project AkechiApp)** es un sistema de gestión integral de IT y procesos internos diseñado para la Clínica IEQ. Su objetivo principal es modernizar y centralizar las operaciones de soporte técnico, inventario y gestión de aprobaciones, eliminando procesos obsoletos y mejorando la eficiencia operativa.

Desarrollado con Next.js y un stack moderno, IEQ Nexo proporciona una interfaz de usuario intuitiva y robusta para gestionar tickets de soporte, controlar el inventario de equipos, supervisar y aprobar solicitudes de compra o pagos a proveedores, y llevar un registro detallado de las actividades de mantenimiento.

## Funcionalidades Principales

* **Gestión de Usuarios y Roles:**
    * Administración de usuarios (creación, edición, eliminación).
    * Roles definidos: `Usuario`, `Admin`, `Presidente`.
    * Control de acceso basado en roles (RBAC) para módulos y funcionalidades específicas.
* **Módulo de Tickets de Soporte:**
    * Creación, seguimiento y gestión del estado de los tickets.
    * Asignación de prioridades (Baja, Media, Alta).
    * Sistema de comentarios para la comunicación en tiempo real.
    * Notificaciones Ntfy para nuevas incidencias o actualizaciones.
* **Módulo de Inventario:**
    * Registro y seguimiento de artículos de IT (computadoras, monitores, periféricos, software, etc.).
    * Gestión de categorías, marcas, modelos, números de serie, cantidad, ubicación y estado.
    * Funcionalidad de importación masiva de artículos desde archivos Excel.
* **Módulo de Aprobaciones:**
    * Digitalización del proceso de solicitudes de compra y pagos a proveedores.
    * Flujo de aprobación para el rol `Presidente`.
    * Gestión de tipo de pago (Contado / Cuotas) con detalles de montos y fechas para cuotas.
    * Registro detallado del historial de actividad de cada solicitud.
    * Notificaciones Ntfy sobre el estado de las solicitudes.
* **Módulo de Mantenimiento:**
    * Registro y seguimiento de casos de mantenimiento para equipos.
    * Gestión de estados y prioridades del caso.
    * Registro de bitácora de actividad para cada caso.
* **Registro de Auditoría:**
    * Registro detallado de acciones clave realizadas en el sistema para trazabilidad y seguridad.
* **Dashboard Interactivo:**
    * Visión general personalizada basada en el rol del usuario (tickets abiertos para Admin, tickets creados para Usuario, aprobaciones pendientes para Presidente).

## Tecnologías Utilizadas

El proyecto está construido sobre un stack robusto y moderno:

* **Frontend:**
    * [Next.js] (React Framework para producción)
    * [React] 
    * [TypeScript]
    * [Tailwind CSS]
    * [Shadcn UI] (Componentes UI basados en Tailwind CSS y Radix UI)
    * [React Hook Form] (Gestión de formularios)
    * [Zod] (Validación de esquemas)
    * [date-fns] (Manejo de fechas)
    * [Lucide React] (Iconos)
    * [XLSX (SheetJS)] (Lectura de archivos Excel para importación)
* **Backend / Base de Datos:**
    * [Next.js API Routes / Server Actions]
    * [Prisma ORM] (ORM para TypeScript y Node.js)
    * [MySQL] (Base de datos relacional)
    * [bcryptjs] (Hashing de contraseñas)
    * [Ntfy] (Servicio de notificaciones Push)
* **Entorno de Desarrollo:**
    * [Node.js]
    * [npm] (Gestor de paquetes)
    * OPCIONAL [Laragon] (Entorno de desarrollo local para Windows con Nginx/Apache, MySQL, etc.)
    * [Git]/[GitHub] (Control de versiones)

## Configuración y Replicación Local

Sigue estos pasos para configurar y ejecutar el proyecto en tu máquina local.

### **Prerrequisitos**

Asegúrate de tener instalado lo siguiente:

* [Node.js](https://nodejs.org/en/download/) (versión 18.x o superior recomendada)
* [npm](https://docs.npmjs.com/cli/v9/commands/npm) (viene con Node.js)
* [Laragon Full](https://laragon.org/download/) (para Nginx como proxy y MySQL)
* [Git](https://git-scm.com/downloads)

### **1. Clonar el Repositorio**

Abre tu terminal (CMD o PowerShell) y clona el repositorio de GitHub:

```bash
git clone <URL_DEL_REPOSITORIO>
cd Akechi_App # O el nombre de la carpeta de tu proyecto

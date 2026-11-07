# Nova Salud — Sistema web de inventario y ventas

Proyecto Fullstack académico para una botica. Incluye frontend React + Vite, backend Node.js + Express y base de datos MySQL.

## Requisitos
- Node.js 18 o superior
- MySQL 8+
- npm

## 1. Base de datos
1. Inicia MySQL.
2. Ejecuta el archivo `database/nova_salud.sql` desde MySQL Workbench o phpMyAdmin.
3. Se crea la base de datos `nova_salud`, sus tablas y algunos productos de demostración.

## 2. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
Configura en `.env` los datos de conexión de tu MySQL. API: `http://localhost:4000`.

Usuario de demostración (si ejecutas el SQL):
- Usuario: `admin`
- Contraseña: `admin123`

Nota: la autenticación de demostración usa bcrypt y JWT. Para crear el usuario inicial, ejecuta `npm run seed` después de configurar `.env`.

## 3. Frontend
En otra terminal:
```bash
cd frontend
npm install
npm run dev
```
Abre la URL que muestra Vite (normalmente `http://localhost:5173`).

## Funcionalidades
- Inicio de sesión con credenciales.
- Panel con resumen de productos, unidades y ventas del día.
- Registro, edición y eliminación de productos.
- Control de stock y alerta visual de stock bajo.
- Registro de ventas con descuento automático de inventario.
- Historial de ventas.
- Reporte resumido de inventario y ventas.

## Estructura
- `frontend/`: interfaz React.
- `backend/`: API REST con Express.
- `database/`: estructura y datos iniciales MySQL.

## Consideraciones
Es una base funcional para fines académicos. Antes de usarla en una botica real se deben agregar pruebas, copias de seguridad, HTTPS, auditoría, permisos por rol, validaciones regulatorias y controles adicionales de seguridad.

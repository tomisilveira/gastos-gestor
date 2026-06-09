## **README.md** actualizado

```markdown
# 🏠 Gestor de Gastos - Servicios y Alquileres

Aplicación web para administrar gastos mensuales de servicios e impuestos de propiedades en alquiler. Permite registrar gastos por propiedad, categorizarlos y exportar informes mensuales para compartir con inquilinos.

![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)
![Google Sheets](https://img.shields.io/badge/Google_Sheets-Database-34A853?logo=googlesheets)
![Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7?logo=netlify)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript)

## ✨ Características

- 🔐 **Protección con contraseña** - Acceso seguro con hash SHA-256 guardado en tu planilla
- ☁️ **Base de datos en Google Sheets** - Datos persistentes estructurados en pestañas por propiedad
- 📊 **Dashboard** - Vista general y detalle por propiedad
- 💰 **Registro de gastos** - Categorías y conceptos predefinidos
- 🏘️ **Múltiples propiedades** - Gestiona gastos de diferentes inmuebles
- 📥 **Exportación mensual** - Genera informes en Excel por mes y propiedad
- 🖨️ **Impresión directa** - Imprime o guarda como PDF los resúmenes
- 📱 **Diseño responsive** - Se adapta a cualquier dispositivo
- 🎨 **Paleta de colores moderna** - Diseño limpio y profesional

## 🛠️ Tecnologías Utilizadas

- **React 18** - Biblioteca principal de UI
- **Google Sheets & Apps Script** - Base de datos en la nube accesible y editable directamente en hojas de cálculo
- **XLSX** - Generación de archivos Excel
- **date-fns** - Manejo de fechas con localización en español
- **CSS3** - Diseño responsive sin frameworks

## 📦 Instalación Local

### Requisitos Previos
- Node.js (v18 o superior)
- npm (v6 o superior)
- Una cuenta de Google (para Google Sheets)

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/tomisilveira/gastos-gestor.git
cd gastos-gestor
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno (Opcional)**
Crea un archivo `.env` en la raíz del proyecto si deseas preconfigurar tu planilla (de lo contrario, podrás ingresarla directamente en la aplicación web al iniciar):
```
REACT_APP_GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/tu-id-de-despliegue/exec
```

4. **Configurar planilla de Google Sheets**
La primera vez que abras la aplicación local o en producción, la interfaz te guiará paso a paso para configurar tu planilla de Google Sheets de la siguiente manera:
- Crea una nueva planilla en Google Sheets.
- Ve a **Extensiones ➔ Apps Script**.
- Borra cualquier código por defecto y pega el contenido del archivo `google-apps-script.js` (ubicado en la raíz de tu proyecto).
- Presiona Guardar e implementa como **Aplicación web** corriendo como **Yo** y con acceso para **Cualquiera**.
- Copia la URL del despliegue y pégala en la pantalla de bienvenida.
- Automáticamente se crearán las pestañas de configuración y propiedades en tu primer inicio.

5. **Iniciar servidor de desarrollo**
```bash
npm start
```

6. **Abrir en el navegador**
```
http://localhost:3000
```

## 🚢 Deploy en Netlify

### Configuración de variables de entorno

En Netlify, ve a **Site settings** → **Environment variables** y agrega opcionalmente la variable de tu planilla:

| Variable | Descripción |
|----------|-------------|
| `REACT_APP_GOOGLE_SHEETS_WEBHOOK_URL` | URL de tu Apps Script desplegado (Opcional, si no se ingresa, se solicitará en la UI y se guardará en localStorage) |
| `NODE_VERSION` | `18` |

### Opción 1: Deploy continuo con Git

1. Conecta tu repositorio de GitHub a Netlify
2. Configura las variables de entorno
3. Build command: `npm run build`
4. Publish directory: `build`

### Opción 2: Deploy manual

```bash
npm run build
npx netlify-cli deploy --prod --dir=build
```

## 📖 Guía de Uso

### Primer acceso
1. Al abrir la app por primera vez, crea una contraseña (mínimo 4 caracteres)
2. La contraseña se guarda con hash SHA-256 en Supabase
3. Usa esta contraseña para accesos futuros desde cualquier dispositivo

### Agregar propiedades
1. Ve a la sección "🏘️ Propiedades"
2. Completa nombre, dirección y tipo de propiedad
3. Las propiedades se guardan en la nube

### Registrar gastos
1. Ve a "💰 Agregar Gastos"
2. Selecciona la fecha del gasto
3. Elige la categoría (Impuestos por defecto)
4. Selecciona el concepto del menú desplegable
5. Ingresa el monto
6. Selecciona la propiedad correspondiente
7. Opcionalmente agrega una descripción

### Ver gastos
1. **Dashboard → Vista General**: Todos los gastos del mes agrupados por categoría
2. **Dashboard → Por Propiedad**: Filtra gastos por propiedad específica

### Exportar informes
1. Ve a "📥 Exportar"
2. Selecciona mes, año y propiedad
3. Exporta a Excel o imprime como PDF
4. El Excel incluye: fecha, concepto, categoría, monto y descripción

### Categorías disponibles

| Categoría | Conceptos |
|-----------|-----------|
| **Impuestos** | Municipalidad, Inmobiliario, Escuela, Patentes Autos |
| **Servicios** | Agua, Electricidad, Gas, Cable, Teléfono, Internet |
| **Mantenimiento** | Limpieza, Jardinería, Pintura, Plomería, Electricidad |
| **Seguros** | Seguros Autos, Seguro Hogar, Seguro Vida |
| **Administración** | Gastos Administrativos, Honorarios, Papelería |
| **Reparaciones** | Electrodomésticos, Estructura, Techos, Pisos |

## 📁 Estructura del Proyecto

```
gastos-gestor/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Dashboard.js          # Panel principal con vista general y por propiedad
│   │   ├── GastosForm.js         # Formulario para registrar gastos
│   │   ├── PropiedadesManager.js # Gestión CRUD de propiedades
│   │   ├── ExportarMensual.js    # Exportación e impresión de informes
│   │   └── ResumenInquilinos.js  # Detalle de gastos por inquilino
│   ├── utils/
│   │   ├── calculos.js           # Funciones de cálculos financieros
│   │   └── exportUtils.js        # Utilidades para exportar a Excel
│   ├── supabaseClient.js         # Configuración de conexión a Supabase
│   ├── App.js                    # Componente principal con login
│   ├── App.css                   # Estilos de la aplicación
│   └── index.js                  # Punto de entrada
├── .env                          # Variables de entorno (no se sube a Git)
├── .gitignore
├── netlify.toml                  # Configuración de Netlify
├── package.json
└── README.md
```

## 🔒 Seguridad

- Contraseñas almacenadas con hash SHA-256
- Contraseña protegida mediante hash SHA-256 almacenado en la planilla
- Conexión cifrada HTTPS a través del Webhook oficial de Google
- Datos almacenados en hojas independientes legibles bajo el control del usuario

## 🎨 Paleta de Colores

| Color | Hex | Uso |
|-------|-----|-----|
| Negro profundo | `#091413` | Fondos oscuros, headers |
| Verde oscuro | `#285A48` | Gradientes, hover |
| Verde principal | `#408A71` | Botones, acentos |
| Verde claro | `#B0E4CC` | Bordes, highlights |

## 📱 Responsive

La app se adapta a:
- 💻 Desktop (1200px+)
- 📱 Tablet (768px)
- 📱 Mobile (320px)

## 🚀 Próximas Características

- [ ] Autenticación con email/password de Supabase
- [ ] Múltiples usuarios por cuenta
- [ ] Recordatorios de vencimientos
- [ ] Gráficos estadísticos mensuales
- [ ] Subida de comprobantes/facturas
- [ ] Cálculo automático de prorrateos

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/NuevaFuncionalidad`)
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/NuevaFuncionalidad`)
5. Abre un Pull Request

## 📝 Licencia

MIT © Tomás Silveira

## 👨‍💻 Autor

**Tomás Silveira**
- GitHub: [@tomisilveira](https://github.com/tomisilveira)

## 🙋 Soporte

Si tienes preguntas o problemas:
1. Abre un [Issue](https://github.com/tomisilveira/gastos-gestor/issues)
2. Describe el problema detalladamente
3. Incluye screenshots si es posible

---

**Desarrollado con ❤️ para simplificar la gestión de gastos de alquileres**
```

Guarda este contenido como `README.md` en la raíz de tu proyecto.
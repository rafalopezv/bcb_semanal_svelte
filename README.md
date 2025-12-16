# BCB Semanal - SvelteKit App

Plataforma de visualización de datos del Banco Central de Bolivia construida con SvelteKit, D3.js y Tailwind CSS.

## 🚀 Características

- **Visualizaciones interactivas** con D3.js
- **Modo oscuro/claro** con detección automática del sistema
- **Diseño responsive** optimizado para móviles
- **Sin autenticación** - versión pública
- **Descarga de datos** en formato CSV
- **Rendimiento optimizado** para conexiones lentas
- **JavaScript puro** (sin TypeScript)

## 🛠 Stack Tecnológico

- **SvelteKit** - Framework web moderno y rápido
- **Svelte 5** - Componentes reactivos
- **D3.js** - Visualizaciones de datos
- **Tailwind CSS** - Estilos utilitarios
- **Vite** - Build tool ultra-rápido

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Preview de producción
npm run preview
```

## 🌐 Desarrollo

El servidor de desarrollo estará disponible en:
- Local: http://localhost:5173/
- Red: http://[tu-ip]:5173/

## 📁 Estructura del Proyecto

```
app/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   └── TimeSeriesChart.svelte  # Componente de gráfico D3
│   │   └── utils/                      # Utilidades
│   ├── routes/
│   │   ├── +layout.svelte              # Layout principal con theme toggle
│   │   └── +page.svelte                # Página principal
│   ├── app.css                         # Estilos globales con Tailwind
│   └── app.html                        # Template HTML
├── static/
│   └── datos.csv                       # Datos del BCB
├── package.json
├── svelte.config.js
├── tailwind.config.js
└── vite.config.js
```

## 🎨 Temas

El proyecto incluye soporte completo para tema claro y oscuro:

- **Detección automática** del tema del sistema
- **Toggle manual** con persistencia en localStorage
- **Colores optimizados** para cada tema

### Colores Personalizados

**Modo Claro:**
- `light-body`: #e9eeee
- `light-background`: #eff4f4
- `light-focus-primary`: #6c95bdff
- `light-focus-secondary`: #adc0d3ff

**Modo Oscuro:**
- `dark-body`: #12121c
- `dark-background`: #212132ff
- `dark-focus-primary`: #dfe3f8ff
- `dark-focus-secondary`: #9397c6ff

## 📊 Datos

Los datos se cargan desde `/static/datos.csv` que contiene:
- `unidad` - Unidad de medida
- `categoria` - Categoría del indicador
- `variable` - Nombre de la variable
- `subvariable` - Subcategoría
- `fecha` - Fecha del registro
- `valor` - Valor numérico

## 🚀 Despliegue

### Opción 1: Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Opción 2: Netlify

```bash
# Construir
npm run build

# La carpeta 'build' contiene los archivos estáticos
```

Configuración en `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "build"
```

### Opción 3: GitHub Pages

1. Construir: `npm run build`
2. La carpeta `build` contiene los archivos estáticos
3. Subir a rama `gh-pages`

### Opción 4: Servidor Propio

```bash
# Construir
npm run build

# Servir con cualquier servidor estático
npx serve build
```

## 🔄 Conexión con API en Vivo

Para conectar con APIs en tiempo real, modifica `src/routes/+page.svelte`:

```javascript
// En lugar de cargar desde CSV estático
const csvData = await d3.csv('/datos.csv', ...);

// Usa fetch a tu API
const response = await fetch('https://api.tudominio.gov.bo/bcb/data');
const apiData = await response.json();
```

## 🔧 Configuración

### Cambiar Puerto de Desarrollo

En `package.json`:
```json
"scripts": {
  "dev": "vite dev --port 3000"
}
```

### Optimizar para Producción

El proyecto ya está configurado con:
- Adapter estático para máxima portabilidad
- Precompresión deshabilitada (habilitar en `svelte.config.js` si necesario)
- Tree-shaking automático de D3

## 📱 Responsive

- Breakpoint móvil: `< 768px`
- Gráficos adaptativos
- Tablas con scroll horizontal
- Navegación optimizada para touch

## 🎯 Próximos Pasos

1. **Conectar con APIs en tiempo real**
   - Reemplazar CSV por endpoints REST
   - Implementar actualización automática (polling o WebSocket)

2. **Expandir visualizaciones**
   - Agregar más tipos de gráficos
   - Comparaciones multi-variable
   - Exportar gráficos como imágenes

3. **Mejorar Performance**
   - Implementar virtual scrolling en tablas
   - Lazy loading de datos
   - Service Workers para cache

4. **Agregar analíticas**
   - Google Analytics / Plausible
   - Tracking de uso de visualizaciones

## 📝 Notas

- Este es un proyecto **sin TypeScript** por diseño
- Los datos se actualizan manualmente copiando `datos.csv`
- Para producción, considera implementar un pipeline de datos automatizado

## 🆘 Soporte

Para problemas o preguntas:
1. Revisar logs del servidor de desarrollo
2. Verificar que `datos.csv` esté en `/static`
3. Limpiar cache: `rm -rf .svelte-kit node_modules && npm install`

## 📄 Licencia

Proyecto del Gobierno de Bolivia - Ministerio de Economía y Finanzas Públicas

# BCB Semanal - SvelteKit App

Plataforma de visualización de datos del Banco Central de Bolivia construida con SvelteKit, D3.js y Tailwind CSS.

> **Nota importante:** Este repositorio contiene únicamente la interfaz de visualización. Los datos son generados y actualizados automáticamente por el repositorio [mauforonda/bcb_semanal](https://github.com/mauforonda/bcb_semanal/). **Ambos repositorios son esenciales** para el funcionamiento completo del sistema.

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
│   │   │   ├── TimeSeriesChart.svelte  # Componente de gráfico D3
│   │   │   ├── ParquetViewer.svelte    # Visor de datos
│   │   │   └── Sidebar.svelte          # Barra lateral de navegación
│   │   └── stores/
│   │       └── theme.js                # Store de tema
│   ├── routes/
│   │   ├── +layout.svelte              # Layout principal con theme toggle
│   │   ├── +layout.js                  # Layout config
│   │   ├── +page.svelte                # Página principal
│   │   └── +page.js                    # Server-side data loading
│   ├── app.css                         # Estilos globales con Tailwind
│   └── app.html                        # Template HTML
├── static/
│   └── logo.png                        # Logo del BCB
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

Los datos se cargan automáticamente desde el repositorio [mauforonda/bcb_semanal](https://github.com/mauforonda/bcb_semanal/), el cual genera y actualiza el archivo CSV con las estadísticas semanales del Banco Central de Bolivia.

### Fuente de Datos
- **Repositorio de datos**: https://github.com/mauforonda/bcb_semanal/
- **CSV en vivo**: https://raw.githubusercontent.com/mauforonda/bcb_semanal/refs/heads/main/datos.csv

**Ambos repositorios son importantes:**
- **Este repositorio**: Interfaz de visualización (frontend)
- **bcb_semanal**: Generación y actualización de datos (backend)

### Estructura del CSV
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

## 🔄 Carga de Datos

Los datos se cargan automáticamente en cada visita desde el repositorio GitHub en `src/routes/+page.js`:

```javascript
export async function load({ fetch }) {
  const response = await fetch('https://raw.githubusercontent.com/mauforonda/bcb_semanal/refs/heads/main/datos.csv');
  const csvText = await response.text();
  const csvData = d3.csvParse(csvText, ...);
  return { csvData };
}
```

Esto garantiza que siempre se muestren los datos más recientes generados por el repositorio [mauforonda/bcb_semanal](https://github.com/mauforonda/bcb_semanal/).

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

1. **Mejorar la integración de datos**
   - Implementar actualización automática periódica
   - Agregar indicador de última actualización más visible
   - Cache inteligente de datos

2. **Expandir visualizaciones**
   - Agregar más tipos de gráficos
   - Comparaciones multi-variable
   - Exportar gráficos como imágenes

3. **Mejorar Performance**
   - Implementar virtual scrolling en tablas
   - Service Workers para cache offline
   - Optimización de renderizado de gráficos

4. **Agregar analíticas**
   - Google Analytics / Plausible
   - Tracking de uso de visualizaciones

## 📝 Notas

- Este es un proyecto **sin TypeScript** por diseño
- Los datos se cargan automáticamente desde el repositorio [mauforonda/bcb_semanal](https://github.com/mauforonda/bcb_semanal/)
- La actualización de datos es responsabilidad del repositorio de datos (bcb_semanal)
- Este repositorio solo se encarga de la visualización e interfaz de usuario

## 🆘 Soporte

Para problemas o preguntas:

**Problemas con la visualización o interfaz:**
1. Revisar logs del servidor de desarrollo
2. Limpiar cache: `rm -rf .svelte-kit node_modules && npm install`
3. Reportar issues en este repositorio

**Problemas con los datos:**
- Reportar en el repositorio de datos: https://github.com/mauforonda/bcb_semanal/issues

## 📄 Licencia

Proyecto del Gobierno de Bolivia - Ministerio de Economía y Finanzas Públicas

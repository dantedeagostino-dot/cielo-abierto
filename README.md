# Proyecto Cielo Abierto 🌌

**Cielo Abierto** es una plataforma de inteligencia artificial diseñada para democratizar el acceso a la información espacial y científica de la NASA. Utilizando **Google Gemini**, el proyecto permite a cualquier usuario interactuar con más de 17 APIs de datos complejos del universo a través de un chat natural y amigable.

## 🚀 Misión
Romper las barreras técnicas que existen entre los datos abiertos de la NASA y el público general. Cielo Abierto actúa como un "copiloto espacial", traduciendo consultas cotidianas en búsquedas precisas a través de múltiples bases de datos científicas.

## 🧠 Capacidades y APIs Integradas

El sistema cuenta con herramientas especializadas para acceder a las siguientes fuentes de datos de la NASA en tiempo real:

| Categoría | API / Fuente | Descripción | Ejemplo de Prompt |
| :--- | :--- | :--- | :--- |
| **Imágenes** | **APOD** | Imagen Astronómica del Día | *"Muéstrame la foto de hoy"* |
| | **Mars Rovers** | Fotos RAW de Curiosity y Perseverance (via mars.nasa.gov) | *"Últimas fotos de Marte"* |
| | **EPIC** | Cámara Policromática Terrestre (Blue Marble) | *"Imágenes de la Tierra desde el espacio"* |
| | **Image Library** | Biblioteca General de Imágenes y Videos | *"Busca videos del Apollo 11"* |
| **Asteroides y Planetas** | **NeoWs** | Objetos Cercanos a la Tierra (Asteroides) | *"¿Hay asteroides peligrosos esta semana?"* |
| | **CNEOS Close Approach** | Datos de acercamientos de asteroides/cometas | *"¿Qué asteroides se acercan a la Tierra?"* |
| | **CNEOS Fireballs** | Bolas de fuego detectadas en la atmósfera | *"Últimas bolas de fuego detectadas"* |
| | **Exoplanet** | Archivo de Exoplanetas Confirmados | *"Lista los últimos exoplanetas descubiertos"* |
| | **InSight** | Servicio Meteorológico de Marte (deprecated) | *"¿Qué clima hace en Marte?"* |
| **Tierra y Clima** | **EONET** | Rastreador de Eventos Naturales | *"¿Hay incendios forestales activos?"* |
| | **CMR** | Repositorio de Metadatos Comunes | *"Datos sobre la capa de ozono"* |
| | **NASA POWER** | Datos solares y meteorológicos por coordenadas | *"Temperatura en Buenos Aires esta semana"* |
| **Biología Espacial** | **GeneLab** | Estudios de biología y radiación espacial | *"Estudios sobre efectos de microgravedad"* |
| **Ingeniería** | **TechPort** | Proyectos Tecnológicos de la NASA | *"Busca proyectos de propulsión iónica"* |
| | **TechTransfer** | Patentes y Software | *"Patentes sobre energía solar"* |
| | **TLE** | Elementos Orbitales de Satélites | *"¿Dónde está la ISS ahora?"* |
| **Espacio Profundo** | **DONKI** | Clima Espacial (Tormentas Geomagnéticas) | *"Estado del clima espacial hoy"* |

### Nota sobre Mars Rover Photos
La API oficial de NASA Mars Photos (`api.nasa.gov/mars-photos`) está inactiva (404). Este proyecto obtiene imágenes directamente de los endpoints internos de `mars.nasa.gov`, los mismos que usan las páginas oficiales de [Curiosity Raw Images](https://mars.nasa.gov/msl/multimedia/raw-images/) y [Perseverance Raw Images](https://mars.nasa.gov/mars2020/multimedia/raw-images/).

## 🛠️ Tecnologías
- **Frontend**: Next.js 16 (App Router), Tailwind CSS v4, Framer Motion.
- **IA**: Google Gemini 2.5 Flash (via Vercel AI SDK v6).
- **Datos**: NASA Open Innovation Team (api.nasa.gov + endpoints internos).
- **Telemetría**: Wrapper centralizado `fetchFromNASA` con logging de latencia, rate-limits, y errores.

## 👨‍💻 Creador
Desarrollado con pasión por **Dante De Agostino**.

---
*Este proyecto es parte del Laboratorio Colossus.*

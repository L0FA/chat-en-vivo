# 💬 Whatsappn't (aka Chat en Vivo)

¡Bienvenido a **Whatsappn't**! Una aplicación de chat full-stack, en tiempo real y rica en funcionalidades construida sobre **React**, **Vite** y **Node.js**.

Este proyecto se concibió inicialmente como *chat-en-vivo*, pero fue refactorizado y migrado por completo hacia una arquitectura de frontend web moderna y unificada en un solo repositorio (Monorepo), acoplándose perfectamente a un backend ligero y ridículamente rápido potenciado por WebSockets.

## 🚀 Características Principales

- **Velocidad en Tiempo Real:** Chat instantáneo impulsado por **Socket.IO** (utilizando túneles `websocket` dedicados sin *polling* molesto).
- **Audio y Música Sincronizada 🎵:**
  - Envía y reproduce archivos de audio pesado (Hasta 50MB por canción).
  - Integración nativa del reproductor de **YouTube** para buscar y encolar videos que se reproducirán de forma sincronizada con el resto de conectados.
  - Efectos visuales de Ecualizador.
- **Integración de GIFs:** Búsqueda inmediata en Giphy para dar contexto a cualquier conversación.
- **Temas Dinámicos:** Personalización de fondos asombrosa gracias a simulaciones en *Canvas* (Lluvia Matrix, Pétalos Sakura, Fuego, Cyberpunk, Neón y muchos más).
- **Backend Moderno con libSQL:** Motor de base de datos integrado mediante Turso.
- **Totalmente Responsive:** Orientado 100% al diseño Mobile-First y adaptable al teclado del SO (`100dvh`).
- **Sistema de Llamadas en Vivo: Estilo Discord, podes hablar por llamada, prender camara, compartir pantalla en tiempo real!

## 🛠️ Stack Tecnológico

- **Frontend:** React 19, Vite, TailwindCSS v4, Canvas API.
- **Backend:** Node.js, Express, Socket.IO v4.
- **Base de Datos:** SQLite / [libSQL](https://turso.tech) (Turso).
- **Librerías Extra:** `emoji-picker-element` para stickers/reacciones, `open-graph-scraper` para visualización previa de enlaces en el chat.

## 📦 Instalación y Desarrollo Local

### 1. Arrancar Proyecto

Para instalar todas las dependencias necesarias de Front y Back:
```bash
npm install
```

Para jugar con el FrontEnd en estado de desarrollo rápido con Hot-Reload:
```bash
npm run dev
```

Para probar tu servidor de Sockets de manera local:
```bash
npm start
```

## ☁️ Despliegue en Render (Producción)

Si vas a lanzar el servicio hacia las nubes ☁️, Whatsappn't te facilita la vida porque ahora *es todo bajo el mismo paraguas*.
Conecta tu cuenta en Github a tu Web Service de Render.com indicando los siguientes comandos:

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

Render se encargará de crear la carpeta `/dist/` con el empaquetado ultra-optimizado de Vite, e inmediatamente iniciará Node.js encendiendo la maquinaria de Express lista para servir tanto tú web como tu conexión Sockets usando solo un puerto dinámico.

---
**Nota:** El límite original del Buffer P2P de Sockets fue incrementado desde su defecto a **50 MB** permitiendo subidas generosas de audios largos y pesados para todos en la sala.

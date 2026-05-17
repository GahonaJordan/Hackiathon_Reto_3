# MediCover AI - Estimador Agéntico de Copago y Cobertura

Un agente conversacional que ayuda al paciente a entender su beneficio antes de atenderse. El paciente ingresa su síntoma, el agente sugiere la especialidad en el hospital y, cruzando datos con su plan de seguro, le indica exactamente cuánto será su copago y qué hospital de la red le conviene más económicamente.

## Quick Start

### Requisitos
- Node.js 18+ 
- npm o yarn
- OpenAI API Key ([platform.openai.com](https://platform.openai.com/api-keys))

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/medicover-ai.git
cd medicover-ai
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# Copiar el archivo ejemplo
cp .env.example .env.local

# Editar .env.local y agregar tu API key de OpenAI
OPENAI_API_KEY=your_api_key_here
```

4. **Ejecutar servidor de desarrollo**
```bash
npm run dev
```

5. **Abrir en navegador**
```
http://localhost:3000
```

### Credenciales de Demo
- **ID Paciente**: PAC-001
- **Contraseña**: 1234
- **Plan**: Premium

## Características

- ✅ Agente conversacional con IA (OpenAI)
- ✅ Detección de especialidad desde síntomas
- ✅ Cálculo de copago por plan de seguro
- ✅ Sugerencia de hospital más económico
- ✅ Historial de consultas (localStorage)
- ✅ Identificación de hospitales en red priorizada
- ✅ UI responsiva con Tailwind CSS

## Especialidades Disponibles

1. **Cardiología** - Problemas cardíacos, palpitaciones, dolor en el pecho
2. **Dermatología** - Erupciones, problemas de piel, picazón
3. **Psicología** - Ansiedad, depresión, estrés

## Estructura de Datos

### Hospitales
- 6 hospitales con precios diferenciados por especialidad
- Identificación de red priorizada vs externos
- Recargo del 35% por hospitales fuera de red

### Planes de Seguros
- Cobertura variable por especialidad (70%-90%)
- Copago mínimo garantizado
- Red de hospitales aliados

## Stack Tecnológico

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **IA**: OpenAI (GPT-4o mini)
- **Base de datos**: JSON estática
- **Almacenamiento**: localStorage (navegador)

## Scripts Disponibles

```bash
npm run dev      # Inicia servidor de desarrollo
npm run build    # Construye para producción
npm start        # Inicia servidor de producción
npm run lint     # Ejecuta linter
```

## Estructura del Proyecto

```
medicover-ai/
├── app/
│   ├── page.tsx              # Interfaz principal del paciente
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       └── chat/
│           └── route.ts      # Endpoint para procesar síntomas
├── data/
│   ├── hospitals.json        # Base de hospitales
│   └── insurance.json        # Planes de seguro
├── public/
├── .env.example              # Variables de entorno (plantilla)
├── package.json
├── tsconfig.json
└── README.md
```

## Notas de Seguridad

- Las credenciales demo son solo para demostración
- La API key de OpenAI debe guardarse en `.env.local` (nunca commitear)
- El historial se almacena localmente en el navegador del usuario

## Despliegue

### En Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel
```

### En otros servidores
```bash
npm run build
npm start
```

## Licencia

Este proyecto fue desarrollado para un hackatón de MediCover por:
- Gahona Jordan
- Sarango Katherine

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request con tus mejoras.

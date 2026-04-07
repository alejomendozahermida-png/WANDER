# Wander - App de Viajes Inversa 🌍✈️

**Wander** es una aplicación móvil de viajes inversa para estudiantes que viajan por Europa. En lugar de buscar un destino específico, el usuario ingresa sus fechas disponibles y su mood, y la app sugiere los 3 mejores destinos basados en precio, compatibilidad de pasaporte y estilo de viaje.

## 🎯 Estado Actual

✅ **Completado:**
- ✅ Estructura completa de navegación con Expo Router
- ✅ Pantalla de Splash con animación
- ✅ Login y Registro (con autenticación mock)
- ✅ Onboarding de 4 pasos (info personal, aeropuerto, presupuesto, vibes)
- ✅ Navegación por tabs (Home, Guardados, Perfil)
- ✅ Home con selector de fechas y mood
- ✅ Resultados con 3 destinos curados
- ✅ Detalles del destino con precio detallado
- ✅ Pantalla de reserva con métodos de pago
- ✅ Sistema de diseño completo (colores, tipografía, componentes)
- ✅ State management con Zustand
- ✅ Datos mock para testing

🔄 **Pendiente (requiere claves API):**
- ⏳ Integración con Supabase (auth + base de datos)
- ⏳ Integración con Kiwi Tequila API (búsqueda de vuelos)
- ⏳ Integración con Hotellook API (alojamiento)
- ⏳ Integración con Stripe (pagos)
- ⏳ Google Sign-In / Apple Sign-In

---

## 📱 Características Implementadas

### Autenticación
- Email + contraseña (mock - lista para Supabase)
- Botones para Google y Apple Sign-In
- Registro de nuevos usuarios
- Persistencia de sesión

### Onboarding (4 Pasos)
1. **¿Quién eres?** - Nombre, nacionalidad, país del pasaporte
2. **¿Desde dónde viajas?** - Selección de aeropuerto base
3. **¿Cuál es tu presupuesto?** - Selector con presets (Estudiante/Equilibrado/Confort)
4. **¿Cuál es tu vibe?** - Selección múltiple de estilos de viaje

### Home
- Saludo personalizado con nombre del usuario
- Selector de fechas (ida y vuelta)
- Selector de mood (4 opciones principales)
- Sección de destinos populares
- Animaciones y transiciones suaves

### Resultados
- 3 destinos curados con badges:
  - 🔥 Opción más económica
  - ⭐ Mejor relación calidad-precio
  - 💎 Joya oculta
- Cards grandes con imagen, ciudad, país
- Desglose de precios (vuelo + alojamiento)
- Estado de visa
- Animaciones de carga (Shimmer)

### Detalle del Destino
- Hero image con gradiente
- Estadísticas (temperatura, duración vuelo, costo de vida)
- Resumen completo del viaje
- Complementos opcionales (seguro, eSIM)
- Botón para guardar destino
- CTA flotante para reservar

### Perfil
- Avatar con iniciales
- Preferencias de viaje guardadas
- Estadísticas de viajes
- Configuración de cuenta
- Cerrar sesión

---

## 🔧 Setup para Desarrollo

### Requisitos
- Node.js 16+
- Yarn
- Expo CLI
- Cuenta de Expo (para testing en dispositivo)

### Instalación
```bash
cd /app/frontend
yarn install
```

### Ejecutar en desarrollo
```bash
yarn start
```

Escanea el QR con la app Expo Go en tu teléfono.

---

## 🔑 Configuración de Claves API (Para Esta Noche)

Cuando estés listo para conectar las APIs reales, necesitarás:

### 1. Supabase (Auth + Database)
**Registro:** https://supabase.com

1. Crea un nuevo proyecto
2. Ve a Settings > API
3. Copia:
   - `Project URL` → `SUPABASE_URL`
   - `anon/public key` → `SUPABASE_ANON_KEY`

**Configurar la base de datos:**
```sql
-- Ejecuta estos comandos en el SQL Editor de Supabase

-- Tabla profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  first_name TEXT,
  nationality TEXT,
  passport_country TEXT,
  home_airport_iata TEXT,
  home_city TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  travel_style TEXT[],
  travels_alone BOOLEAN,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla saved_trips
CREATE TABLE saved_trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  destination_city TEXT,
  destination_country TEXT,
  destination_iata TEXT,
  flight_price NUMERIC,
  hotel_price NUMERIC,
  total_price NUMERIC,
  departure_date DATE,
  return_date DATE,
  saved_at TIMESTAMP DEFAULT NOW()
);

-- Tabla bookings
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  destination_city TEXT,
  flight_deep_link TEXT,
  hotel_deep_link TEXT,
  total_price NUMERIC,
  status TEXT DEFAULT 'pending',
  stripe_payment_intent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### 2. Kiwi Tequila API (Vuelos)
**Registro:** https://tequila.kiwi.com/portal/login

1. Crea una cuenta
2. Ve a API > Credentials
3. Copia tu `API Key` → `KIWI_API_KEY`

### 3. Hotellook API (Alojamiento)
**Registro:** https://www.travelpayouts.com

1. Crea una cuenta de Travelpayouts
2. Ve a Tools > Hotellook API
3. Copia tu `token` → `HOTELLOOK_TOKEN`

### 4. Stripe (Pagos)
**Registro:** https://stripe.com

1. Crea una cuenta
2. Ve a Developers > API Keys
3. Copia tu `Publishable key` (test) → `STRIPE_PUBLISHABLE_KEY`

---

## 📝 Actualizar Variables de Entorno

Una vez que tengas las claves, agrégalas en:

**Frontend: `/app/frontend/.env`**
```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=tu_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key

# APIs externas
EXPO_PUBLIC_KIWI_API_KEY=tu_kiwi_api_key
EXPO_PUBLIC_HOTELLOOK_TOKEN=tu_hotellook_token

# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=tu_stripe_publishable_key

# Existentes (NO MODIFICAR)
EXPO_TUNNEL_SUBDOMAIN=eurohop-preview
EXPO_PACKAGER_HOSTNAME=https://eurohop-preview.preview.emergentagent.com
EXPO_PUBLIC_BACKEND_URL=https://eurohop-preview.preview.emergentagent.com
EXPO_USE_FAST_RESOLVER="1"
METRO_CACHE_ROOT=/app/frontend/.metro-cache
```

---

## 📂 Estructura del Proyecto

```
frontend/
├── app/                      # Expo Router screens
│   ├── (tabs)/              # Tab navigation
│   │   ├── home.tsx
│   │   ├── saved.tsx
│   │   └── profile.tsx
│   ├── detail/
│   │   └── [id].tsx
│   ├── booking/
│   │   └── [id].tsx
│   ├── _layout.tsx          # Root layout
│   ├── index.tsx            # Splash screen
│   ├── login.tsx
│   ├── register.tsx
│   ├── onboarding.tsx
│   └── results.tsx
├── src/
│   ├── components/          # Reusable components
│   ├── constants/           # Design system
│   ├── store/               # Zustand stores
│   ├── services/            # API services
│   ├── types/               # TypeScript types
│   └── assets/              # Static assets
```

---

## 🎉 ¡Listo!

La estructura completa de la app está implementada y funcionando con datos mock. Cuando tengas las claves API esta noche, solo necesitarás:

1. Agregar las claves al archivo `.env`
2. Reemplazar las funciones mock con las llamadas reales a las APIs
3. ¡Y tendrás Wander completamente funcional!

---

**Desarrollado con ❤️ para viajeros estudiantes**

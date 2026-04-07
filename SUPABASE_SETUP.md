# Scripts SQL para Supabase

## ⚠️ IMPORTANTE: Ejecuta estos scripts en el SQL Editor de Supabase

Ve a tu proyecto en Supabase → SQL Editor → New Query → Pega y ejecuta estos scripts:

---

## 1. Crear tabla `profiles`

```sql
-- Tabla profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  nationality TEXT,
  passport_country TEXT,
  home_airport_iata TEXT,
  home_city TEXT,
  budget_min INTEGER DEFAULT 50,
  budget_max INTEGER DEFAULT 500,
  travel_style TEXT[] DEFAULT '{}',
  travels_alone BOOLEAN DEFAULT false,
  onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver su propio perfil
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

-- Política: Los usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Política: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil cuando se crea un usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 2. Crear tabla `saved_trips`

```sql
-- Tabla saved_trips
CREATE TABLE IF NOT EXISTS saved_trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  destination_city TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  destination_iata TEXT,
  flight_price NUMERIC(10,2),
  hotel_price NUMERIC(10,2),
  total_price NUMERIC(10,2),
  departure_date DATE,
  return_date DATE,
  image_url TEXT,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE saved_trips ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view own saved trips" 
  ON saved_trips FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved trips" 
  ON saved_trips FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved trips" 
  ON saved_trips FOR DELETE 
  USING (auth.uid() = user_id);

-- Índice para mejorar performance
CREATE INDEX idx_saved_trips_user_id ON saved_trips(user_id);
```

---

## 3. Crear tabla `bookings`

```sql
-- Tabla bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  destination_city TEXT NOT NULL,
  destination_country TEXT,
  destination_iata TEXT,
  flight_deep_link TEXT,
  hotel_deep_link TEXT,
  flight_price NUMERIC(10,2),
  hotel_price NUMERIC(10,2),
  total_price NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  stripe_payment_intent TEXT,
  departure_date DATE,
  return_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view own bookings" 
  ON bookings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings" 
  ON bookings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" 
  ON bookings FOR UPDATE 
  USING (auth.uid() = user_id);

-- Índices
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);
```

---

## 4. Verificar que todo se creó correctamente

```sql
-- Ver todas las tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Ver políticas de RLS
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

---

## ✅ Checklist

Marca cuando hayas ejecutado cada script:

- [ ] Script 1: Tabla `profiles` creada
- [ ] Script 2: Tabla `saved_trips` creada
- [ ] Script 3: Tabla `bookings` creada
- [ ] Script 4: Verificación ejecutada

---

## 🔐 Configurar Authentication Providers (Opcional)

Si quieres habilitar Google y Apple Sign-In:

1. Ve a **Authentication → Providers** en Supabase
2. Habilita **Google**:
   - Client ID de Google Cloud Console
   - Client Secret
3. Habilita **Apple** (solo iOS):
   - Services ID
   - Team ID
   - Key ID
   - Private key

---

## 🧪 Probar la Conexión

Después de ejecutar los scripts, puedes probar creando un usuario en:
**Authentication → Users → Add user**

O simplemente prueba el registro en la app!

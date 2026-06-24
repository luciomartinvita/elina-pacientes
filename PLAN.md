# App de Gestión de Pacientes — Plan de Implementación

> **Stack definido:** GitHub Pages (frontend) + Supabase (PostgreSQL, base de datos cloud gratuita)

## Datos Confirmados

| Parámetro | Valor |
|---|---|
| **Usuario GitHub** | `luciomartinvita` |
| **Repositorio** | https://github.com/luciomartinvita/elina-pacientes.git |
| **URL pública de la app** | https://luciomartinvita.github.io/elina-pacientes/ |
| **Email Supabase** | luciomartinvita@gmail.com |
| **Usuarios** | Solo la doctora (1 usuario) |
| **Campos adicionales** | No por ahora |

---

## 1. Contexto y Análisis del CSV

La doctora lleva **182 registros quirúrgicos** históricos en Google Sheets.

### Campos actuales

| Campo | Estado | Problema |
|---|---|---|
| `Fecha` | Solo `dd/mm`, sin año | No se puede ordenar cronológicamente entre años |
| `Nombre y Apellido` | Texto libre | Inconsistencia en mayúsculas (`SOSA SELVA` vs `Estrada Nora`) |
| `DNI` | 97% vacío | Sirve como identificador único pero no se usa |
| `Obra Social` | Texto libre | Misma obra social escrita de 3 formas distintas (`pami`, `PAMI`, `Pami`) |
| `Cirugía` | Texto libre + `(A)` | Abreviaturas mezcladas, el `(A)` es clave pero su significado es desconocido |
| `Consultorio` | Siempre vacío | No aporta valor en los datos actuales |

### Obras sociales identificadas en el CSV (30 únicas)
`PAMI` · `DOSEP` · `OSECAC` · `OSPRERA` · `NOBIS` · `OSETYA` · `OTAC` · `OSPIA` · `OSPECON` · `OSUTHGRA` · `SANCOR` · `SWISS MEDICAL` · `GALENO` · `IOSFA` · `ATSA` · `MEDISALUD` · `ASSIMRA` · `OSFA` · `LUZ Y FUERZA` · `ISPICA` · `OSFATUN` · `MUTUAL MEDICA` · `SALUD PLENA` · `ANDES SALUD` · `UOM`

### Tipos de cirugía identificados en el CSV
`CVLP` · `Cole convencional` · `Hernioplastia inguinal` · `Hernioplastia umbilical` · `Apendicectomía` · `Laparotomía` · `Hartmann` · `Eventracion` · `Gastrostomía` · `Apex` · `Coledocotomía` · `Tubo de tórax` · `Quiste pilonidal` · `Hemorroides` · `Lipoma` · `Absceso perianal`

---

## 2. Decisiones de Diseño

| Decisión | Resolución |
|---|---|
| Usuarios | 1 solo (la doctora) — no se necesita multi-usuario ni permisos |
| Campos adicionales | Ninguno por ahora. Los campos son: fecha, nombre, DNI, obra social, cirugía |
| El `(A)` en cirugías | Se conserva como parte del texto de la cirugía (ej: `CVLP (A)`). Se puede normalizar luego |
| Año en la fecha | Se agrega año completo a todos los registros nuevos. En la importación del CSV se pedirá el año |
| Cuenta Supabase | luciomartinvita@gmail.com |
| Repositorio | https://github.com/luciomartinvita/elina-pacientes.git |
| URL pública | https://luciomartinvita.github.io/elina-pacientes/ |

---

## 3. Arquitectura Técnica

```
Browser (doctora) ──HTTPS──► GitHub Pages (HTML/CSS/JS)
                                    │
                                    │ Supabase JS SDK
                                    ▼
                            Supabase (cloud)
                            ├── PostgreSQL DB
                            │   ├── tabla: pacientes
                            │   └── tabla: catalogos
                            └── Auth (login email/contraseña)
```

- **GitHub Pages** → sirve la app, URL gratuita: `usuario.github.io/pacientes`
- **Supabase** → base de datos PostgreSQL cloud, gratis hasta 500 MB
- **Sin backend propio** → el JS habla directo con Supabase vía HTTPS

---

## 4. Esquema de Base de Datos (Supabase / PostgreSQL)

### Tabla principal: `pacientes`

```sql
CREATE TABLE pacientes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha       DATE NOT NULL,
  nombre      TEXT NOT NULL,
  apellido    TEXT,
  dni         TEXT,
  obra_social TEXT,
  cirugia     TEXT NOT NULL,
  notas       TEXT,
  user_id     UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 1 sola doctora, pero igual habilitamos RLS por buena práctica
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Solo la doctora ve sus registros" ON pacientes
  FOR ALL USING (auth.uid() = user_id);
```

### Tabla de catálogos: `catalogos`

```sql
CREATE TABLE catalogos (
  id     SERIAL PRIMARY KEY,
  tipo   TEXT NOT NULL,   -- 'obra_social' | 'cirugia'
  valor  TEXT NOT NULL,
  alias  TEXT[]           -- variantes del mismo nombre para normalización
);
```

---

## 5. Pantallas de la App

1. **Login** — email + contraseña
2. **Lista de Pacientes** — búsqueda en tiempo real, filtros por OS / cirugía / mes, botón "+ Nuevo"
3. **Formulario Alta/Edición** — campos con autocompletado de obras sociales y cirugías
4. **Dashboard / Estadísticas** — cirugías por mes, distribución por obra social, tipos de cirugía

---

## 6. Estructura de Archivos del Proyecto

```
elina-pacientes/           ← repositorio GitHub
│
├── index.html             ← app completa (SPA)
├── css/
│   └── styles.css
├── js/
│   ├── supabase.js        ← cliente Supabase
│   ├── auth.js            ← login / logout
│   ├── pacientes.js       ← CRUD
│   ├── catalogos.js       ← autocompletado obras sociales y cirugías
│   ├── dashboard.js       ← estadísticas
│   ├── importar.js        ← migración del CSV histórico
│   └── exportar.js        ← exportar a CSV/Excel
├── config.js              ← URL y clave pública Supabase
└── README.md
```

---

## 7. Plan de Migración del CSV Histórico

1. Pantalla de importación → la doctora sube el CSV original
2. El parser normaliza nombres, mapea obras sociales, detecta el `(A)`
3. Se muestra vista previa antes de confirmar
4. Carga en lote a Supabase

---

## 8. Fases de Desarrollo

### Fase 1 — Setup (sin código, solo configuración)
- [ ] Crear cuenta Supabase en supabase.com con luciomartinvita@gmail.com
- [ ] Crear proyecto Supabase (ej: `elina-pacientes`)
- [ ] Ejecutar el SQL de creación de tablas en Supabase
- [ ] Copiar `Project URL` y `anon key` de Supabase → van en `config.js`
- [ ] Clonar el repositorio: `git clone https://github.com/luciomartinvita/elina-pacientes.git`
- [ ] Activar GitHub Pages en Settings → Pages → rama `main`, carpeta `/`

### Fase 2 — MVP
- [ ] Login / Logout
- [ ] Lista de pacientes + búsqueda
- [ ] Formulario alta / edición / eliminar
- [ ] Importador CSV histórico

### Fase 3 — Mejoras
- [ ] Filtros por OS / cirugía / mes
- [ ] Exportar a CSV
- [ ] Dashboard con estadísticas

### Fase 4 — Pulido
- [ ] Diseño premium (glassmorphism, animaciones)
- [ ] PWA instalable en celular
- [ ] Catálogo editable de obras sociales y cirugías

---

## 9. Verificación

1. Login con usuario de prueba
2. CRUD de pacientes funcionando
3. Importar el CSV y verificar los 182 registros
4. Búsqueda y filtros funcionando
5. Exportar a CSV y abrir en Excel
6. Probar desde celular
7. Verificar Row Level Security (usuario B no ve datos de usuario A)

# 🚀 Configuración del Backend - Polla Mundial 2026

## PASO 1: Configurar Gmail

1. Ve a: https://myaccount.google.com/apppasswords
2. Si no tienes "App passwords" habilitado:
   - Ve a Seguridad: https://myaccount.google.com/security
   - Activa "Verificación en dos pasos"
   - Vuelve a App passwords
3. Crea una contraseña de aplicación para "Mail" y "Windows"
4. Copia la contraseña generada (16 caracteres con espacios)

## PASO 2: Crear repositorio GitHub

1. Crea un repo nuevo en GitHub llamado: `polla-mundial-backend`
2. Clona el repo en tu computadora:
   ```bash
   git clone https://github.com/TU_USUARIO/polla-mundial-backend.git
   cd polla-mundial-backend
   ```

## PASO 3: Agregar los archivos

1. Copia estos archivos al repo:
   - `server.js` (el backend)
   - `package.json` (las dependencias)
   - `.env` (variables secretas)
   - `.gitignore` (para no subir .env)

2. Crea un archivo `.gitignore`:
   ```
   node_modules/
   .env
   polla.db
   ```

3. Haz commit:
   ```bash
   git add .
   git commit -m "Initial commit: backend setup"
   git push
   ```

## PASO 4: Configurar variables en Render

1. Ve a: https://render.com
2. Crea una cuenta (gratis)
3. Haz clic en "New Web Service"
4. Conecta tu repositorio de GitHub
5. Configura:
   - Name: `polla-mundial-backend`
   - Runtime: `Node`
   - Build command: `npm install`
   - Start command: `npm start`

6. En "Environment Variables", agrega:
   ```
   GMAIL_USER=tu_email@gmail.com
   GMAIL_PASSWORD=tu_app_password_de_16_caracteres
   FRONTEND_URL=https://tu_usuario.github.io/polla-mundial-frontend
   ```

7. Haz clic en "Deploy"

Render te dará una URL como: `https://polla-mundial-backend.onrender.com`

## PASO 5: Probarlo localmente (OPCIONAL)

Si quieres testear antes de deployar:

```bash
# Instala las dependencias
npm install

# Edita .env con tus datos de Gmail
nano .env

# Ejecuta el servidor
npm start
```

El servidor correrá en: `http://localhost:3000`

---

## 📝 Variables de entorno (.env)

```
GMAIL_USER=tu_email@gmail.com
GMAIL_PASSWORD=contraseña_app_de_16_caracteres
FRONTEND_URL=https://tu_usuario.github.io/polla-mundial-frontend
PORT=3000
```

⚠️ **IMPORTANTE:** Nunca hagas commit del archivo `.env` con datos reales. Siempre usa variables en Render.

---

## 🔗 URLs del Backend (después de deployar)

Una vez deployado en Render, tu backend estará en:
```
https://polla-mundial-backend.onrender.com
```

Las rutas serán:
- POST `/api/register` - Registrar usuario
- POST `/api/verify` - Verificar email
- POST `/api/login` - Iniciar sesión
- GET `/api/users` - Ver todos los usuarios verificados
- POST `/api/predictions` - Guardar predicción
- GET `/api/predictions/:user_id` - Obtener predicciones del usuario
- GET `/api/all-predictions` - Ver todas las predicciones
- GET `/api/health` - Verificar que el servidor está activo

---

## 🐛 Solución de problemas

**Error: "ENOENT: no such file or directory"**
- El servidor no encuentra `polla.db`. Es normal, se crea automáticamente.

**Error: "GMAIL_USER is not defined"**
- Falta configurar las variables en Render

**Error: "Cannot find module 'express'"**
- Ejecuta: `npm install`

---

## 📞 Soporte

Si algo no funciona, revisa:
1. Que las variables de entorno estén bien en Render
2. Que el Gmail tenga app passwords habilitado
3. Que el repositorio tenga los 3 archivos
4. Los logs de Render (hay un tab de logs)

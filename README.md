This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Configurar MercadoPago (OAuth)

La tienda cobra con MercadoPago a través de OAuth: la conexión se hace **una sola vez** desde el
admin con el botón **"Conectar con MercadoPago"** (ya no se pegan tokens a mano). Los tokens se
guardan encriptados en Firestore y se renuevan solos.

### 1. Crear la aplicación en MercadoPago

1. Entrá a https://www.mercadopago.com.ar/developers/panel/app con la cuenta **dueña de la tienda**.
2. Creá una aplicación (producto: **Checkout Pro / Pagos online**).
3. Anotá el **Client ID** (número de aplicación) y el **Client Secret**.

### 2. Configurar la Redirect URI (OAuth)

En la app de MP → **"Configurar OAuth" / URLs de redireccionamiento**, agregá **exactamente** esta
URL (sin barra final, tiene que coincidir carácter por carácter):

```
https://www.unfuegomdq.com.ar/api/integrations/mercadopago/callback
```

> Para probar en local, agregá también la URL de tu túnel HTTPS (ver más abajo).

### 3. Configurar el Webhook (notificaciones de pago)

OAuth **no** entrega el secret del webhook: se configura aparte.

1. En la app de MP → **Webhooks / Notificaciones**.
2. URL: `https://www.unfuegomdq.com.ar/api/webhooks/mercadopago`
3. Evento a suscribir: **`payment`**.
4. Copiá la **clave secreta** que genera MP → la pegás en el paso 5 (campo "Webhook secret" de la
   config avanzada del admin).

### 4. Variables de entorno (Vercel → Settings → Environment Variables)

| Variable | Valor | Cómo generarla |
|---|---|---|
| `MERCADOPAGO_CLIENT_ID` | Client ID de la app | (paso 1) |
| `MERCADOPAGO_CLIENT_SECRET` | Client Secret de la app | (paso 1) |
| `AUTH_SECRET` | secreto para firmar el state de OAuth | `openssl rand -hex 32` |
| `MP_ENCRYPTION_KEY` | clave para encriptar tokens en la DB | `openssl rand -base64 32` |
| `NEXT_PUBLIC_BASE_URL` | `https://www.unfuegomdq.com.ar` | opcional (hay default), recomendado |

⚠️ **`MP_ENCRYPTION_KEY` es crítica:** si ya existe y hay credenciales encriptadas en la base, **no
la cambies** — al rotarla, los tokens guardados se vuelven ilegibles y hay que reconectar.

Deben existir también (de la configuración previa): `FIREBASE_ADMIN_PROJECT_ID`,
`FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`, `ADMIN_EMAILS`.

Después de cargar las variables, hacé **Redeploy** para que las tome.

### 5. Conectar desde el admin

1. Entrá a `/admin/configuracion-de-pagos` → tab **MercadoPago**.
2. Click en **"Conectar con MercadoPago"** → autorizá en la pantalla de MP.
3. Volvés con el toast *"MercadoPago conectado correctamente"* y la card *"Conectado como {email}"*.
4. Abrí **"Configuración avanzada"** y pegá el **Webhook secret** del paso 3.
5. Confirmá que MercadoPago esté **Habilitado**.

### 6. Probar el pago

1. Hacé una compra de prueba en la tienda.
2. Si conectaste una cuenta/app de **pruebas**, usá las
   [tarjetas de prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/your-integrations/test/cards).
3. Verificá que el pedido cambie de estado (vía webhook).

### Probar OAuth en local

OAuth **no funciona contra `localhost`** (MP necesita una URL pública HTTPS):

```bash
# 1. Levantá un túnel
ngrok http 3000        # o: cloudflared tunnel --url http://localhost:3000

# 2. En .env.local
NEXT_PUBLIC_BASE_URL=https://TU-SUBDOMINIO.ngrok-free.app

# 3. Agregá esa URL + /api/integrations/mercadopago/callback
#    a las redirect URIs de la app de MP (paso 2)
```

### Notas técnicas

- Los tokens se guardan **encriptados** (AES-256-GCM) en `settings/mercadopago`; el cliente nunca los ve.
- El access token se **renueva solo** antes de vencer (refresh token).
- Si la conexión queda en estado *error*, volvé a apretar "Conectar con MercadoPago".
- El token manual (config avanzada) sigue disponible como **fallback**.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

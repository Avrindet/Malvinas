# Configurar pagos — Mercado Pago (Malvinas)

El juego usa **links de pago** de Mercado Pago. No hay servidor: el jugador paga en MP, vuelve al juego y confirma con un checkbox (honor system). Vos recibís el dinero en tu cuenta MP.

---

## Paso 1 — Crear cuenta Mercado Pago

1. Entrá a [mercadopago.com.ar](https://www.mercadopago.com.ar/)
2. Registrate con tu DNI/CUIT y verificá la cuenta (email, teléfono, datos bancarios para retirar plata)
3. Completá la verificación de identidad si MP lo pide

---

## Paso 2 — Crear link: **Abono — continuar misión** ($500)

1. En Mercado Pago: **Tu negocio** → **Link de pago** (o **Cobrar** → **Link de pago**)
2. Título sugerido: `Malvinas — Abono continuar misión`
3. Precio: **$500** (debe coincidir con `ABONO_CONFIG.amount` en `js/config.js`)
4. Creá el link y **copiá la URL** (ej. `https://mpago.la/2XXXXXX`)

---

## Paso 3 — Crear link: **Paquete de munición** ($200)

1. Mismo menú: nuevo **Link de pago**
2. Título: `Malvinas — Paquete de munición`
3. Precio: **$200** (debe coincidir con `AMMO_SHOP_CONFIG.amount`)
4. Copiá la URL

---

## Paso 4 — Pegar links en el juego

1. Abrí `D:\Jmal\js\config.js` (o ejecutá `configurar-pagos.bat`)
2. Completá:

```javascript
export const MERCADO_PAGO_LINKS = {
  abono: 'https://mpago.la/TU_LINK_ABONO',
  ammo: 'https://mpago.la/TU_LINK_MUNICION',
};
```

3. (Opcional) Completá `PAYMENT_SELLER` con tu nombre/email
4. Guardá el archivo

---

## Paso 5 — Probar en local

1. `iniciar.bat` → jugá hasta quedarte sin balas → **[B] Comprar balas**
2. O perdé una misión → **Continuar con abono**
3. **Realizar abono / Comprar munición** debe abrir **tu** link de MP (no la home de mercadopago.com.ar)
4. Marcá el checkbox de confirmación → debe darte munición o continuar la misión

Si el botón muestra un aviso de “links no configurados”, revisá que pegaste bien las URLs en `config.js`.

---

## Paso 6 — Publicar online (después)

Cuando subas el juego a GitHub Pages, **los mismos links** funcionan desde cualquier celular o PC. Cada `git push` republica la config.

Orden recomendado:

1. ✅ Configurar `config.js` (este documento)
2. ✅ Probar en local
3. ✅ Subir a GitHub Pages y probar desde otro dispositivo
4. ⏳ Play Store (más adelante)

---

## Cambiar precios

Si cambiás el precio en Mercado Pago, actualizá también en `js/config.js`:

```javascript
export const ABONO_CONFIG = { amount: 500, ... };
export const AMMO_SHOP_CONFIG = { amount: 200, ... };
```

El texto en pantalla usa esos números; el cobro real lo hace Mercado Pago según el link.

---

## Limitaciones (importante)

| Qué | Cómo funciona hoy |
|-----|-------------------|
| Verificación automática del pago | **No** — el jugador confirma con checkbox |
| Fraude | Podés revisar pagos en el panel de MP y comparar hora/monto |
| Play Store | Google puede pedir política de reembolsos si vendés dentro de la app |

Para verificación automática haría falta un **backend** con la API de Mercado Pago (webhooks). Eso es un paso futuro si lo necesitás.

---

## Ayuda rápida

- **Doble clic:** `configurar-pagos.bat` → abre la guía y el archivo de config
- **Plantilla:** `js/config.example.js`
- **Soporte MP:** [ayuda.mercadopago.com.ar](https://www.mercadopago.com.ar/ayuda)

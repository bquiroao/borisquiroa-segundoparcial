# SubastaGT - Plataforma web de subastas de vehículos en tiempo real

**Autor:** Boris Alexander Quiroa Orellana · Carnet 1890-22-1413

## Sitio publicado

**https://borisquiroa-segundoparcial.vercel.app**

> La API está en el plan gratuito de Render y se duerme por inactividad. Si el inventario o el login tardan en responder, espere aproximadamente un minuto y recargue.

## Usuarios de prueba

| Correo | Contraseña |
|---|---|
| ana@test.com | Clave1234 |
| bob@test.com | Clave1234 |
| carla@test.com | Clave1234 |

Para probar las pujas en tiempo real, abra el mismo vehículo con dos usuarios distintos en navegadores diferentes (o una ventana privada). Ana es la dueña del vehículo publicado, así que las ofertas se hacen con Bob y Carla.

## Tecnologías

- Frontend: React + Vite (SPA), desplegado en Vercel
- Backend: Web API RESTful con Node.js + Express, desplegada en Render
- Tiempo real: Socket.IO
- Base de datos: Firebase Firestore
- Autenticación: JWT + bcrypt
- Fotografías: Cloudinary

## Reglas de puja (validadas en el servidor)

- La oferta no puede ser menor al monto base (mínimo Q. 20,000).
- Toda nueva oferta debe superar la actual en al menos 10%.
- Las ofertas son anónimas: solo se muestra el monto más alto.
- Fuera del horario de la subasta se muestra "Oferta cerrada".
- Si no se alcanza el monto base al cierre, la subasta queda desierta.
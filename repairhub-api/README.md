<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Repair Assistant Module

Módulo agregado: `repair_assistant`.

Funcionalidad:
- Carga de PDFs por `multipart/form-data` con Multer.
- Almacenamiento local en `./uploads/pdfs`.
- Extracción de texto para PDFs con text-layer usando `pdf-parse`.
- OCR no incluido.

Endpoint:
- `POST /repair-assistant/upload-pdf`
- `POST /repair-assistant/analyze-manual`
- `POST /repair-assistant/search-web`
- `POST /repair-assistant/diagnostic/next`
- `POST /repair-assistant/recommend`
- `POST /repair-assistant/recommend/stream` (SSE)
- Body: `form-data`
- Campo de archivo: `file` (PDF)

Respuesta:
- Datos del archivo guardado.
- Texto extraído y metadatos del PDF.

`analyze-manual` body (JSON):

```json
{
  "serviceOrderId": "123",
  "device": "Laptop",
  "brand": "Dell",
  "model": "Latitude 5420",
  "defectivePart": "battery not charging",
  "documentIds": ["10", "11"]
}
```

Notas de `analyze-manual`:
- Si `device/brand/model/defectivePart` faltan, usa fallback de `service_order`.
- Si un PDF tiene texto insuficiente se marca `low_text` y se agrega advertencia.
- Guarda en `chat_message` el mensaje del usuario y la respuesta del asistente serializada.

`search-web` body (JSON):

```json
{
  "device": "Laptop",
  "brand": "Dell",
  "model": "Latitude 5420",
  "defect": "battery not charging",
  "limit": 5
}
```

Salida:
- `possibleCause`
- `suggestedProcedure`
- `sources` (`title`, `url`, `sourceType`)
- `confidence` (`low` o `medium`)

Cache web:
- Tabla: `web_cache`
- TTL configurable con `WEB_CACHE_TTL_DAYS` (default `30`)
- Si hay cache reciente, responde desde cache.

Provider real (MVP pendiente de key):
- Ya existe una abstraccion `SearchProvider`.
- Por defecto usa `NoopSearchProvider` (sin llamadas externas).
- Para enchufar uno real, crea un provider que implemente `search(query, limit)` y reemplaza el binding de `SEARCH_PROVIDER_TOKEN` en `RepairAssistantModule`.

`diagnostic/next` body (JSON):

```json
{
  "serviceOrderId": "123",
  "device": "Laptop",
  "brand": "Dell",
  "model": "Latitude 5420",
  "defect": "no enciende",
  "answer": "yes"
}
```

Diagnostico interactivo:
- Crea/reutiliza `diagnosis_session` por `service_order`.
- Guarda estado (`currentStep`, `answers`, `lastQuestion`, `path`) en `state` JSONB.
- Arboles iniciales: `no power`, `overheating`, `no image`.
- Persiste cada intercambio en `chat_message`.

`recommend` body (JSON):

```json
{
  "serviceOrderId": "123",
  "device": "Laptop",
  "brand": "Dell",
  "model": "Latitude 5420",
  "defect": "no enciende",
  "documentIds": ["10", "11"]
}
```

Flujo combinado (`recommend`):
1. Busca casos internos (`repair_case`) por similitud keyword.
2. Si no hay match fuerte, analiza manual (Modo 1).
3. Si no alcanza evidencia suficiente, usa fallback web (Modo 2).
4. Intenta generar salida final con LLM (OpenAI) anclado a evidencia.
5. Si LLM no esta disponible o falla, usa exactamente la heuristica existente.
6. Retorna procedimiento unificado y guarda recomendacion en `chat_message`.

Streaming SSE (`recommend/stream`):
- Eventos emitidos:
  - `meta` -> `{"engine":"llm"|"heuristic","serviceOrderId":"...","requestId":"..."}`
  - `chunk` -> `{"text":"..."}`
  - `final` -> `RepairPlanOutput` (JSON estructurado)
  - `error` -> `{"code":"...","message":"..."}`
  - `done` -> `{"ok":true|false}`
- Incluye `ping` cada 15s para mantener conexion.
- Si LLM no esta disponible: `meta(engine=heuristic) -> final -> done`.
- Si falla stream LLM a mitad: `error -> final(heuristic fallback) -> done`.
- `chat_message.meta` guarda `engineUsed`, `streamed`, `streamFailed`.

Umbrales actuales:
- `case` fuerte: `score >= 0.65`
- `manual` suficiente: `score >= 0.70`
- `web` suficiente: `score >= 0.50`

Log de retrieval:
- Tabla `retrieval_log`
- Se guarda un registro por estrategia (`case|manual|web|llm|heuristic`) con `score` y `meta`.

## Groq Integration (LLM + Fallback)

Variables de entorno:
- `LLM_ENABLED` (default: `true`)
- `GROQ_API_KEY` (si falta, no se usa LLM)
- `GROQ_MODEL` (default: `llama-3.1-8b-instant`)
- `LLM_TIMEOUT_MS` (default: `12000`)

Comportamiento:
- Si LLM esta habilitado y hay `GROQ_API_KEY`, se intenta usar Groq via API compatible OpenAI con JSON Schema estricto.
- Si ocurre error (`401`, `429`, `5xx`, timeout o red), se activa fallback heuristico automaticamente.
- No se exponen claves al frontend.

Trazabilidad:
- Cada recomendacion guarda en `chat_message.meta.engineUsed`: `llm` o `heuristic`.
- Tambien se registra en `retrieval_log` la estrategia final usada.

Consumo frontend (POST + streaming):
- `EventSource` no soporta body `POST`.
- Usa `fetch` + `ReadableStream`:

```ts
const res = await fetch('/api/repair-assistant/recommend/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    serviceOrderId: '123',
    brand: 'Dell',
    model: 'Latitude 5420',
    defect: 'no enciende'
  })
});

const reader = res.body!.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });

  const events = buffer.split('\n\n');
  buffer = events.pop() || '';

  for (const rawEvent of events) {
    const eventName = rawEvent.match(/^event:\s*(.+)$/m)?.[1];
    const dataLines = [...rawEvent.matchAll(/^data:\s*(.*)$/gm)].map((m) => m[1]);
    const data = dataLines.join('\n');
    if (!eventName) continue;

    if (eventName === 'chunk') {
      const payload = JSON.parse(data);
      console.log('chunk:', payload.text);
    }
    if (eventName === 'final') {
      const plan = JSON.parse(data);
      console.log('final plan:', plan);
    }
  }
}
```

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

Prueba rápida con `curl`:

```bash
curl -X POST http://localhost:3000/repair-assistant/upload-pdf \
  -F "file=@/ruta/a/archivo.pdf"
```

Notas:
- La carpeta `./uploads/pdfs` se crea automáticamente si no existe.
- En Railway u otro entorno, debe existir permiso de escritura en el filesystem local.

## Repair Assistant MVP Data Model

Tablas nuevas:
- `chat_message` (historial por orden de servicio, con índice compuesto por `serviceOrderId + created_at`).
- `document` (archivo subido, asociado opcionalmente a `service_order` o global).
- `repair_case` (base de conocimiento interna de casos resueltos).

Aplicar migraciones:

```bash
npm run migration:run
```

Endpoints MVP:
- `POST /chat-messages`
- `GET /chat-messages`
- `GET /chat-messages/:id`
- `PATCH /chat-messages/:id`
- `DELETE /chat-messages/:id`
- `GET /service-orders/:id/chat` (chat history)
- `POST /documents/upload` (`form-data`, campo `file`, opcional `serviceOrderId`)
- `POST /documents/upload-many` (`form-data`, campo `files[]`, opcional `serviceOrderId`)
- `GET /documents/service-order/:id`
- `GET /documents/global`
- `GET /documents`
- `DELETE /documents/:id`
- `POST /repair-cases`
- `GET /repair-cases`
- `GET /repair-cases/:id`
- `PATCH /repair-cases/:id`
- `DELETE /repair-cases/:id`

Ejemplo de subida multiple:

```bash
curl -X POST http://localhost:3000/documents/upload-many \
  -F "serviceOrderId=123" \
  -F "files=@/ruta/manual1.pdf" \
  -F "files=@/ruta/manual2.pdf"
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

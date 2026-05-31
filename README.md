# msocial SDK

JavaScript/TypeScript SDK для [msocial](https://github.com/lghdnov/msocial) API. Сгенерировано с помощью [orval](https://orval.dev/) на основе OpenAPI спецификации.

## Установка

```bash
npm install msocial-js-sdk axios
```

## Использование

### Рекомендуемый способ `createMsocialClient`

Клиент с автоматическим управлением авторизацией

```typescript
import { createMsocialClient } from 'msocial-js-sdk';

const client = createMsocialClient('https://api.example.com');

const { data } = await client.auth.login({ openidToken: 'matrix-token' });

// 2. Сохраняем сессию, все последующие запросы автоматически получат Bearer
client.setAuth(data);

const profile = await client.users.getProfile();

// 4. При 401 клиент автоматически обновит access-токен через refresh
//    и повторит запрос. Параллельные запросы встают в очередь.

await client.auth.logout();
client.clearAuth();
```

### Ручное управление (без интерсепторов)

Если нужен полный контроль используйте отдельные модули с собственным инстансом axios:

```typescript
import { getAuth, getPosts, LoginRequest } from 'msocial-js-sdk';

const auth = getAuth();

const loginRequest: LoginRequest = {
  openidToken: 'your-matrix-token',
};

const { data } = await auth.login(loginRequest);
console.log(data.accessToken);
```

### CommonJS

```javascript
const { createMsocialClient } = require('msocial-js-sdk');

const client = createMsocialClient('https://api.example.com');
client.posts.getPost(1).then(({ data }) => {
  console.log(data);
});
```

## Модули

- `auth` - аутентификация и авторизация (`getAuth`)
- `users` - управление профилем (`getUsers`)
- `posts` - управление постами (`getPosts`)
- `comments` - управление комментариями (`getComments`)
- `echo` - тестовые эхо-запросы (`getEcho`)

## Типы

Все интерфейсы и типы экспортируются из корня пакета:

```typescript
import { UserDTO, PostDTO, CommentDTO, AuthResponse } from 'msocial-js-sdk';


# msocial SDK

JavaScript/TypeScript SDK для msocial API. Сгенерировано с помощью [orval](https://orval.dev/) на основе OpenAPI спецификации.

## Установка

```bash
npm install msocial-sdk axios
```

`axios` указан как peer-dependency, поэтому его нужно установить отдельно.

## Использование

### ESM

```typescript
import { getAuth, getPosts, LoginRequest } from 'msocial-sdk';

const auth = getAuth();

const loginRequest: LoginRequest = {
  openidToken: 'your-matrix-token',
};

const { data } = await auth.login(loginRequest);
console.log(data.accessToken);
```

### CommonJS

```javascript
const { getPosts } = require('msocial-sdk');

const posts = getPosts();
posts.getPost(1).then(({ data }) => {
  console.log(data);
});
```

### Кастомный экземпляр axios

```typescript
import axios from 'axios';
import { getUsers } from 'msocial-sdk';

const client = axios.create({
  baseURL: 'https://api.example.com',
  headers: { Authorization: 'Bearer token' },
});

const users = getUsers(client);
const { data } = await users.getProfile();
```

## Модули

- `auth` — аутентификация и авторизация (`getAuth`)
- `users` — управление профилем (`getUsers`)
- `posts` — управление постами (`getPosts`)
- `comments` — управление комментариями (`getComments`)
- `echo` — тестовые эхо-запросы (`getEcho`)

## Типы

Все интерфейсы и типы экспортируются из корня пакета:

```typescript
import { UserDTO, PostDTO, CommentDTO, AuthResponse } from 'msocial-sdk';
```

## Лицензия

MIT

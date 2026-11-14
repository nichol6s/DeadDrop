# DeadDrop — Backend

API REST que armazena cargas cifradas no Redis com tempo de expiração. No resgate, utiliza `getAndDelete` (`GETDEL`) para ler e remover o registro em uma operação atômica. A API não realiza a decifragem e não recebe a chave do navegador.

## Tecnologias e estrutura

Java 17, Spring Boot 4.1.2, Spring Web MVC, Spring Data Redis, Validation e Jackson 3. A base foi gerada pelo Spring Initializr.

| Caminho | Responsabilidade |
| --- | --- |
| `src/main/java/com/eniac/deaddrop/controller/` | Endpoints HTTP |
| `src/main/java/com/eniac/deaddrop/dto/` | Contratos de entrada e saída |
| `src/main/java/com/eniac/deaddrop/service/` | Armazenamento, TTL e resgate |
| `src/main/resources/application.properties` | Configuração da aplicação |
| `src/test/java/com/eniac/deaddrop/` | Testes de contexto, controller, service e Redis |
| `.mvn/wrapper/`, `mvnw` e `mvnw.cmd` | Distribuição Maven usada pelo projeto |

## Pré-requisitos

- JDK 17+ com `JAVA_HOME` configurado.
- Redis 7 acessível para criar e resgatar segredos.
- Internet na primeira execução para baixar Maven e dependências. Não é necessário Maven global.

## Executar em desenvolvimento

Em um terminal na raiz do repositório, inicie o Redis:

```powershell
docker compose up -d redis
docker compose exec -T redis redis-cli PING
```

A resposta esperada é `PONG`. Em outro terminal, partindo da raiz:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

A API fica em `http://localhost:8080`. Pressione `Ctrl+C` para encerrar. Em Linux/macOS, substitua `.\mvnw.cmd` por `sh mvnw`.

## Configuração

| Variável do processo | Padrão | Uso |
| --- | --- | --- |
| `REDIS_HOST` | `localhost` | Endereço do Redis |
| `REDIS_PORT` | `6379` | Porta do Redis |
| `SERVER_PORT` | `8080` | Porta HTTP da API |

O Spring não carrega automaticamente o `.env` na raiz. Para alterar uma variável no PowerShell, defina-a antes de iniciar a aplicação, por exemplo: `$env:REDIS_PORT='6380'`.

## Contrato HTTP

| Operação | Resultado esperado |
| --- | --- |
| `POST /api/secrets` | `201` com `{ "id": "uuid" }` |
| `GET /api/secrets/{id}` | `200` com `encryptedPayload` e `iv`, consumindo o registro |
| Novo resgate, identificador inexistente ou expirado | `404` |
| Criação com campos obrigatórios ausentes ou TTL não positivo | `400` |

O POST recebe `encryptedPayload` e `iv` como strings não vazias e `ttlSeconds` como inteiro positivo. Para uso real, o frontend deve produzir a carga AES-GCM e o IV em Base64. Não envie texto confidencial em claro nem inclua a chave no corpo da requisição.

## Testes e pacote executável

Dentro de `backend/`:

```powershell
.\mvnw.cmd test
.\mvnw.cmd package
java -jar target/deaddrop-backend-0.0.1-SNAPSHOT.jar
```

A suíte padrão executa sete testes sem exigir Redis; os três testes de integração ficam pulados por padrão. Para habilitá-los com Redis real em execução:

```powershell
$env:RUN_REDIS_INTEGRATION_TESTS='true'
try {
    .\mvnw.cmd test '-Dtest=SecretRedisIntegrationTest'
} finally {
    Remove-Item Env:RUN_REDIS_INTEGRATION_TESTS
}
```

A integração verifica leitura única, expiração e leitores concorrentes. Consulte o [guia completo de testes](../docs/testing.md) para validar também Docker, API e [frontend](../frontend/README.md).

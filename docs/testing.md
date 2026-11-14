# Guia de testes do DeadDrop

Este roteiro verifica a infraestrutura, os testes automatizados e o fluxo completo de compartilhamento. Use dados fictícios em todas as etapas. Os comandos abaixo são para PowerShell no Windows, começando na raiz do repositório, salvo indicação diferente.

O `docker-compose.yml` atual inicia **somente o Redis**. Backend e frontend executam na máquina, em terminais separados.

## 1. Conferir o ambiente

```powershell
node --version
npm --version
java -version
docker --version
docker compose version
docker info
```

São necessários Node.js 24+, JDK 17+ e Docker com suporte a contêineres Linux. `docker info` precisa acessar o daemon; no Docker Desktop, abra o aplicativo e aguarde o motor iniciar. Não é necessário instalar Maven globalmente: o backend inclui o Wrapper.

Reserve as portas `6379` (Redis), `8080` (API) e `3000` (frontend). A primeira instalação precisa de internet para baixar imagens e dependências.

## 2. Validar Docker e Redis

Na raiz:

```powershell
docker compose config
docker compose up -d redis
docker compose ps
docker compose exec -T redis redis-cli PING
docker compose exec -T redis redis-cli CONFIG GET save
docker compose exec -T redis redis-cli CONFIG GET appendonly
```

Resultados esperados:

- A configuração é exibida sem erro e o serviço `redis` permanece em execução.
- `PING` responde `PONG`.
- `save` possui valor vazio e `appendonly` vale `no`, conforme a configuração de armazenamento volátil do Compose.

Para investigar falhas:

```powershell
docker compose logs --tail=50 redis
```

## 3. Executar as suítes automatizadas

Em um terminal de verificação na raiz, execute o backend:

```powershell
cd backend
.\mvnw.cmd test
```

Espere `BUILD SUCCESS`, sete testes aprovados e três testes de integração pulados. Essa execução verifica o contexto Spring, o controller e o service com mocks, sem comprovar o Redis real.

Ainda em `backend/`, habilite a integração com o Redis iniciado na etapa anterior:

```powershell
$env:RUN_REDIS_INTEGRATION_TESTS='true'
try {
    .\mvnw.cmd test '-Dtest=SecretRedisIntegrationTest'
} finally {
    Remove-Item Env:RUN_REDIS_INTEGRATION_TESTS
}
```

Espere **três testes executados, nenhum pulado e nenhuma falha**: um segredo só pode ser lido uma vez, um segredo não lido expira e somente um entre oito leitores concorrentes obtém a carga. Os testes usam chaves com UUID próprio e removem apenas seus registros.

Execute o frontend, partindo novamente da raiz:

```powershell
cd frontend
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Todos os comandos devem terminar sem erros. A suíte criptográfica contém dois testes: preservação de texto Unicode/multilinha e rejeição de conteúdo adulterado. O build deve listar as rotas `/` e `/secret/[id]`.

## 4. Iniciar API e interface

Mantenha os dois processos em terminais separados. Em um terminal na raiz:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Espere o log de inicialização na porta `8080`. O backend não possui um endpoint Actuator de saúde configurado; receber `404` em `/` não significa que a aplicação deixou de iniciar.

Em outro terminal na raiz:

```powershell
cd frontend
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

Copie o exemplo somente se ainda não existir um `.env.local` configurado. O endereço da API deve ser `NEXT_PUBLIC_API_URL=http://localhost:8080`. Acesse `http://localhost:3000`.

Para conferir a versão de produção, encerre `npm run dev`, execute `npm run build` e depois `npm start`.

## 5. Verificar o contrato da API

Com API e Redis em execução, abra outro PowerShell na raiz:

```powershell
$api = 'http://localhost:8080'
$body = @{
    encryptedPayload = 'dGVzdGUtY2lmcmFkbw=='
    iv = 'AAECAwQFBgcICQoL'
    ttlSeconds = 60
} | ConvertTo-Json

$created = Invoke-RestMethod -Method Post -Uri "$api/api/secrets" -ContentType 'application/json' -Body $body
$created.id
docker compose exec -T redis redis-cli EXISTS "secret:$($created.id)"
docker compose exec -T redis redis-cli TTL "secret:$($created.id)"

Invoke-RestMethod -Method Get -Uri "$api/api/secrets/$($created.id)"
docker compose exec -T redis redis-cli EXISTS "secret:$($created.id)"
curl.exe -s -o NUL -w "%{http_code}\n" "$api/api/secrets/$($created.id)"
```

O payload acima é uma **massa sintética para o contrato HTTP**, não uma mensagem AES-GCM válida para decifrar na interface. Espere um UUID, `EXISTS` igual a `1` e TTL positivo antes da primeira leitura; depois, a carga retornada, `EXISTS` igual a `0` e HTTP `404` na tentativa seguinte. Complete essa sequência antes dos 60 segundos de expiração.

Confira também a validação de entrada:

```powershell
curl.exe -s -o NUL -w "%{http_code}\n" -X POST "$api/api/secrets" -H 'Content-Type: application/json' -d '{}'
```

Resultado esperado: `400`. Em Linux/macOS, use `curl` no lugar de `curl.exe`, `/dev/null` no lugar de `NUL` e `sh mvnw` no lugar de `.\mvnw.cmd`; adapte as variáveis e objetos PowerShell ao shell utilizado.

## 6. Validar o fluxo completo no navegador

1. Abra `http://localhost:3000` e insira um texto fictício com acentos, emoji e várias linhas.
2. Escolha um prazo e clique em **Cifrar e Gerar DeadDrop**. Confira se o link contém `/secret/{id}#chave`.
3. Abra o link em uma nova aba. Antes da confirmação, o segredo deve continuar disponível no servidor.
4. Clique em **Revelar e Queimar Segredo**. O texto deve reaparecer exatamente como foi informado.
5. Recarregue a aba e tente revelar novamente. A interface deve informar que o segredo foi lido ou expirou; a API deve responder `404`.
6. Abra um link sem o fragmento `#chave`. A página deve indicar chave ausente e impedir o resgate.

Na aba **Network** das ferramentas do navegador, confira que o POST contém `encryptedPayload`, `iv` e `ttlSeconds`, sem texto em claro ou chave. O GET de resgate deve usar apenas `/api/secrets/{id}`. Abrir a página de resgate deve aguardar o clique para consumir o segredo.

Para verificar o TTL sem aguardar uma hora na interface, use o teste de integração: ele cria um registro com expiração de um segundo e aguarda a remoção pelo Redis.

## 7. Registrar evidências e encerrar

Registre data, versões, comandos, contagens de testes e capturas do fluxo. Um teste pulado ou não executado deve ser registrado como pendente. O histórico da migração está em [project-setup.md](project-setup.md); ele não substitui a execução deste roteiro no seu ambiente.

Encerre frontend e backend com `Ctrl+C` em cada terminal. Na raiz:

```powershell
docker compose down
```

Como o Redis está configurado sem persistência, os segredos restantes são perdidos quando o contêiner é encerrado.

## Problemas frequentes

| Sintoma | Verificação |
| --- | --- |
| `docker` não reconhecido | Confira a instalação e reabra o terminal após configurar o PATH |
| Falha ao conectar ao daemon | Inicie o Docker Desktop e confira `docker info` |
| Porta já em uso | Identifique o processo que ocupa `6379`, `8080` ou `3000` antes de escolher outra porta |
| API inicia, mas criação retorna erro | Confira `PING`, os logs e `REDIS_HOST`/`REDIS_PORT` do processo Java |
| Interface não comunica com a API | Confira o processo backend e o endereço em `frontend/.env.local`; reinicie o frontend após alterá-lo |
| Integração aparece como pulada | Defina `RUN_REDIS_INTEGRATION_TESTS=true` no mesmo terminal do Maven |
| `java` ou Wrapper falha | Confira o JDK, `JAVA_HOME` e o acesso aos downloads da primeira execução |

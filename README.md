# 🔐 DeadDrop

> **Plataforma Distribuída de Compartilhamento Seguro e Efêmero de Informações Sensíveis baseada em Arquitetura Zero-Knowledge e Burn-After-Reading.**
>
> **Status: concluído.** O projeto acadêmico foi finalizado na Sprint 3, com frontend, API e Redis integrados, testes e fluxo ponta a ponta validados, relatório final elaborado e vídeo de demonstração gravado.

[![Java](https://img.shields.io/badge/Java-17%2B-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.1.2-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Security](https://img.shields.io/badge/Crypto-AES--256--GCM-10B981?style=for-the-badge&logo=shield&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

---

## 📚 Guias de execução e testes

- [Frontend: estrutura, configuração e execução](frontend/README.md)
- [Backend: API, configuração, execução e testes](backend/README.md)
- [Roteiro completo: Docker, Redis, API e navegador](docs/testing.md)
- [Origem das bases e resultados da migração](docs/project-setup.md)

---

## 📌 Visão Geral do Projeto

No ambiente corporativo e em equipes de engenharia de software, é frequente a necessidade de compartilhar credenciais temporárias, chaves de API, variáveis de ambiente (`.env`) ou certificados digitais. Frequentemente, esses dados são enviados por canais persistentes (Slack, Microsoft Teams, WhatsApp ou e-mail), onde permanecem indelevelmente registrados no histórico, vulneráveis a vazamentos e em desacordo com a **LGPD** (_Lei Geral de Proteção de Dados_).

O **DeadDrop** foi desenvolvido para tratar esse problema por meio de uma abordagem minimalista:

- **Zero-Knowledge (Servidor Cego):** O dado é cifrado no navegador do remetente com **AES-GCM de 256 bits** antes de qualquer transmissão. O servidor nunca tem acesso ao texto limpo e nem à chave de decifragem.
- **Isolamento de Chaves pela RFC 3986:** A chave simétrica é inserida exclusivamente no fragmento da URL (`https://.../secret/{uuid}#chave`). Conforme a especificação padrão da web, navegadores **nunca** transmitem o fragmento `#` nas requisições HTTP.
- **Queima Atômica (_Burn-After-Reading_):** O dado reside exclusivamente na memória volátil (RAM) do Redis. Ao ser resgatado uma única vez pelo destinatário, a API executa a instrução atômica `GETDEL`, eliminando o segredo instantaneamente da memória sem deixar rastros em disco.
- **Expurgo por TTL Ativo:** Segredos não lidos são automaticamente incinerados pelo próprio motor do Redis após o período estipulado (1 hora, 24 horas ou 7 dias).

---

## 🏗️ Arquitetura do Sistema

O projeto adota o princípio **KISS (Keep It Simple, Stupid)**, dividindo-se em 3 componentes desacoplados:

```mermaid
graph TD
    User["👤 Usuário Remetente / Destinatário"]

    subgraph ClientSide ["Dispositivo do Usuário (Navegador Web)"]
        UI["🖥️ Frontend Web Responsivo<br/><b>Next.js 16 + Tailwind CSS</b><br/>Interface Dev-Cyber"]
        CryptoEngine["🔐 Módulo Criptográfico<br/><b>Web Crypto API (AES-GCM 256 bits)</b><br/>Gera chaves e cifra/decifra localmente"]
        URLFragment["🔗 Fragmento da URL (#chave)<br/>A chave nunca trafega via HTTP (RFC 3986)"]
    end

    subgraph BackendSide ["Camada de Serviços Distribuídos (Servidor)"]
        API["⚙️ API REST Cega<br/><b>Java 17 + Spring Boot 4</b><br/>Gestão de UUIDs e expurgo atômico"]
    end

    subgraph StorageSide ["Armazenamento Efêmero"]
        RedisMemory["⚡ Cache em Memória Volátil<br/><b>Redis 7 (In-Memory)</b><br/>Chave-Valor com TTL e comando atômico GETDEL"]
    end

    User -->|"Interage via UI"| UI
    UI -->|"Aciona cifragem/decifragem"| CryptoEngine
    CryptoEngine -.->|"Anexa chave na hashtag"| URLFragment
    UI -->|"Envia APENAS payload cifrado e IV (POST /api/secrets)"| API
    UI -->|"Solicita queima e resgate (GET /api/secrets/{id})"| API
    API -->|"Grava payload com TTL (SETEX)"| RedisMemory
    API -->|"Executa leitura e destruição instantânea (GETDEL)"| RedisMemory
```

---

## 🔄 Fluxo de Cifragem, Transporte e Incineração

O diagrama de sequência a seguir detalha o ciclo de vida completo de um segredo compartilhado:

```mermaid
sequenceDiagram
    autonumber
    actor Remetente as 👤 Remetente
    participant BrowserA as 🖥️ Navegador (Web Crypto)
    participant API as ⚙️ Spring Boot API
    participant Redis as ⚡ Redis (Memória RAM)
    actor Destinatario as 👤 Destinatário
    participant BrowserB as 🖥️ Navegador Destinatário

    %% Criação
    Remetente->>BrowserA: Insere segredo confidencial e seleciona TTL
    Note over BrowserA: 1. Gera chave efêmera AES-256-GCM<br/>2. Gera IV aleatório de 12 bytes<br/>3. Cifra o conteúdo localmente
    BrowserA->>API: POST /api/secrets { encryptedPayload, iv, ttlSeconds }
    API->>Redis: SET secret:{uuid} {payload, iv} EX ttl
    Redis-->>API: OK
    API-->>BrowserA: Retorna { id: uuid }
    Note over BrowserA: Monta URL: https://dominio/secret/{uuid}#{chaveBase64}
    BrowserA-->>Remetente: Link gerado pronto para cópia

    %% Envio do link
    Remetente-)Destinatario: Envia o link com a hashtag #chave

    %% Resgate e Queima
    Destinatario->>BrowserB: Abre o link no navegador
    Note over BrowserB: Extrai #{chaveBase64} do hash local<br/>Exibe alerta: "Ler irá incinerar o dado"
    Destinatario->>BrowserB: Clica em [Revelar e Queimar]
    BrowserB->>API: GET /api/secrets/{uuid}
    API->>Redis: GETDEL secret:{uuid} (Operação Atômica)
    Redis-->>API: Retorna {payload, iv} e purga da RAM
    API-->>BrowserB: HTTP 200 { encryptedPayload, iv }
    Note over BrowserB: Decifra conteúdo localmente com a chave da hashtag
    BrowserB-->>Destinatario: Exibe texto confidencial decifrado

    %% Tentativa subsequente
    Note over Destinatario,API: Qualquer tentativa de acesso posterior
    Destinatario->>BrowserB: Recarrega a página ou tenta novo acesso
    BrowserB->>API: GET /api/secrets/{uuid}
    API->>Redis: GETDEL secret:{uuid}
    Redis-->>API: (nil / inexistente)
    API-->>BrowserB: HTTP 404 (Segredo já incinerado ou expirado)
```

---

## 🎨 Identidade Visual (Dev-Cyber Minimalista)

![alt](./docs/diagrams/frontend_creation.png)

O frontend foi desenvolvido sob a estética **Dev-Cyber**, projetada para desenvolvedores e profissionais de cibersegurança:

- **Dark Mode Elegante:** Tons de ardósia e carvão escuro (`#090D16`, `#0F172A`) com bordas sutis.
- **Tipografia Técnica:** Combinação de _Inter_ para elementos de navegação e _JetBrains Mono_ para variáveis, códigos e áreas de texto.
- **Feedback Visual em Tempo Real:** Indicador de segurança ativa, aviso de não-tráfego de chave na rede e contador de queima atômica.

---

## 📁 Estrutura de Diretórios

```text
├── backend/                       # API REST em Java 17 + Spring Boot 4
│   ├── src/main/java/             # Código-fonte da aplicação
│   │   └── com/eniac/deaddrop/
│   │       ├── controller/        # SecretController (endpoints POST e GET)
│   │       ├── dto/               # Records imutáveis de entrada/saída
│   │       └── service/           # SecretService com integração atômica Redis (GETDEL)
│   ├── src/test/java/             # Testes automatizados (JUnit + Mockito)
│   └── pom.xml                    # Configuração Maven do projeto
│
├── frontend/                      # Aplicação Web em Next.js 16 + Tailwind CSS
│   ├── src/app/                   # App Router do Next.js
│   │   ├── page.tsx               # Tela principal de criação de DeadDrop
│   │   └── secret/[id]/page.tsx   # Tela de revelação, queima e decifragem local
│   ├── src/lib/                   # Módulos de lógica
│   │   ├── crypto.ts              # Motor criptográfico Web Crypto API (AES-256-GCM)
│   │   └── crypto.test.mjs        # Testes de integridade da criptografia no cliente
│   └── package.json               # Dependências do frontend
│
├── docs/                          # Documentação e diagramas
│   └── diagrams/                  # Diagramas C4 e de Sequência em Mermaid
│
├── docker-compose.yml             # Orquestração do serviço Redis 7 em memória
├── .env.example                   # Exemplo de variáveis de ambiente
└── README.md                      # Documentação completa do projeto
```

---

## 🚀 Como Executar o Projeto Localmente

A estrutura foi migrada para bases oficiais do `create-next-app` e do Spring Initializr. Consulte [configuração e validação](docs/project-setup.md) para os comandos de geração, build, lint e integração com Redis. Os comandos Maven abaixo são para PowerShell/Windows; em Linux/macOS, use `sh mvnw`.


### Pré-requisitos

- **Java Development Kit (JDK):** Versão 17 ou superior.
- **Node.js:** Versão 24 ou superior.
- **Docker & Docker Compose** (ou um servidor Redis local rodando na porta 6379).

---

### Passo 1: Iniciar o Armazenamento Efêmero (Redis)

Suba a instância volátil do Redis via Docker Compose:

```bash
docker compose up -d redis
```

_(Caso não possua Docker, basta ter um servidor Redis ativo em `localhost:6379`)_.

---

### Passo 2: Executar o Backend (Spring Boot)

Abra o diretório `backend` no **IntelliJ IDEA** (ou via terminal) e execute:

```bash
cd backend
.\mvnw.cmd spring-boot:run
```

A API REST estará disponível em: `http://localhost:8080`

- `POST http://localhost:8080/api/secrets`
- `GET  http://localhost:8080/api/secrets/{id}`

---

### Passo 3: Executar o Frontend (Next.js)

Abra um novo terminal no diretório `frontend`:

```bash
cd frontend
npm ci
npm run dev
```

Acesse a aplicação no navegador em: **`http://localhost:3000`**

---

## 🧪 Testes Automatizados e Validação

Na validação final da Sprint 3, foram aprovados 10 testes do backend com Redis real, 2 testes de criptografia do frontend e 10 verificações automatizadas do fluxo ponta a ponta. Também foram concluídos lint, verificação de tipos e build do frontend. Os cenários incluíram criação, recuperação, segunda tentativa de leitura, chave ausente, expiração e concorrência. Consulte o [guia de testes](docs/testing.md) para reproduzir as verificações.

### Backend (JUnit + Mockito)

Com o Redis em execução, rode a suíte completa, incluindo os testes de integração de leitura única, expiração e concorrência:

```bash
cd backend
$env:RUN_REDIS_INTEGRATION_TESTS = "true"
.\mvnw.cmd test
```

### Frontend (Web Crypto API)

Para validar a conformidade da cifragem e decifragem AES-256-GCM local:

```bash
cd frontend
npm test
```

---

## 🎓 Contexto Acadêmico

Este projeto foi desenvolvido como parte integrante do **Módulo 6** do curso de **Engenharia de Software** do **Centro Universitário ENIAC**.

- **Disciplina:** Projeto Integrador — _Distributed and Secure Solutions_
- **Professor Avaliador:** Prof. Lucio Luzetti Criado
- **Aluno:** Nicholas Santos Pereira — RA: `269722025`
- **Semestre:** 2º Semestre / 2026

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte `LICENSE` para mais informações.

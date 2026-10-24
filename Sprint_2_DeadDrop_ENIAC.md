# ENGENHARIA DE SOFTWARE - MÓDULO 6

**NICHOLAS SANTOS PEREIRA - RA 269722025**

**PROJETO INTEGRADOR - DISTRIBUTED AND SECURE SOLUTIONS**  
**SPRINT 2: DESENVOLVIMENTO, METODOLOGIA E EVIDÊNCIAS PRÁTICAS**

Trabalho apresentado ao Curso de Engenharia de Software do Centro Universitário ENIAC para a disciplina Projeto Integrador - Distributed and Secure Solutions.  
**Prof. Lucio Luzetti Criado**  
Guarulhos — 2026

---

## 1. Revisão e Continuidade da Sprint 1
A Sprint 1 (Compreensão do Tema e Objetivos) estabeleceu os alicerces teóricos e conceituais do projeto **DeadDrop**, obtendo aprovação integral com nota máxima (10/10) e sem apontamentos de correção. O projeto visa solucionar o problema de compartilhamento inseguro de credenciais, variáveis de ambiente (.env) e dados sensíveis por canais corporativos persistentes (Slack, Teams, WhatsApp), implementando uma plataforma distribuída baseada em **Criptografia de Ponta a Ponta no Cliente (Client-Side Encryption)** e arquitetura **Zero-Knowledge** com descarte atômico (*burn-after-reading*).

---

## 2. Projeto Prático da Solução

Para garantir eficiência e evitar complexidades desnecessárias (princípio KISS), o DeadDrop foi projetado sob uma arquitetura distribuída de 3 camadas desacopladas:

### 2.1. Frontend Web Client (Next.js 14 + Tailwind CSS + Web Crypto API)
* **Interface Dev-Cyber Minimalista:** Visual dark moderno, responsivo para desktop e dispositivos móveis, com tipografia *JetBrains Mono* e *Inter*.
* **Cifragem Local no Navegador:** Utiliza a Web Crypto API nativa com o algoritmo simétrico **AES-GCM de 256 bits**.
* **Isolamento de Chaves (Zero-Knowledge):** A chave de decifragem é gerada no navegador e anexada estritamente no fragmento da URL (`#chave`). Em conformidade com a norma RFC 3986, fragmentos após `#` nunca são enviados nas requisições HTTP, tornando o servidor cego ao conteúdo decifrado.

### 2.2. Backend REST Stateless (Java 17 + Spring Boot 3)
* **API REST Cega:** Responsável apenas por intermediar pacotes cifrados sem possuir a chave de decifragem.
* **Operações Essenciais:**
  * `POST /api/secrets`: Recebe `{ encryptedPayload, iv, ttlSeconds }`, gera um UUID aleatório, persiste na memória com TTL e retorna `{ id }`.
  * `GET /api/secrets/{id}`: Executa o resgate com destruição atômica imediata.

### 2.3. Camada de Armazenamento Efêmero (Redis 7)
* **Descarte Atômico (*Burn-After-Reading*):** Utiliza o comando nativo `GETDEL` (ou `getAndDelete`), que resgata a carga criptografada e a purga da memória RAM na mesma operação atômica, eliminando riscos de concorrência (*race conditions*).
* **Expurgo por Tempo de Vida (TTL):** Segredos que não forem resgatados dentro do tempo limite (ex: 1 hora, 24 horas ou 7 dias) são eliminados automaticamente pelo próprio motor do Redis via política de expiração ativa.

---

## 3. Metodologia de Desenvolvimento e Ferramentas

O projeto adota uma metodologia ágil enxuta baseada em **Scrum/Kanban**, dimensionada de forma direta para o ciclo de 3 Sprints do semestre:
* **Sprint 1 (Concluída):** Escopo, Problema, Justificativa e Objetivos SMART.
* **Sprint 2 (Atual):** Projeto Prático, Arquitetura, Metodologia, Evidências Visuais e Estimativa de Custos.
* **Sprint 3 (Final):** Validação de Testes de Carga/Segurança, Conclusões e Fechamento.

### 3.1. Ferramental Técnico
* **Ambiente de Desenvolvimento Backend:** IntelliJ IDEA (Java 17, Spring Boot 3, Maven).
* **Ambiente de Desenvolvimento Frontend:** Visual Studio Code (Next.js, TypeScript, Tailwind CSS).
* **Controle de Versão e Gestão:** Git e repositório GitHub com **GitHub Projects (Kanban)** para acompanhamento visual do fluxo (A Fazer, Em Andamento, Concluído).
* **Ambiente de Contêineres:** Docker e Docker Compose para provisionamento isolado do nó Redis.
* **Validação e Testes:** JUnit 5 e Mockito (testes automatizados de serviços e controllers) e Node.js Test Runner (testes unitários de integridade da Web Crypto API).

### 3.2. Decisões Arquiteturais Registradas (ADRs)
1. **ADR 01 — Criptografia Client-Side Exclusiva:** Garante conformidade por desenho com a LGPD (*Privacy by Design*), pois os dados trafegam e residem no servidor em estado indecifrável.
2. **ADR 02 — Chave no Fragmento da URL (`#`):** Evita o tráfego da chave em cabeçalhos, rotas de API, logs de proxy e servidores web.
3. **ADR 03 — Uso Exclusivo de Redis em Memória com `GETDEL`:** Dispensa bancos de dados relacionais e tabelas em disco, mitigando recuperação forense de segredos após sua incineração.

---

## 4. Evidências Visuais e Protótipo Prático

### 4.1. Diagrama de Arquitetura de Contêineres (Visão C4)
O diagrama a seguir sintetiza o isolamento de responsabilidades e o modelo de comunicação distribuída:

```
[ Usuário Remetente / Destinatário ]
                │
                ▼
┌────────────────────────────────────────────────────────┐
│  Navegador Web (Next.js 14 + Tailwind CSS)            │
│  - Web Crypto API (AES-GCM 256 bits)                   │
│  - Chave anexada somente na hashtag (#chave)           │
└───────────────────────┬────────────────────────────────┘
                        │ HTTP REST (Payload cifrado + IV)
                        ▼
┌────────────────────────────────────────────────────────┐
│  API Spring Boot 3 (Java 17 REST)                     │
│  - Controlador Cego (POST /api/secrets e GET)          │
└───────────────────────┬────────────────────────────────┘
                        │ Operações Atômicas
                        ▼
┌────────────────────────────────────────────────────────┐
│  Redis 7 (Memória Volátil com TTL)                    │
│  - Destruição atômica via GETDEL                       │
└────────────────────────────────────────────────────────┘
```

### 4.2. Diagrama de Sequência (Cifragem, Envio e Incineração)
1. Remetente insere texto confidencial e aciona "Cifrar e Gerar DeadDrop".
2. Web Crypto API gera chave simétrica efêmera e IV de 12 bytes.
3. Frontend envia `{ encryptedPayload, iv, ttlSeconds }` ao Spring Boot.
4. Spring Boot grava em Redis (`secret:{uuid}`) e devolve o identificador.
5. Frontend monta link: `https://deaddrop.dev/secret/{uuid}#{chave}`.
6. Destinatário abre o link, lê a chave do fragmento `#` e clica em "Revelar e Queimar".
7. Backend executa `GETDEL secret:{uuid}`, devolve a carga e apaga o dado na memória.
8. Navegador receptor decifra localmente e exibe a mensagem.
9. Qualquer nova requisição subsequente recebe código `404 Not Found`.

### 4.3. Telas do Protótipo Funcional (Dev-Cyber Minimalista)
* **Tela de Criação:** Card escuro centralizado com área de texto em fonte mono, seletor de expiração, indicador de segurança ativa e botão de cifragem com geração instantânea de link.
* **Tela de Resgate e Incineração:** Alerta visual de destruição permanente, botão "Revelar e Queimar Segredo", seguido pela visualização do texto em sintaxe protegida e botão de cópia com um clique.

### 4.4. Gestão Ágil no GitHub Projects (Quadro Kanban)
* **Coluna Concluído:** Sprint 1, especificação de requisitos e definição do tema.
* **Coluna Em Andamento:** Implementação dos endpoints Spring Boot, módulo de criptografia e interface Next.js.
* **Coluna A Fazer:** Testes de carga e validação da Sprint 3.

---

## 5. Estimativa de Recursos e Custos

### 5.1. Recursos Humanos e Carga Horária
* **Engenheiro Responsável:** Nicholas Santos Pereira (RA: 269722025).
* **Dedicação Estimada:** ~20 horas por Sprint (~60 horas no total do projeto).

### 5.2. Custos no Ambiente de Desenvolvimento (Acadêmico)
* **Custo Total: R$ 0,00 (Gratuito)**.
* Uso de ferramentas de código aberto (Java OpenJDK, Next.js, Redis, Tailwind CSS), IDEs gratuitas (IntelliJ Community e VS Code) e orquestração local via Docker.

### 5.3. Projeção Hipotética e Opcional de Custos em Produção (Cloud AWS)
> *Nota de Esclarecimento: Os valores abaixo representam apenas uma projeção teórica de arquitetura caso o projeto venha a ser disponibilizado comercialmente no futuro, não constituindo custo real ou despesa incorrida no âmbito acadêmico.*

| Item / Serviço | Provedor / Tipo | Finalidade | Custo Estimado (Mensal) |
|---|---|---|---|
| **Compute / API** | AWS App Runner / Cloud Run | Hospedagem da API Spring Boot com auto-scaling | ~US$ 15,00 |
| **Armazenamento Volátil** | Upstash Redis / AWS ElastiCache | Cache em memória de alta performance com TTL | ~US$ 10,00 |
| **DNS & Segurança WAF** | Cloudflare Free / Domínio .br | Certificado SSL/TLS e mitigação DDoS | ~US$ 1,00 |
| **Total Estimado (Projeção Futura)** | — | — | **~US$ 26,00 / mês** |

---

## 6. Conclusão da Sprint 2
A Sprint 2 consolida a transição do plano conceitual para a arquitetura prática funcional. O DeadDrop demonstra viabilidade técnica total, combinando segurança de nível empresarial (Web Crypto AES-256-GCM), arquitetura cega Zero-Knowledge, descarte atômico via Redis e uma interface elegante voltada a profissionais de tecnologia. A Sprint 3 focará na validação final dos testes de integridade, documentação dos resultados e apresentação do produto acabado.

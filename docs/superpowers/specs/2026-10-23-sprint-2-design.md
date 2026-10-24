# Especificação de Design - Sprint 2: DeadDrop

**Projeto:** DeadDrop — Plataforma Distribuída de Compartilhamento Seguro e Efêmero de Informações Sensíveis  
**Autor:** Nicholas Santos Pereira (RA: 269722025)  
**Instituição:** Centro Universitário ENIAC  
**Curso:** Engenharia de Software — Módulo 6 (2026)  
**Disciplina:** Projeto Integrador — Distributed and Secure Solutions  
**Data:** 23 de Outubro de 2026  
**Status:** Validado / Pronto para Planejamento de Implementação  

---

## 1. Contexto e Objetivos da Sprint 2

Na Sprint 1, foram definidos o tema, os objetivos SMART e a arquitetura conceitual do **DeadDrop**, obtendo aprovação com nota máxima. O objetivo da Sprint 2 é avançar na proposta prática e na metodologia do projeto ("mão na massa"), atendendo aos seguintes critérios avaliativos:

1. **Projetar a Solução:** Definir de forma prática e enxuta a arquitetura distribuída, o modelo de comunicação e a segurança Zero-Knowledge.
2. **Descrever a Metodologia:** Explicar o ciclo ágil enxuto (estruturado em 3 sprints), o ferramental técnico adotado e as decisões arquiteturais tomadas.
3. **Incluir Evidências Visuais:** Apresentar diagramas de arquitetura/sequência e o protótipo visual da interface com estilo Dev-Cyber.
4. **Estimar Custos e Recursos:** Mapear o esforço de engenharia (horas) e os custos de infraestrutura tanto no ambiente de desenvolvimento quanto em uma projeção de produção em nuvem.
5. **Revisar a Sprint 1:** Confirmar a manutenção da base conceitual que obteve nota máxima.

---

## 2. Princípios Arquiteturais e Abordagem Enxuta (KISS)

A arquitetura do DeadDrop adota o princípio **KISS (Keep It Simple, Stupid)** e o padrão **Zero-Knowledge**, eliminando complexidades desnecessárias (como bancos SQL relacionais ou microsserviços pesados) e focando em três componentes altamente coesos e desacoplados:

```
[ Navegador do Usuário (Next.js) ]
         │
         ├─ 1. Gera chave simétrica efêmera AES-GCM (256 bits)
         ├─ 2. Cifra o conteúdo no navegador (Client-Side)
         ├─ 3. Envia APENAS o payload cifrado e IV ao servidor
         │    (A chave reside exclusivamente no fragmento da URL: #chave)
         │
         ▼ Requisições REST JSON
[ Backend Spring Boot (API Cega) ]
         │
         ├─ Não possui chave nem capacidade de descriptografia
         ├─ Expõe 2 operações simples: Criar (POST) e Resgatar/Queimar (GET)
         │
         ▼ Comandos Atômicos em Memória
[ Redis 7 (Armazenamento Volátil com TTL) ]
         └─ Armazena chaves sob formato `secret:{id}` com autodestruição atômica
```

### Componentes:

1. **Frontend (Next.js 14+ / TypeScript / Tailwind CSS):**
   * Interface visual responsiva seguindo o padrão **Dev-Cyber Minimalista**.
   * Manipulação de criptografia via **Web Crypto API** nativa dos navegadores (sem bibliotecas externas vulneráveis).
   * Tratamento estrito do fragmento da URL (`window.location.hash`), garantindo que a chave de decifragem nunca seja transmitida pela rede nem gravada em logs HTTP.

2. **Backend (Java 17+ com Spring Boot 3):**
   * API REST cega e stateless.
   * Endpoints essenciais:
     * `POST /api/secrets`: Valida o payload cifrado, gera um identificador único (UUID), grava no Redis com TTL e devolve `{ id }`.
     * `GET /api/secrets/{id}`: Executa a leitura atômica com deleção simultânea (`GETDEL`). Retorna o payload cifrado ou `404 Not Found` caso o segredo já tenha sido resgatado ou expirado.
   * Sem persistência em disco ou banco relacional.

3. **Armazenamento Efêmero (Redis):**
   * Armazena pares chave-valor na memória RAM.
   * Assegura descarte irreversível automático via expiração de TTL (`EXPIRE`) ou no exato momento da primeira leitura (`GETDEL`).

---

## 3. Fluxo Criptográfico e Queima Atômica (*Burn-After-Reading*)

### 3.1. Envio de Segredo (Remetente)
1. O usuário insere a mensagem/credencial no campo de texto e define o tempo limite de retenção (ex: 1 leitura ou 24 horas).
2. O navegador gera uma chave simétrica efêmera **AES-GCM de 256 bits** (`crypto.subtle.generateKey`).
3. O navegador gera um vetor de inicialização (IV) de 12 bytes aleatórios (`crypto.getRandomValues`).
4. O conteúdo é cifrado no cliente (`crypto.subtle.encrypt`).
5. A chave gerada é exportada em formato raw e convertida para Base64URL.
6. O frontend envia ao backend via `POST /api/secrets`:
   ```json
   {
     "encryptedPayload": "base64...",
     "iv": "base64...",
     "ttlSeconds": 86400
   }
   ```
7. O backend persiste no Redis com a chave `secret:<uuid>` e retorna o UUID.
8. O frontend monta a URL de compartilhamento:
   `https://deaddrop.dev/secret/<uuid>#<base64Key>`

### 3.2. Resgate e Incineração (Destinatário)
1. O destinatário acessa a URL no navegador.
2. O frontend captura o `<uuid>` da rota e o `<base64Key>` do fragmento da URL (`window.location.hash`).
3. Uma tela de confirmação é exibida: *"Atenção: ler este segredo irá incinerá-lo irreversivelmente do servidor"*.
4. O destinatário clica em **[Revelar Segredo]**.
5. O frontend faz a requisição `GET /api/secrets/<uuid>`.
6. O Spring Boot executa no Redis: `GETDEL secret:<uuid>` (operação atômica).
   * **Garantia contra Race Conditions:** Apenas a primeira requisição bem-sucedida recebe o conteúdo; no mesmo milissegundo o registro é purgado da memória RAM.
7. O backend devolve o payload cifrado e o IV.
8. O navegador importa a chave e realiza a decifragem local (`crypto.subtle.decrypt`).
9. O texto legível é apresentado na tela com opção de cópia com 1 clique.
10. Qualquer acesso subsequente (ou recarregamento de página) resulta em `404 Not Found`.

---

## 4. Identidade Visual e Experiência do Usuário (Dev-Cyber Minimalista)

* **Tema e Cores:** Dark theme moderno com fundo ardósia/carvão escuro (`#090D16`, `#0F172A`), bordas sutis (`#1E293B`) e acentos em verde esmeralda (`#10B981`) para status ativo e âmbar (`#F59E0B`) para alertas de destruição.
* **Tipografia:** Fonte sans-serif limpa (*Inter*) combinada com fonte mono (*JetBrains Mono*) para áreas de código e variáveis.
* **Interações:**
  * Indicador em tempo real de *"Criptografia AES-256 no cliente ativa"*.
  * Seletor intuitivo de tempo de autodestruição (1 leitura imediata, 1 hora, 24 horas, 7 dias).
  * Campo opcional de senha para camada adicional de derivação PBKDF2.
  * Botão de cópia rápida e aviso explícito de que a chave na URL nunca toca o servidor.

---

## 5. Metodologia de Desenvolvimento e Ferramental

O projeto segue uma abordagem ágil e direta, sem burocracias excessivas, estruturada em **3 Sprints bem delimitadas**:
* **Sprint 1 (Concluída - Nota Máxima):** Definição do escopo, problema, justificativa e objetivos SMART.
* **Sprint 2 (Atual):** Projeto prático, arquitetura detalhada, prototipação visual e metodologias/custos.
* **Sprint 3 (Final):** Validação prática, testes, evidências finais e conclusão do projeto.

### Ferramentas Utilizadas:
* **Desenvolvimento Backend:** IntelliJ IDEA (Java 17, Spring Boot 3, Maven).
* **Desenvolvimento Frontend:** Visual Studio Code (Next.js, TypeScript, Tailwind CSS).
* **Controle de Versão e Gestão:** Git e repositório GitHub com **GitHub Projects (Kanban)** para rastreamento visual das atividades (A Fazer, Em Andamento, Concluído).
* **Ambiente de Execução e Testes:** Docker & Docker Compose (orquestração do Redis e dependências) e Postman / JUnit 5 para validação de endpoints e testes de contratos.

### Decisões Arquiteturais Registradas (ADRs):
1. **Criptografia 100% no Cliente (Client-Side):** Cumpre princípios de *Privacy by Design* e conformidade com a LGPD, garantindo que o servidor seja cego e imune a vazamentos de dados legíveis.
2. **Chave no Fragmento da URL (`#`):** Garante conformidade com a RFC 3986, impedindo que a chave de decifragem transite pelo tráfego de rede ou seja gravada em logs de servidores proxy e roteadores.
3. **Uso Exclusivo de Redis em Memória com `GETDEL`:** Evita custos e complexidades de bancos relacionais e garante queima atômica e descarte por TTL sem necessidade de tarefas cron de expurgo.

---

## 6. Evidências Visuais e Artefatos da Sprint 2

A documentação a ser entregue incorporará:
1. **Diagrama de Arquitetura de Contêineres (C4):** Demonstrando o isolamento entre o cliente Web Crypto, a API Spring Boot e a instância do Redis.
2. **Diagrama de Sequência:** Mapeando as etapas de cifragem, transporte cego e resgate com autodestruição.
3. **Quadro Kanban de Gestão:** Representação visual das etapas no GitHub Projects.
4. **Capturas do Protótipo Visual:** Telas de criação, geração de link e revelação no estilo Dev-Cyber.

---

## 7. Estimativa de Recursos e Custos

### 7.1. Recursos Humanos e Esforço
* **Desenvolvedor:** Nicholas Santos Pereira.
* **Dedicação:** ~20 horas dedicadas por Sprint (~60 a 80 horas de carga horária total no semestre).

### 7.2. Custos no Ambiente de Desenvolvimento
* **Custo Total: R$ 0,00.**
* Utilização exclusiva de tecnologias Open Source, ambientes de teste locais via Docker e camadas gratuitas de versionamento (GitHub).

### 7.3. Projeção Opcional e Futura de Custos em Ambiente de Produção (Cloud AWS)
> **Nota de Esclarecimento:** Esta estimativa representa exclusivamente um exercício de projeção arquitetural e orçamentária **caso** a equipe decida, em um momento futuro e posterior à conclusão acadêmica, disponibilizar o DeadDrop publicamente em escala corporativa. Não constitui custo incorrido no momento nem obrigação contratual para o escopo do Projeto Integrador.

* **Compute (AWS App Runner / Cloud Run):** ~US$ 15,00 / mês (instância de microsserviço sob demanda com auto-sleep).
* **Armazenamento em Memória (Upstash Redis / AWS ElastiCache t4g.micro):** ~US$ 10,00 / mês.
* **Domínio e Proteção WAF/DDoS (Cloudflare Free / Registro .br):** ~US$ 1,00 / mês.
* **Total Mensal Projetado (Cenário Hipotético de Produção):** ~**US$ 26,00 / mês** (baixo custo operacional, sem dependência de licenciamento proprietário).

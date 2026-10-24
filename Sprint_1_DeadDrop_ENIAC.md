ENGENHARIA DE SOFTWARE - MÓDULO 6

NICHOLAS SANTOS PEREIRA - RA 269722025


PROJETO INTEGRADOR - DISTRIBUTED AND SECURE SOLUTIONS

SPRINT 1: COMPREENSÃO DO TEMA E OBJETIVOS


Guarulhos
2026

---

NICHOLAS SANTOS PEREIRA


PROJETO INTEGRADOR - DISTRIBUTED AND SECURE SOLUTIONS

SPRINT 1: COMPREENSÃO DO TEMA E OBJETIVOS


Trabalho apresentado ao Curso Engenharia de Software do Centro Universitário ENIAC para a disciplina Projeto Integrador - Distributed and Secure Solutions.

Prof. Lucio Luzetti Criado


Guarulhos
2026

---

# Descrição do Software

**Nome do Projeto:** DeadDrop

**Tema:** Plataforma Distribuída de Compartilhamento Seguro e Efêmero de Informações e Arquivos Sensíveis baseada em Arquitetura Zero-Knowledge (Burn-after-reading com Criptografia de Ponta a Ponta).

**Funcionalidade Principal:** A aplicação permite que usuários compartilhem mensagens confidenciais, credenciais, chaves de configuração (.env) e pequenos arquivos sensíveis por meio de links temporários de uso único. O conteúdo é criptografado localmente no dispositivo do remetente antes da transmissão. O servidor atua como intermediário cego (Zero-Knowledge), armazenando a carga indecifrável em memória volátil com tempo de vida limitado (TTL). Ao ser aberto uma única vez pelo destinatário, o dado é descriptografado no dispositivo receptor e imediatamente incinerado de forma irreversível da memória do servidor (burn-after-reading).

**Público-Alvo:** Equipes de engenharia de software e TI que necessitam trocar credenciais de acesso temporárias sem poluir históricos corporativos (Slack, Teams, WhatsApp), departamentos jurídicos e financeiros, e organizações que buscam conformidade com a LGPD no trânsito e descarte atômico de dados sensíveis.

**Tecnologias que vão ser utilizadas:**
* **Frontend Web Responsivo:** Next.js, React e TypeScript com Tailwind CSS (Interface otimizada para uso em navegadores Desktop e Mobile).
* **Backend / API Distribuída:** Java com Spring Boot, estruturado sob arquitetura REST.
* **Camada de Armazenamento Volátil:** Redis (armazenamento em memória com TTL ativo para garantia de destruição atômica dos registros).
* **Segurança e Criptografia:** Web Crypto API utilizando algoritmo simétrico AES-GCM de 256 bits (Client-side) e derivação de chaves via PBKDF2.
* **Testes e Validação:** JUnit 5 e Mockito (testes unitários e de integração no backend) e Postman (validação dos contratos da API).

---

# Objetivos do Projeto

### Objetivo Geral:
Projetar e implementar uma solução de software distribuída e segura para o compartilhamento efêmero de mensagens e arquivos confidenciais, garantindo confidencialidade absoluta por meio de criptografia ponta a ponta no cliente (Zero-Knowledge) e descarte atômico após leitura única ou expiração de tempo.

### Objetivos Específicos:
* **1. Implementar Criptografia Ponta a Ponta no Cliente (Client-Side Encryption):**
   - Desenvolver módulos criptográficos utilizando a Web Crypto API para cifragem e decifragem de mensagens e arquivos com o algoritmo AES-GCM (256 bits).
   - Assegurar que a chave criptográfica seja anexada apenas no fragmento da URL (#) no dispositivo do remetente, nunca trafegando pelo servidor.
* **2. Construir uma Arquitetura Distribuída Eficiente e Desacoplada:**
   - Desenvolver uma API RESTful para receber, coordenar e fornecer os pacotes criptografados.
   - Integrar camada de armazenamento volátil em memória (Redis) com TTL ativo, garantindo que dados não resgatados dentro do prazo sejam automaticamente destruídos.
* **3. Garantir a Inviolabilidade e Destruição Atômica dos Registros:**
   - Estabelecer a regra de leitura única (burn-after-reading): ao ser lido, o registro é imediatamente purgado da memória.
   - Implementar medidas de proteção contra força bruta (rate-limiting) e proteção opcional por senha com derivação PBKDF2.
* **4. Prover Interface Web Moderna e Responsiva:**
   - Construir interface Web em Next.js com Tailwind CSS, totalmente adaptada para navegação intuitiva tanto em Desktop quanto em smartphones.
   - Implementar contadores visuais de autodestruição e feedback gráfico em tempo real para confirmação da incineração do dado.

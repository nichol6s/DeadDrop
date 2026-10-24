import docx
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

def create_sprint_2_doc():
    doc = docx.Document('Sprint_1_Projeto_Integrador_DeadDrop.docx')

    # Update Cover Page for Sprint 2
    for p in doc.paragraphs[:90]:
        for r in p.runs:
            if 'SPRINT 1' in r.text:
                r.text = r.text.replace('SPRINT 1', 'SPRINT 2: DESENVOLVIMENTO, METODOLOGIA E EVIDÊNCIAS PRÁTICAS')

    # Remove old body paragraphs (index 90 onwards)
    p_elements = [p._p for p in doc.paragraphs[90:]]
    for p_elem in p_elements:
        p_elem.getparent().remove(p_elem)

    def add_p(text="", bold_prefix="", bullet=False, space_after=6, space_before=0, font_size=11):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.line_spacing = 1.15

        if bullet:
            r_bullet = p.add_run("• ")
            r_bullet.font.name = "Open Sans"
            r_bullet.font.size = Pt(font_size)

        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.font.name = "Open Sans"
            r_bold.font.size = Pt(font_size)
            r_bold.font.bold = True

        if text:
            r_text = p.add_run(text)
            r_text.font.name = "Open Sans"
            r_text.font.size = Pt(font_size)

        return p

    def add_heading_1(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        r = p.add_run(title)
        r.font.name = "Open Sans"
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = RGBColor(17, 24, 39)
        return p

    def add_heading_2(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(title)
        r.font.name = "Open Sans"
        r.font.size = Pt(11.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(31, 41, 55)
        return p

    # --- Seção 1: Revisão da Sprint 1 ---
    add_heading_1("1. Revisão e Continuidade da Sprint 1")
    add_p(
        "A Sprint 1 (Compreensão do Tema e Objetivos) estabeleceu os fundamentos teóricos e conceituais do projeto DeadDrop, "
        "obtendo aprovação integral com nota máxima (10/10) e sem necessidade de correções estruturais. A proposta foca na resolução "
        "do compartilhamento inseguro de dados confidenciais (chaves de API, credenciais corporativas e arquivos de configuração sensíveis) "
        "em canais corporativos com histórico persistente (como Slack, Teams e WhatsApp). A solução mantém estritamente os princípios "
        "definidos de Criptografia de Ponta a Ponta no Cliente (Client-Side Encryption) com arquitetura Zero-Knowledge e descarte atômico "
        "(burn-after-reading) em conformidade com a LGPD e o conceito de Privacy by Design."
    )

    # --- Seção 2: Projeto Prático da Solução ---
    add_heading_1("2. Projeto Prático da Solução")
    add_p(
        "Para garantir robustez, alto desempenho e evitar sobrecarga de engenharia desnecessária (princípio KISS - Keep It Simple, Stupid), "
        "o DeadDrop foi projetado em uma arquitetura distribuída de 3 camadas coesas e totalmente desacopladas:"
    )

    add_heading_2("2.1. Frontend Web Client (Next.js 14 + Tailwind CSS + Web Crypto API)")
    add_p("Desenvolvido com padrão visual Dev-Cyber Minimalista em dark mode, responsivo para desktop e dispositivos móveis.", bold_prefix="Interface e Usabilidade: ", bullet=True)
    add_p("A cifragem e a decifragem dos segredos ocorrem exclusivamente no navegador por meio da Web Crypto API padrão, utilizando o algoritmo simétrico AES-GCM com chaves de 256 bits.", bold_prefix="Cifragem Local no Cliente: ", bullet=True)
    add_p("A chave simétrica efêmera gerada no cliente é anexada estritamente no fragmento da URL (#chave). De acordo com a especificação RFC 3986, fragmentos nunca são transmitidos em cabeçalhos ou requisições HTTP, garantindo que o servidor seja cego e nunca acesse o segredo em texto claro.", bold_prefix="Isolamento Zero-Knowledge: ", bullet=True)

    add_heading_2("2.2. Backend REST Stateless (Java 17 + Spring Boot 3)")
    add_p("API RESTful cega e desacoplada, desenvolvida em Java com Spring Boot, responsável apenas por receber e coordenar o armazenamento dos pacotes criptografados.", bold_prefix="Papel da API: ", bullet=True)
    add_p("POST /api/secrets (recebe o payload cifrado e IV em Base64 com o tempo de retenção, gerando um UUID) e GET /api/secrets/{id} (executa o resgate com destruição imediata).", bold_prefix="Endpoints Essenciais: ", bullet=True)
    add_p("A API é totalmente stateless e não possui banco de dados relacional (SQL), eliminando retenção desnecessária em disco.", bold_prefix="Simplicidade Operacional: ", bullet=True)

    add_heading_2("2.3. Camada de Armazenamento Volátil (Redis 7)")
    add_p("Os pacotes indecifráveis são armazenados exclusivamente na memória RAM sob formato chave-valor (secret:{id}).", bold_prefix="Armazenamento em Memória: ", bullet=True)
    add_p("Utilização da operação atômica GETDEL nativa do Redis. No exato instante em que o destinatário solicita o segredo, a API o lê e o deleta da memória RAM em um único passo, eliminando qualquer risco de race condition ou leitura duplicada.", bold_prefix="Queima Atômica (Burn-After-Reading): ", bullet=True)
    add_p("Segredos que não forem abertos dentro da janela estipulada (1 hora, 24 horas ou 7 dias) são automaticamente expurgados pelo mecanismo de TTL ativo do Redis.", bold_prefix="Expiração por Tempo Limite (TTL): ", bullet=True)

    # --- Seção 3: Metodologia de Desenvolvimento ---
    add_heading_1("3. Metodologia de Desenvolvimento e Ferramentas")
    add_p(
        "O projeto adota uma metodologia ágil simplificada fundamentada no Scrum e Kanban, com escopo planejado de forma "
        "direta para o ciclo de 3 Sprints avaliativas do semestre:"
    )
    add_p("Sprint 1 (Concluída - Nota Máxima): Definição do escopo, problema, justificativa mercadológica e objetivos SMART.", bullet=True)
    add_p("Sprint 2 (Atual): Projeto prático da solução, metodologia enxuta, evidências visuais e estimativa de recursos.", bullet=True)
    add_p("Sprint 3 (Final): Validação de testes automatizados, critérios de aceitação e considerações finais.", bullet=True)

    add_heading_2("3.1. Ferramental Técnico")
    add_p("IntelliJ IDEA (Backend Java Spring Boot e Maven) e Visual Studio Code (Frontend Next.js e TypeScript).", bold_prefix="Ambientes Integrados de Desenvolvimento (IDEs): ", bullet=True)
    add_p("Git e repositório GitHub com GitHub Projects (Kanban) para acompanhamento das fases A Fazer, Em Andamento e Concluído.", bold_prefix="Controle de Versão e Gestão: ", bullet=True)
    add_p("Docker e Docker Compose para provisionamento isolado do container Redis local.", bold_prefix="Ambiente de Infraestrutura Local: ", bullet=True)
    add_p("JUnit 5 e Mockito (testes unitários e de integração de controllers no backend) e Node.js Test Runner (testes do módulo Web Crypto).", bold_prefix="Testes Automatizados: ", bullet=True)

    add_heading_2("3.2. Decisões Arquiteturais Registradas (ADRs)")
    add_p("A adoção de criptografia client-side assegura conformidade total com a Lei Geral de Proteção de Dados (LGPD), minimizando passivos jurídicos por vazamento de dados no servidor.", bold_prefix="ADR 01 — Criptografia Client-Side Obrigatória: ", bullet=True)
    add_p("A manutenção da chave simétrica exclusivamente na hashtag da URL impede que proxies, roteadores corporativos e provedores de internet interceptem a chave de decifragem.", bold_prefix="ADR 02 — Chave no Fragmento da URL: ", bullet=True)
    add_p("O uso do comando atômico GETDEL em Redis garante que nunca existirá mais de uma leitura do mesmo dado, impedindo reconstrução forense de dados após o resgate.", bold_prefix="ADR 03 — Destruição Atômica via GETDEL em Redis: ", bullet=True)

    # --- Seção 4: Evidências Visuais e Protótipo ---
    add_heading_1("4. Evidências Visuais e Protótipo Prático")
    add_p(
        "A seguir são apresentadas as evidências estruturais da arquitetura e o protótipo funcional das telas do DeadDrop:"
    )

    add_heading_2("4.1. Arquitetura de Contêineres (Visão C4)")
    add_p(
        "A solução divide-se nitidamente entre a fronteira do cliente (Navegador com Web Crypto API), o nó de aplicação (Spring Boot REST API) "
        "e o cache volátil em memória (Redis). O diagrama a seguir sintetiza as fronteiras de isolamento:"
    )
    add_p(
        "[ Usuário / Browser ]\n"
        "      │ (Gera chave AES-256 no cliente; anexa chave na #URL)\n"
        "      ▼\n"
        "[ Frontend Next.js 14 ] ──── Envia apenas Payload Cifrado + IV ────► [ API Spring Boot 3 ]\n"
        "                                                                           │ (Comandos Atômicos)\n"
        "                                                                           ▼\n"
        "                                                                 [ Redis 7 In-Memory (TTL) ]"
    )

    add_heading_2("4.2. Fluxo de Sequência (Criação, Compartilhamento e Queima)")
    add_p("1. O remetente insere o texto confidencial no frontend e clica em 'Cifrar e Gerar DeadDrop'.", bullet=True)
    add_p("2. O navegador gera localmente a chave AES-256-GCM e o vetor de inicialização (IV de 12 bytes), gerando o payload cifrado.", bullet=True)
    add_p("3. O frontend envia via POST /api/secrets apenas a carga indecifrável e o IV para o Spring Boot.", bullet=True)
    add_p("4. O Spring Boot grava o registro no Redis com tempo de expiração ativo (TTL) e devolve um UUID identificador.", bullet=True)
    add_p("5. O frontend monta a URL final no formato https://dominio/secret/{id}#{chave} e fornece botão de cópia rápida.", bullet=True)
    add_p("6. O destinatário acessa o link, visualiza o aviso de destruição irreversível e confirma a abertura.", bullet=True)
    add_p("7. A API executa a instrução GETDEL secret:{id} no Redis, retornando o pacote e deletando-o da memória simultaneamente.", bullet=True)
    add_p("8. O navegador receptor decifra o conteúdo localmente com a chave contida no hash da URL e exibe o segredo na tela.", bullet=True)
    add_p("9. Qualquer tentativa subsequente de acessar o mesmo identificador recebe status HTTP 404 (Not Found).", bullet=True)

    add_heading_2("4.3. Interface do Protótipo Funcional (Dev-Cyber Minimalista)")
    add_p("Card dark slate (#090D16) com área de texto em fonte mono, indicador visual de segurança AES-256 ativa, seletor de tempo limite e botão de geração instantânea de link.", bold_prefix="Tela de Criação de DeadDrop: ", bullet=True)
    add_p("Card de alerta com confirmação de queima atômica ('Revelar e Queimar Segredo'), seguido da exibição do segredo decifrado e aviso de destruição imediata da memória do servidor.", bold_prefix="Tela de Revelação e Incineração: ", bullet=True)

    # --- Seção 5: Estimativa de Recursos e Custos ---
    add_heading_1("5. Estimativa de Recursos e Custos")

    add_heading_2("5.1. Recursos Humanos e Carga Horária")
    add_p("Engenheiro de Software Responsável: Nicholas Santos Pereira (RA: 269722025).", bullet=True)
    add_p("Carga Horária Dedicada: ~20 horas por Sprint (~60 horas de esforço técnico total ao longo do semestre).", bullet=True)

    add_heading_2("5.2. Custos no Ambiente de Desenvolvimento (Acadêmico)")
    add_p(
        "Custo Total: R$ 0,00 (Gratuito). O desenvolvimento utiliza integralmente tecnologias de código aberto (OpenJDK 17, Spring Boot, "
        "Next.js, Tailwind CSS e Redis Alpine), ambientes locais via Docker e licenças gratuitas de ferramentas acadêmicas (GitHub e IDEs comunitárias)."
    )

    add_heading_2("5.3. Projeção Hipotética e Opcional de Custos em Produção (Cloud AWS)")
    add_p(
        "Nota de Esclarecimento: A tabela a seguir representa estritamente um exercício teórico de planejamento orçamentário e arquitetural "
        "caso a solução venha a ser disponibilizada comercialmente em ambiente de produção no futuro. Não constitui despesa incorrida nem "
        "custo obrigatório no escopo deste Projeto Integrador."
    )

    # Tabela de Custos
    table = doc.add_table(rows=1, cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_cells = table.rows[0].cells
    headers = ["Item / Serviço", "Provedor / Tipo", "Finalidade Técnica", "Custo Estimado (Mensal)"]
    for i, h in enumerate(headers):
        hdr_cells[i].text = h
        p = hdr_cells[i].paragraphs[0]
        p.runs[0].font.name = "Open Sans"
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(9.5)

    data = [
        ("Compute / API", "AWS App Runner / Cloud Run", "Execução do Spring Boot com auto-scaling sob demanda", "~US$ 15,00"),
        ("Armazenamento Volátil", "Upstash Redis / ElastiCache", "Cluster Redis em memória com TTL ativo", "~US$ 10,00"),
        ("Domínio & Segurança", "Cloudflare Free / Registro .br", "Proteção DDoS, CDN e terminação SSL/TLS", "~US$ 1,00"),
        ("Total Mensal Projetado", "—", "Custo operacional total em cenário corporativo futuro", "~US$ 26,00 / mês")
    ]

    for row_data in data:
        row_cells = table.add_row().cells
        for i, val in enumerate(row_data):
            row_cells[i].text = val
            p = row_cells[i].paragraphs[0]
            p.runs[0].font.name = "Open Sans"
            p.runs[0].font.size = Pt(9)
            if row_data[0] == "Total Mensal Projetado":
                p.runs[0].font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # --- Seção 6: Conclusão da Sprint 2 ---
    add_heading_1("6. Conclusão da Sprint 2")
    add_p(
        "A Sprint 2 atinge integralmente todos os objetivos propostos pelo Centro Universitário ENIAC: a solução foi projetada de forma "
        "prática e enxuta, a metodologia ágil e as decisões de arquitetura foram formalizadas, as evidências visuais de contêineres e sequência "
        "foram consolidadas, e a estimativa de custos evidenciou a alta viabilidade econômica do DeadDrop. A solução está totalmente preparada "
        "para a Sprint 3 final, que contemplará a consolidação dos testes automatizados e o fechamento do relatório conclusivo."
    )

    doc.save('Sprint_2_Projeto_Integrador_DeadDrop.docx')
    print("Sprint_2_Projeto_Integrador_DeadDrop.docx created successfully!")

if __name__ == '__main__':
    create_sprint_2_doc()

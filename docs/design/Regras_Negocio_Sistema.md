# 🧠 CanaVision - Regras de Negócio do Sistema (Global)

Este documento consolida as regras lógicas e de domínio que governam o CanaVision, garantindo a integridade dos dados e a segurança entre clientes.

---

## 1. Monitoramento Agrícola e Satélite
- **Satélite e Revisita:** Utilizamos imagens **Sentinel-2**. A frequência de novas análises depende da taxa de revisita (aprox. 5 dias) e da cobertura de nuvens.
- **Data de Referência:** Todo índice (NDVI/NDWI) deve ser indexado pela data em que a imagem foi capturada pelo satélite, não pela data de processamento.
- **Escalas:**
    - **Propriedade:** Visão global da fazenda/usina.
    - **Talhão:** Visão setorizada por área de plantio.

## 2. Gestão de Clientes e Tenancy
- **O Cliente como Raiz:** O `Cliente` (Usina/Fazenda/Cooperativa) é o dono supremo dos dados. 
- **Isolamento Total:** Nenhum dado (Propriedade, Talhão ou Artefato) pode ser compartilhado entre diferentes `clienteId`.
- **Hierarquia:** A permissão de acesso flui da Propriedade para seus talhões e artefatos.

## 3. Gestão de Usuários e Acessos
- **Perfis (Roles):**
    - **ADMIN:** Acesso total aos dados do seu cliente e gestão de usuários.
    - **OPERADOR:** Acesso apenas para visualização e exportação de dados.
    - **CONSULTOR:** Perfil limitado com acesso a propriedades específicas (Opcional Futuro).
- **Sessão Segura:** Cookies HTTP-Only com expiração configurada para garantir a segurança em ambientes corporativos.

## 4. Identificação e Semântica de Recursos
- **Identificadores (Slugs):** Todo arquivo processado deve ter um identificador amigável que permita o "parse" rápido no frontend: `{ID_PROPRIEDADE}-{DATA_YYYYMMDD}-{INDICE}_{TALHAO}`.

## 5. Integridade do SIG (Sistema de Informação Geográfica)
- **Extensão PostGIS:** Todo dado geográfico (Polígonos) deve ser armazenado usando a extensão PostGIS para garantir cálculos precisos de área em hectares.
- **Formato de Exportação:** GeoJSON para visualização web e GeoTIFF para análises técnicas de vigor.

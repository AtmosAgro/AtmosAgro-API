# Endpoint Status Report - CanaVision API

Este documento detalha o estado atual dos endpoints da API, sua implementação, documentação e possíveis retornos.

## 1. Endpoints Implementados e Registrados

### 1.1. Autenticação (`/api/auth`)
| Endpoint | Método | Descrição | Status Imp. | Status Doc. |
| :--- | :---: | :--- | :---: | :---: |
| `/auth/register` | `POST` | Registro de novo usuário | ✅ Sim | ✅ Sim |
| `/auth/login` | `POST` | Login e geração de tokens | ✅ Sim | ✅ Sim |
| `/auth/forgot-password` | `POST` | Solicitação de reset de senha | ✅ Sim | ✅ Sim |
| `/auth/reset-password` | `POST` | Redefinição de senha com token | ✅ Sim | ✅ Sim |
| `/auth/refresh-token` | `POST` | Renovação do Access Token | ✅ Sim | ✅ Sim |
| `/auth/logout` | `POST` | Encerramento de sessão | ✅ Sim | ✅ Sim |

**Retornos Possíveis:**
- `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `409 Conflict`.

---

### 1.2. Propriedades (`/api/propriedades`)
| Endpoint | Método | Descrição | Status Imp. | Status Doc. |
| :--- | :---: | :--- | :---: | :---: |
| `/propriedades` | `POST` | Criar nova propriedade | ✅ Sim | ✅ Sim |
| `/propriedades` | `GET` | Listar propriedades do cliente | ✅ Sim | ✅ Sim |
| `/propriedades/:id` | `GET` | Detalhar uma propriedade | ✅ Sim | ✅ Sim |
| `/propriedades/:id` | `PUT` | Atualizar dados da propriedade | ✅ Sim | ✅ Sim |
| `/propriedades/:id` | `DELETE` | Remover uma propriedade | ✅ Sim | ✅ Sim |
| `/propriedades/:propriedadeId/talhoes` | `GET` | Listar talhões da propriedade | ✅ Sim | ✅ Sim |

**Retornos Possíveis:**
- `200 OK`, `201 Created`, `204 No Content`, `400`, `401`, `404`, `409`.

---

### 1.3. Talhões (`/api/talhoes`)
| Endpoint | Método | Descrição | Status Imp. | Status Doc. |
| :--- | :---: | :--- | :---: | :---: |
| `/talhoes` | `POST` | Criar novo talhão | ✅ Sim | ✅ Sim |
| `/talhoes` | `GET` | Listar talhões do cliente | ✅ Sim | ✅ Sim |
| `/talhoes/:id` | `GET` | Detalhar um talhão | ✅ Sim | ✅ Sim |
| `/talhoes/:id` | `PUT` | Atualizar dados do talhão | ✅ Sim | ✅ Sim |
| `/talhoes/:id` | `DELETE` | Remover um talhão | ✅ Sim | ✅ Sim |

**Retornos Possíveis:**
- `200 OK`, `201 Created`, `204 No Content`, `400`, `401`, `404`, `409`.

---

### 1.4. Artefatos (`/api/artefatos`)
| Endpoint | Método | Descrição | Status Imp. | Status Doc. |
| :--- | :---: | :--- | :---: | :---: |
| `/artefatos` | `GET` | Listar todos os artefatos do cliente | ✅ Sim | ✅ Sim |
| `/artefatos/propriedade/:id` | `GET` | Listar artefatos de uma propriedade | ✅ Sim | ✅ Sim |
| `/artefatos/:id` | `GET` | Detalhar um artefato (metadados) | ✅ Sim | ✅ Sim |
| `/artefatos/:id/signed-url` | `GET` | Gera Signed URL temporária (15 min) para o GCS | ✅ Sim | ✅ Sim |
| `/artefatos/:id/download` | `GET` | Download via Proxy Stream (fallback) | ✅ Sim | ✅ Sim |

**Observações:**
- O campo `caminho` (path interno GCS) **não é exposto** nas respostas (removido por segurança — Abril/2026).
- O fluxo preferencial para o frontend é `signed-url`: a URL é gerada pela API e o arquivo é baixado diretamente do GCS pelo browser.
- Validadores Zod para campos de busca ainda pendentes.

---

### 1.5. Saúde (`/api/health`)
| Endpoint | Método | Descrição | Status Imp. | Status Doc. |
| :--- | :---: | :--- | :---: | :---: |
| `/health` | `GET` | Verifica saúde do serviço | ✅ Sim | ✅ Sim |

---

## 2. Endpoints em Desenvolvimento (Planned)

| Domínio | Endpoint Base | Status | Observação |
| :--- | :--- | :---: | :--- |
| **Pipeline** | `/api/pipeline` | 🛠️ In Progress | Fluxo assíncrono Core (Python) |
| **Alertas** | `/api/alertas` | ⏳ To Do | Notificações e anomalias |
| **Clientes** | `/api/clientes` | ⏳ To Do | Gestão administrativa de clientes |
| **Usuários** | `/api/usuarios` | ⏳ To Do | Gestão de perfil e permissões |
| **SICAR** | `/api/sicar` | ⏳ To Do | Integração com dados do CAR |

---

## 3. Resumo de Cobertura
- **Funcionalidade Central (CRUD Geo):** 90% implementado.
- **Autenticação:** 100% implementado.
- **Artefatos (GCS):** 100% implementado (inclui Signed URL — Abril/2026).
- **Pipeline de Imagens:** 10% (Planejamento).
- **Documentação Detalhada:** 95% concluída.

*Última atualização: Abril/2026*

# 🏗️ Arquitetura: Multitenancy e Isolamento de Dados (Global)

## 1. Visão Geral
A API do CanaVision adota o modelo **Multitenant (In-App)**. Todos os dados são isolados logicamente através do `clienteId` (UUID). O objetivo é garantir que o "Cliente A" nunca acesse dados do "Cliente B".

---

## 2. A Hierarquia de Posse (Ownership)

O isolamento segue uma estrutura de árvore, onde a permissão é validada de baixo para cima:

1.  **Nível Cliente (Raiz):** Define o escopo máximo. Um usuário pertence a um Cliente.
2.  **Nível Propriedade:** Vinculada diretamente ao `clienteId`. É a âncora de segurança para tudo o que está dentro dela.
3.  **Nível Recurso (Talhão/Artefato/Alerta):** Estes recursos herdam a permissão da **Propriedade**. 
    - Validação: `recurso -> propriedade -> clienteId`.

---

## 3. Regras de Ouro por Domínio

### 3.1. Autenticação (Auth)
- O `clienteId` é extraído do JWT no momento da requisição pelo `authMiddleware`.
- Nunca confie em um `clienteId` enviado pelo Frontend em métodos `POST`, `PUT` ou `DELETE`. Use sempre o ID decodificado do token.

### 3.2. Propriedades e Talhões
- **Busca:** Toda query de listagem (`findMany`) deve conter obrigatoriamente `{ where: { clienteId } }`.
- **Escrita:** Ao criar uma propriedade, o `clienteId` é injetado pelo Service.

### 3.3. Artefatos e Imagens
- O isolamento estende-se ao Storage. A API atua como um Proxy, validando a permissão no banco de dados antes de abrir o stream de leitura do bucket no GCS.

---

## 4. Exemplos de Validação no Código (Service Layer)

```typescript
// Exemplo: Deletar Talhão
async delete(id: string, authClienteId: string) {
  const talhao = await repository.findById(id); // Busca incluindo a propriedade pai
  
  // REGRA: O cliente logado é o mesmo dono da propriedade do talhão?
  if (talhao.propriedade.clienteId !== authClienteId) {
    throw new ForbiddenError('Este talhão pertence a outro cliente.');
  }
  
  return repository.delete(id);
}
```

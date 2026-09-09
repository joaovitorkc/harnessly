# Início rápido

> Este é um preview de desenvolvimento. Até `joaovitorkc/harnessly` e um
> release verificável serem publicados, use os arquivos locais
> `prompts/<slug>/PROMPT.md`. As URLs Raw abaixo são entradas do release futuro.

Os workflows do Harnessly são arquivos Markdown. Você não instala o Harnessly
para usá-los.

## 1. Escolha permissão e organização

- `MODE=ASSESS`: somente inspeciona e relata. É o padrão.
- `MODE=APPLY`: executa writes locais declarados e verifica.
- `PROFILE=STANDARD`: mantém orientação perto do código.
- `PROFILE=ADVANCED`: cria um control plane em `orchestrator/` sem mover
  código.

Modo controla permissão. Perfil controla organização.

## 2. Use uma versão fixada

Use uma tag de release como atalho para avaliar:

```text
Leia https://raw.githubusercontent.com/joaovitorkc/harnessly/<TAG_OU_SHA_COMPLETO>/prompts/setup-workspace/PROMPT.md
e siga o workflow neste repositório com MODE=ASSESS PROFILE=STANDARD.
```

Revise o diagnóstico. Para aplicar:

```text
Leia https://raw.githubusercontent.com/joaovitorkc/harnessly/<SHA_COMPLETO>/prompts/setup-workspace/PROMPT.md
e siga o workflow neste repositório com MODE=APPLY PROFILE=STANDARD.
```

Se o agente não acessar URLs, cole o conteúdo de `PROMPT.md`.

## 3. Confira o retorno

Um resultado completo informa:

- aplicabilidade e evidências;
- modo, perfil, topologia, raiz e unidades detectadas;
- caminhos planejados ou alterados;
- gates e motivos de parada;
- checks como `PASS`, `FAIL`, `NOT_RUN`, `BLOCKED`, `N/A` ou `STALE`;
- riscos residuais e itens não verificados.

A aplicabilidade é `APPLICABLE` quando o workflow serve, `N/A` quando a
evidência prova que a capacidade não existe e `BLOCKED` quando faltam fatos ou
permissões. Checks `NOT_RUN`, `BLOCKED` e `STALE` não são sucesso.

## 4. Perfil avançado

Dentro de um repositório, `orchestrator/` aponta para `..`. Na pasta pai
comum, ele registra os repositórios irmãos. Harnessly não copia nem move os
projetos.

Se a topologia não estiver clara, informe
`TOPOLOGY=EMBEDDED` ou `TOPOLOGY=PARENT_HUB`.

## 5. Workflow específico

Exemplo: apenas avaliar rate limiting:

```text
Leia https://raw.githubusercontent.com/joaovitorkc/harnessly/<TAG_OU_SHA_COMPLETO>/prompts/harden-http-rate-limits/PROMPT.md
e siga com MODE=ASSESS.
```

Site estático ou somente client retorna `N/A`. Serviço HTTP ainda precisa
provar ingresso próprio, topologia, confiança em proxy, chave de identidade e
superfície de teste.

## Segurança

- Use `MODE=APPLY` somente com o SHA completo registrado no manifesto
  verificado do release, nunca com branch ou tag móvel.
- Confira versão e digest do release.
- Abra o agente na raiz correta.
- Não disponibilize credenciais de produção.
- Revise o diff antes de commitar.

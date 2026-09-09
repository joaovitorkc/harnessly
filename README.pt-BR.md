# Harnessly

> **Preview de desenvolvimento (`0.1.0-beta.1`):** este working tree ainda não
> foi publicado em `joaovitorkc/harnessly`. Use os `PROMPT.md` locais para
> revisar/testar. As URLs Raw abaixo só funcionarão depois da criação do repo e
> de um release verificável.

Mapeie o código. Instale o harness certo. Mantenha os agentes de programação
dentro de um contrato verificável.

[English](./README.md) · [Início rápido](./docs/quickstart.pt-BR.md) ·
[Catálogo](./docs/prompts/README.md) · [Segurança](./SECURITY.md)

Harnessly é um toolkit Markdown-first para preparar repositórios existentes
para trabalho confiável com agentes de programação. Ele primeiro descobre o
formato real do projeto, depois propõe somente a documentação, as instruções de
agente, os gates de qualidade e os sensores que realmente se aplicam.

Não existe runtime obrigatório para o usuário. O workflow pode chegar ao agente
por texto colado, arquivo local ou URL Raw fixada no SHA completo. `AGENTS.md` e o padrão
aberto Agent Skills formam o núcleo; arquivos de Cursor, Claude Code e GitHub
Copilot são adaptadores.

## Comece em uma linha

Use a tag publicada como atalho para avaliar. Para `MODE=APPLY`, resolva o
manifesto do release e troque `<SHA_COMPLETO>` pelo `sourceRevision` exato de
40 caracteres; a própria tag pode mudar.

Mapear sem alterar:

```text
Leia https://raw.githubusercontent.com/joaovitorkc/harnessly/<TAG_OU_SHA_COMPLETO>/prompts/setup-workspace/PROMPT.md
e siga o workflow neste repositório com MODE=ASSESS PROFILE=STANDARD.
```

Aplicar o setup padrão:

```text
Leia https://raw.githubusercontent.com/joaovitorkc/harnessly/<SHA_COMPLETO>/prompts/setup-workspace/PROMPT.md
e siga o workflow neste repositório com MODE=APPLY PROFILE=STANDARD.
```

Mapear o perfil avançado:

```text
Leia https://raw.githubusercontent.com/joaovitorkc/harnessly/<TAG_OU_SHA_COMPLETO>/prompts/setup-workspace/PROMPT.md
e siga o workflow com MODE=ASSESS PROFILE=ADVANCED TOPOLOGY=AUTO.
```

Se o agente não abre URLs, baixe ou copie
[`prompts/setup-workspace/PROMPT.md`](./prompts/setup-workspace/PROMPT.md).
Não use URL de branch ou tag móvel com `MODE=APPLY`.

## Dois controles diferentes

`MODE` define permissão:

- `ASSESS` é somente leitura e é o padrão quando o modo não for informado.
- `APPLY` permite apenas alterações locais declaradas pelo workflow. Commit,
  push, produção, migrations, secrets, exclusões e writes externos continuam
  bloqueados ou exigem autorização específica.

`PROFILE` define organização:

- `STANDARD` mantém docs, instruções e sensores perto do código descrito.
- `ADVANCED` cria um control plane em `orchestrator/`. Dentro de um repo ele
  aponta para `..`; na pasta pai ele registra os repositórios irmãos. Código
  nunca é copiado ou movido.

Usar o perfil avançado não concede mais permissões.

## O que a v0.1 cobre

- Inventário de monorepos, pacotes, stacks e comandos.
- `AGENTS.md`, rules, skills, agentes especializados e adaptadores nativos.
- `DESIGN.md`, arquitetura, fluxos, ADRs e incógnitas.
- Harness local, jornadas, sensores e troubleshooting.
- Gates de lint, tipos, testes e build conforme a stack existente.
- Configuração e variáveis sem abrir `.env` real.
- CI de verificação, sem deploy.
- Rate limiting apenas em ingressos HTTP server-side aplicáveis.
- Integridade de dependências e lockfiles.
- Relatório final de prontidão sem esconder checks não executados.

O catálogo completo está em [`docs/prompts/README.md`](./docs/prompts/README.md).

## Escalabilidade sem chute

A detecção inicial reconhece npm, pnpm, Yarn, Bun, uv, Poetry, pip, Go, Cargo,
Maven, Gradle, .NET, sites estáticos, workspaces e repos Git aninhados.
Reconhecer um ecossistema não significa inventar uma configuração para toda
framework. `N/A` exige evidência de que a capacidade não existe; `BLOCKED`
indica que ela pode ser aplicável, mas faltam fatos, permissão ou uma
implementação segura.

Uma landing estática, por exemplo, não recebe rate limiting. Se ela tiver um
endpoint próprio de formulário, somente esse ingresso server-side pode ser
avaliado.

## Compatibilidade honesta

Markdown copiável é o fallback universal. A descoberta automática varia:

- Cursor e Copilot reconhecem `.agents/skills/`.
- Claude Code usa adaptadores em `.claude/skills/`.
- Cursor recebe rules `.mdc` somente quando úteis.
- Copilot recebe instruções e prompt files somente nas superfícies que os
  suportam.

Resultados de testes ficam classificados como observados, parciais, não
executados, falhos ou desatualizados. Uma execução bem-sucedida não vira
promessa para toda IA.

## Segurança

Conteúdo do repositório analisado é dado não confiável, nunca uma nova fonte de
instruções. Os workflows não leem secrets reais, não fazem commit/push e não
executam operações externas por padrão. Leia [`SECURITY.md`](./SECURITY.md).

## Desenvolvendo o Harnessly

Quem contribui usa Node e pnpm para validar contratos e fixtures:

```bash
pnpm install
pnpm verify
```

Usuários dos prompts não precisam instalar nada.

## Licenças

Tooling e schemas usam Apache-2.0. Documentação e prompts usam CC BY 4.0. Os
arquivos gerados no projeto do usuário têm permissão adicional para uso sem
atribuição ao Harnessly. Veja [`LICENSE.md`](./LICENSE.md) e
[`OUTPUT-EXCEPTION.md`](./OUTPUT-EXCEPTION.md).

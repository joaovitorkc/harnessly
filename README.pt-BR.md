<p align="center">
  <img src="./assets/harnessly-hero.svg" alt="Harnessly — primeiro mapeia, depois muda com confiança" width="100%">
</p>

# Harnessly

**Dê à sua IA o contexto, os limites e as verificações que o projeto realmente
precisa — sem reconstruir tudo em volta de uma ferramenta nova.**

O Harnessly olha o repositório primeiro, mostra um plano concreto e espera sua
autorização antes de alterar qualquer coisa. Funciona com Markdown puro no
Cursor, Claude Code, GitHub Copilot e outros agentes de programação.

[English](./README.md) · [Comece aqui](./docs/quickstart.pt-BR.md) ·
[Catálogo de workflows](./docs/prompts/README.md) · [Segurança](./SECURITY.md)

> **Preview de desenvolvimento (`0.1.0-beta.1`):** o repositório público e o
> release ainda não estão no ar. A mensagem pronta abaixo funcionará depois da
> publicação. Até lá, use o
> [`prompts/setup-workspace/PROMPT.md`](./prompts/setup-workspace/PROMPT.md)
> local.

## Comece em uns 30 segundos

Não tem CLI nem pacote para instalar. Abra sua IA **dentro do projeto que você
quer preparar**, copie esta mensagem e envie:

```text
Leia https://raw.githubusercontent.com/joaovitorkc/harnessly/v0.1.0-beta.1/prompts/setup-workspace/PROMPT.md
Analise este projeto e me mostre o setup que você recomenda. Não altere nada ainda.
```

O Harnessly vai mapear o projeto e explicar o plano. Se fizer sentido, responda
no **mesmo chat**:

```text
Pode aplicar o plano que você acabou de me mostrar. Valide o resultado e diga o que não conseguiu verificar.
```

Só isso. Você não precisa trocar nenhum texto na URL, saber o que é SHA ou
colar o link de novo. O agente continua usando exatamente o workflow que já
analisou.

Quer um `orchestrator/` para organizar vários repositórios? Troque apenas a
segunda linha:

```text
Leia https://raw.githubusercontent.com/joaovitorkc/harnessly/v0.1.0-beta.1/prompts/setup-workspace/PROMPT.md
Quero o setup avançado com uma pasta orchestrator. Primeiro analise e não altere nada ainda.
```

Se sua IA não abre URLs, abra ou cole o
[`PROMPT.md`](./prompts/setup-workspace/PROMPT.md) local e mande o mesmo pedido
em linguagem normal.

## O que ele coloca no projeto

O Harnessly cria o que estiver faltando e preserva o que você já fez:

- uma entrada clara para a IA entender o projeto;
- documentação de arquitetura e decisões;
- mapa de pacotes, comandos e repositórios;
- um caminho confiável para validar o código;
- adaptadores seguros para Cursor, Claude Code e Copilot;
- verificações específicas para CI, dependências, configuração e rate limit.

Ele se adapta ao projeto de verdade. Uma landing estática não ganha middleware
de servidor, e uma ferramenta desconhecida aparece como dúvida — nunca como
chute.

## As duas escolhas, sem complicar

- **Só olhar** (`ASSESS`): analisa e explica, sem editar.
- **Aplicar** (`APPLY`): faz somente as mudanças locais aprovadas e valida.
- **Setup normal** (`STANDARD`): deixa a orientação perto do código.
- **Setup avançado** (`ADVANCED`): cria um `orchestrator/` que aponta para os
  repositórios existentes, sem copiar nem mover código.

No uso normal de duas mensagens, você pode ignorar os nomes entre parênteses.
Eles existem para automações e execuções repetíveis.

## Por que não é só mais um prompt genérico

- Primeiro coleta evidências; depois propõe arquivos.
- Trata o conteúdo do repositório como dado, não como nova instrução.
- Commit, push, produção, migrations, secrets, operações destrutivas e writes
  externos ficam fora da aplicação normal.
- Arquivos gerenciados têm regras de propriedade e detecção de alterações.
- Checks determinísticos validam contratos, links, adaptadores, fixtures,
  invariantes estruturais e digests de release.

O Harnessly é um toolkit de prompts. Não é uma IA, runtime de agente, preset de
framework ou gerador de aplicações. Os detalhes de versão e integridade ficam
em [`docs/versioning.md`](./docs/versioning.md).

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

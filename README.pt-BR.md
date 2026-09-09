> [!NOTE]
> **O Harnessly está em preview público.** O repositório já está no ar; o
> primeiro release com tag ainda está sendo preparado. O início abaixo usa a
> `main` somente para análise sem alterações. Se você autorizar no mesmo chat,
> a IA reutiliza exatamente o workflow já carregado, sem baixar de novo.

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/github-banner-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="./assets/github-banner-light.png">
  <img src="./assets/github-banner-light.png" alt="Harnessly" width="100%">
</picture>

### Transforme um repositório existente em um lugar onde agentes de programação trabalham sem chutar.

O Harnessly mapeia o projeto, propõe o harness de engenharia certo e espera sua
autorização antes de alterar arquivos.

**Um só lugar. O projeto certo.**

[Comece em 30 segundos](#comece-com-o-harnessly) ·
[O que é o Harnessly?](#o-que-é-o-harnessly) ·
[Catálogo de workflows](./docs/prompts/README.md) ·
[English](./README.md)

</div>

---

## Comece com o Harnessly

Não tem CLI nem pacote para instalar. Abra sua IA **dentro do projeto que você
quer preparar**, copie esta mensagem e envie:

```text
Leia https://raw.githubusercontent.com/joaovitorkc/harnessly/main/prompts/setup-workspace/PROMPT.md
Analise este projeto e me mostre o setup interno completo: instruções, design, skills, sensores e o resto que se aplicar. Não altere nada ainda.
```

O Harnessly vai mapear o projeto e explicar o plano. Se fizer sentido, responda
no **mesmo chat**:

```text
Pode aplicar o plano que você acabou de me mostrar. Valide o resultado e diga o que não conseguiu verificar.
```

Só isso. Você não precisa trocar nenhum texto na URL, saber o que é SHA ou
colar o link de novo. O agente continua usando exatamente o workflow que já
analisou.

### Setup normal

Um repositório. Você abre a IA nessa pasta. Depois de aplicar, o setup fica
ali: `AGENTS.md`, `DESIGN.md`, `HARNESS.md`, inventário, skills, scripts de
verificação, gates e o resto que o projeto realmente precisa.

No dia a dia você continua trabalhando nessa mesma pasta. A IA já tem o mapa.

### Setup Orchestrator

Vários projetos. O Harnessly cria uma pasta `orchestrator/` que vira a mesa:
você abre a IA ali e só manda o problema. Ele identifica qual projeto
registrado é o alvo, lê o `AGENTS.md` e o `HARNESS.md` daquele projeto,
trabalha dentro do repositório certo e usa o sensor dele para validar.

É o mesmo jeito de operar um hub de vários produtos: um lugar para mandar o
problema, e o projeto escolhido já sabe como resolver. O Orchestrator guarda
roteamento, planos e referências. Não copia código e não é um serviço rodando
escondido.

Para escolher essa opção, troque apenas a segunda linha:

```text
Leia https://raw.githubusercontent.com/joaovitorkc/harnessly/main/prompts/setup-workspace/PROMPT.md
Quero o setup Orchestrator: uma central onde eu mando o problema, ele identifica o projeto e resolve com as instruções, o design, as skills e os sensores daquele projeto. Primeiro analise e não altere nada ainda.
```

Se sua IA não abre URLs, abra ou cole o
[`PROMPT.md`](./prompts/setup-workspace/PROMPT.md) local e mande o mesmo pedido
em linguagem normal.

> [!TIP]
> **Agentes de programação e LLMs:** comecem pelo
> [`AGENTS.md`](./AGENTS.md), que traz o mapa e as regras do repositório. Quem
> mantém o Harnessly encontra o caminho de validação no
> [`HARNESS.md`](./HARNESS.md).

## Conteúdo

- [O que é o Harnessly?](#o-que-é-o-harnessly)
- [O que ele coloca no projeto](#o-que-ele-coloca-no-projeto)
- [As duas escolhas](#as-duas-escolhas-sem-complicar)
- [Por que ele é mais seguro](#por-que-não-é-só-mais-um-prompt-genérico)
- [O que a v0.1 cobre](#o-que-a-v01-cobre)
- [Escalabilidade sem chute](#escalabilidade-sem-chute)
- [Compatibilidade](#compatibilidade-honesta)
- [Segurança](#segurança)
- [Desenvolvimento](#desenvolvendo-o-harnessly)
- [Licenças](#licenças)

## O que é o Harnessly?

O Harnessly é um toolkit Markdown-first de workflows de engenharia para
agentes de programação. Você entrega um workflow para a IA que já usa; o
Harnessly dá a ela uma forma repetível de analisar o repositório, explicar o
que está faltando e fazer somente as mudanças que você aprovar.

O prompt inicial compõe todo o catálogo aplicável na mesma conversa. Ele não
para em três arquivos de índice. O padrão é o setup interno completo: cada
etapa relevante roda, e no fim vem uma nota de prontidão com evidência. O que
for perigoso, irrelevante ou incerto continua visível como gated, `N/A` ou
`BLOCKED`.

O resultado é um **harness específico para o projeto** — o mesmo tipo de
camada de engenharia usada para manter vários produtos coerentes: instruções,
design, skills, sensores e checks adaptados *a este* repositório. Não é uma
cópia das regras de outro produto.

O Harnessly não força framework nem presume que todo repositório precisa do
mesmo setup. Ele segue evidências. Um monorepo pode receber orientação por
pacote; uma landing estática pode retornar `N/A` para rate limit de servidor;
uma ferramenta desconhecida continua marcada como dúvida.

Ele não é uma IA, runtime de agente, SaaS ou substituto para Cursor, Claude
Code, Copilot e similares. É a camada de engenharia que torna o trabalho feito
por esses agentes mais fácil de entender, verificar e repetir.

<details>
<summary><strong>Por que o Harnessly existe?</strong></summary>

Agentes conseguem ler muito código, mas normalmente entram em um repositório
sem o mapa mental do time: quais comandos são confiáveis, onde ficam os
limites, o que não pode ser tocado e o que significa “terminado”. O Harnessly
transforma esse contexto ausente em artefatos mantidos no próprio repositório
e workflows verificáveis.

</details>

## O que ele coloca no projeto

Um apply aprovado do prompt inicial, por padrão, instala o setup interno
aplicável — não um starter fino. Arquivos típicos:

- `AGENTS.md` — por onde a IA começa, limites e o comando de verificação;
- `DESIGN.md` e `docs/design/` — como o sistema funciona de verdade;
- `HARNESS.md`, `docs/harness/` e `scripts/verify-*` — jornadas locais e o
  sensor canônico;
- `.agents/skills/` — pelo menos uma skill de verificação, mais skills para
  fluxos que o repo já repete;
- `docs/inventory/`, `docs/tasks/`, `docs/decisions/`, `docs/learnings.md`;
- adaptadores finos de Cursor, Claude Code e Copilot, quando esses hosts
  existem;
- CI só de verificação quando já houver sensor local e pins seguros;
- rate limit HTTP só se existir um endpoint de servidor próprio.

Ele cria o que está faltando e preserva o que você já fez. Uma landing
estática não ganha middleware de servidor. Ferramenta desconhecida vira
dúvida, não chute. Skills bem específicas de produto (uma tela única, um
ritual de deploy) só entram se o repositório já mostrar esse trabalho; o
prompt não inventa isso.

## As duas escolhas, sem complicar

- **Só olhar** (`ASSESS`): analisa e explica, sem editar.
- **Aplicar** (`APPLY`): faz somente as mudanças locais aprovadas e valida.
- **Setup normal** (`STANDARD`): deixa a orientação perto do código.
- **Setup Orchestrator** (`ADVANCED`): cria uma central que identifica o
  projeto certo para cada problema e carrega o harness dele, sem copiar nem
  mover código.

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

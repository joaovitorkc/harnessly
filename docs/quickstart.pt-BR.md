# Início rápido

> **Preview público:** o repositório já está no ar; o primeiro release com tag
> ainda está sendo preparado. A URL abaixo usa a `main` para análise sem
> alterações. Aplique no mesmo chat para reutilizar o workflow já carregado.

O Harnessly é um conjunto de workflows em Markdown. Você não instala nada no
projeto.

## O caminho rápido

### 1. Abra sua IA dentro do projeto

É o projeto que você quer preparar — não a pasta do Harnessly.

### 2. Envie esta mensagem

```text
Leia https://raw.githubusercontent.com/joaovitorkc/harnessly/main/prompts/setup-workspace/PROMPT.md
Analise este projeto e me mostre o setup interno completo: instruções, design, skills, sensores e o resto que se aplicar. Não altere nada ainda.
```

Essa primeira passada só olha. A IA mapeia repositórios, pacotes, comandos,
documentação e verificações ausentes, depois mostra os caminhos que pretende
alterar.

### 3. Confira o plano

Pergunte, tire algo ou peça ajustes do seu jeito. Nenhum arquivo foi editado.

### 4. Autorize no mesmo chat

```text
Pode aplicar o plano que você acabou de me mostrar. Valide o resultado e diga o que não conseguiu verificar.
```

Continue no mesmo chat para a IA reutilizar exatamente o workflow que já leu.
Não cole a URL outra vez para aplicar.

O padrão é fazer todo o setup aplicável. O mesmo prompt passa por inventário,
documentação, instruções, skills, harness local, sensores, gates de qualidade,
configuração, CI/segurança e prontidão. Etapa que não serve retorna `N/A`;
etapa sem decisão segura retorna `BLOCKED`, nunca é escondida.

## Quer o Orchestrator?

**Normal:** a IA está aberta em um repo; o setup fica nessa pasta.

**Orchestrator:** vários projetos. O Harnessly cria `orchestrator/`. Você
abre a IA ali e manda o problema. Ele escolhe o projeto registrado, carrega
as instruções e o harness dele, trabalha lá e roda o sensor daquele projeto.

Use esta primeira mensagem para criar:

```text
Leia https://raw.githubusercontent.com/joaovitorkc/harnessly/main/prompts/setup-workspace/PROMPT.md
Quero o setup Orchestrator: uma central onde eu mando o problema, ele identifica o projeto e resolve com as instruções, o design, as skills e os sensores daquele projeto. Primeiro analise e não altere nada ainda.
```

O setup avançado aponta para os repositórios existentes. Não copia nem move
código:

```text
workspace/
├── orchestrator/       # orientação comum e registro dos projetos
├── web/                # continua no mesmo lugar
└── api/                # continua no mesmo lugar
```

## Quer verificar só uma coisa?

Escolha um workflow no [catálogo](./prompts/README.md). Por exemplo:

```text
Leia https://raw.githubusercontent.com/joaovitorkc/harnessly/main/prompts/harden-http-rate-limits/PROMPT.md
Veja se este projeto precisa de rate limit. Mostre o plano e não altere nada ainda.
```

Se o projeto for um site estático sem endpoint de servidor, o retorno correto
é `N/A`: não existe um lugar útil para instalar rate limit server-side.

## Traduzindo os termos técnicos

- **Analisar (`ASSESS`)** é “olhar e explicar, sem editar”.
- **Aplicar (`APPLY`)** é “fazer as mudanças locais aprovadas e validar”.
- **Normal (`STANDARD`)** mantém a orientação perto do código.
- **Avançado (`ADVANCED`)** adiciona um `orchestrator/` para vários repos.
- **Tag** é um nome amigável de versão, como `v0.1.0-beta.2`.
- **SHA do commit** é a impressão digital exata de uma versão do repositório.

No caminho normal você não precisa digitar tag nem SHA: a URL já está pronta e
a aplicação acontece no mesmo chat. O SHA completo fica para automações e
aplicação em outro chat, explicadas em [versionamento](./versioning.md).

## O que um retorno bom precisa dizer

- o que a IA encontrou e onde;
- o que pretende criar ou alterar;
- o que não se aplica (`N/A`) ou continua bloqueado;
- quais verificações passaram, falharam ou não rodaram;
- o que ainda depende de conferência humana.

## Segurança sem burocracia

- Abra a IA na raiz do projeto ou workspace certo.
- Não disponibilize credenciais de produção.
- Leia o plano antes de autorizar.
- Revise o diff final antes de commitar.
- Se abrir outro chat só para aplicar, siga as instruções de SHA completo em
  [versionamento](./versioning.md).

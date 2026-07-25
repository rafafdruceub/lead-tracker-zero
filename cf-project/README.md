# Registro de Leads — Sprint Zero (Cloudflare Pages)

Mesmo app que você já usava no Claude, adaptado pra rodar como site próprio na
Cloudflare. O design e a lógica (status, comissão, PDF) continuam exatamente
iguais — só a forma de salvar os dados mudou: em vez do armazenamento interno
do Claude, agora usa **Cloudflare KV**, protegido por **Cloudflare Access**
(login só com o seu e-mail).

## Estrutura do projeto

```
├── public/
│   └── index.html        ← o app (HTML/CSS/JS, sem alterações de design)
├── functions/
│   └── api/
│       └── leads.js      ← função serverless que lê/grava no KV
├── wrangler.toml          ← config pra rodar localmente com Wrangler
└── README.md
```

## Passo 1 — Criar a KV namespace

No painel da Cloudflare: **Workers & Pages → KV → Create a namespace**.
Dê o nome que quiser (ex: `leads-sprint-zero`) e crie.

Ou via linha de comando (se tiver o [Wrangler](https://developers.cloudflare.com/workers/wrangler/) instalado):

```bash
npx wrangler kv namespace create LEADS_KV
```

Copie o `id` que aparecer e cole no `wrangler.toml`, no lugar de
`COLOQUE_AQUI_O_ID_DA_SUA_KV_NAMESPACE` (esse arquivo só importa se você for
rodar localmente com `wrangler pages dev` — em produção o binding é feito
pelo painel, no passo 3).

## Passo 2 — Publicar no Cloudflare Pages

Duas formas, escolha a que preferir:

**A) Direto do painel (mais simples, sem git)**
`Workers & Pages → Create → Pages → Upload assets` e suba a pasta `public/`.
Depois, em **Settings → Functions**, confirme que a pasta `functions/` foi
detectada (o Pages detecta automaticamente se você subir o projeto inteiro
via Git; pelo upload direto de assets, as Functions podem não ser
publicadas — nesse caso prefira a opção B ou o Wrangler CLI abaixo).

**B) Via Git (recomendado, ativa as Functions automaticamente)**
Suba esta pasta inteira pra um repositório (GitHub/GitLab) e conecte em
`Workers & Pages → Create → Pages → Connect to Git`. Configure:
- Build command: (deixe em branco, não há build)
- Build output directory: `public`

**C) Via linha de comando**
```bash
npx wrangler pages deploy public
```

## Passo 3 — Vincular a KV namespace ao projeto

No painel: **seu projeto Pages → Settings → Functions → KV namespace bindings
→ Add binding**.
- Variable name: `LEADS_KV` (exatamente assim, é o nome que o código espera)
- KV namespace: a que você criou no passo 1

Depois de salvar, faça um novo deploy (ou um redeploy) pra a ligação valer.

## Passo 4 — Restringir o acesso ao seu e-mail (Cloudflare Access)

1. Vá em **Zero Trust → Access → Applications → Add an application**
2. Tipo: **Self-hosted**
3. Domain: o domínio do seu projeto Pages (ex: `registro-leads.pages.dev`
   ou o domínio customizado que você configurar)
4. Em **Policies**, crie uma política:
   - Action: **Allow**
   - Include: **Emails** → coloque o seu e-mail
5. Salve.

A partir daí, qualquer pessoa que tentar abrir o site recebe uma tela de
login da Cloudflare pedindo verificação por e-mail — só quem estiver na
lista consegue entrar. É esse mesmo login que a função `leads.js` usa como
"dono" dos dados guardados no KV.

## Passo 5 — Testar

Acesse a URL do projeto, faça login com seu e-mail, cadastre um lead,
recarregue a página — ele precisa continuar lá. Abra pelo celular e
confirme que aparece o mesmo lead: é a sincronização funcionando.

## Notas

- **Export PDF** continua 100% no navegador (usa a biblioteca `jsPDF` via
  CDN), não depende de nada da Cloudflare — funciona igual ao de antes.
- Se um dia você quiser dar acesso ao Eric, dá pra adicionar o e-mail dele
  na política de Access do passo 4 — mas como os dados são gravados por
  e-mail autenticado, ele veria uma lista própria (vazia), não a sua. Se
  quiser mesmo compartilhar os mesmos dados com ele, me avise que ajusto a
  função `leads.js` pra usar uma chave fixa em vez do e-mail.
- Qualquer erro tipo "KV namespace LEADS_KV não está vinculada" na tela
  significa que o passo 3 não foi feito (ou precisa de um redeploy depois
  dele).

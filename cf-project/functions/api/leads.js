// functions/api/leads.js
//
// Substitui o window.storage do Claude por Cloudflare KV.
// A chave de cada registro é o e-mail autenticado pelo Cloudflare Access
// (cabeçalho Cf-Access-Authenticated-User-Email), então cada pessoa que
// logar só enxerga e só grava os próprios dados.
//
// Requer:
//   - Uma KV namespace criada e vinculada a este projeto Pages com o
//     nome de binding "LEADS_KV" (veja o README.md).
//   - Cloudflare Access configurado na frente deste domínio (senão o
//     cabeçalho de e-mail não existe e tudo cai em "anon").

function getUserEmail(request) {
  return request.headers.get('Cf-Access-Authenticated-User-Email') || 'anon';
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env.LEADS_KV) {
    return new Response(
      JSON.stringify({ error: 'KV namespace LEADS_KV não está vinculada a este projeto.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const email = getUserEmail(request);
  const value = await env.LEADS_KV.get(`leads:${email}`);

  return new Response(JSON.stringify({ value }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPut(context) {
  const { request, env } = context;

  if (!env.LEADS_KV) {
    return new Response(
      JSON.stringify({ error: 'KV namespace LEADS_KV não está vinculada a este projeto.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const email = getUserEmail(request);
  const body = await request.text();

  // validação simples: precisa ser um JSON válido (array de leads)
  try {
    JSON.parse(body);
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Corpo inválido, esperado JSON.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  await env.LEADS_KV.put(`leads:${email}`, body);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Aceita também POST como sinônimo de PUT, por robustez.
export async function onRequestPost(context) {
  return onRequestPut(context);
}

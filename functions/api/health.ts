export const onRequest: PagesFunction<{ DB: D1Database }> = async () => {
  const result = await envCheck();
  return Response.json({ status: result });
};

function envCheck() {
  return { ok: true, service: "community-wellbeing", time: new Date().toISOString() };
}

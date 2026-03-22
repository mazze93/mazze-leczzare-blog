export const onRequestPost: PagesFunction = async () => {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie":
        "auth_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
    },
  });
};

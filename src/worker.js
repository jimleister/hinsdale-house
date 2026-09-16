const RECIPIENT = "122.hinsdale@gmail.com";
const SENDER = "inquiries@hinsdalehousenc.com";

function clean(value, max = 500) {
  return String(value ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, max);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/inquiry") return env.ASSETS.fetch(request);
    if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

    try {
      const data = await request.json();
      if (clean(data.company_website)) return json({ ok: true });

      const name = clean(data.name, 120);
      const email = clean(data.email, 180);
      const phone = clean(data.phone, 80);
      const guests = clean(data.guests, 10);
      const arrival = clean(data.arrival, 20);
      const departure = clean(data.departure, 20);
      const suite = clean(data.suite, 80);
      const stayType = clean(data.stay_type, 120);
      const message = clean(data.message, 2000);

      if (!name || !email || !arrival || !departure) return json({ ok: false, error: "Please complete the required fields." }, 400);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: "Please enter a valid email address." }, 400);

      const text = [
        "New stay inquiry from hinsdalehousenc.com", "",
        `Name: ${name}`, `Email: ${email}`, `Phone: ${phone || "Not provided"}`,
        `Guests: ${guests || "Not provided"}`, `Arrival: ${arrival}`, `Departure: ${departure}`,
        `Preferred suite: ${suite || "No preference"}`, `Reason for stay: ${stayType || "Not provided"}`,
        "", "Message:", message || "No additional message."
      ].join("\n");

      await env.INQUIRY_EMAIL.send({
        from: SENDER,
        to: RECIPIENT,
        replyTo: email,
        subject: `New Hinsdale House inquiry - ${name}`,
        text
      });

      return json({ ok: true });
    } catch (error) {
      console.error("Inquiry error", error?.code, error?.message, error);
      return json({ ok: false, error: "We couldn't send your inquiry. Please try again or use Furnished Finder." }, 500);
    }
  }
};

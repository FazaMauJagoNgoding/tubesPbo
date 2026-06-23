export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.EMAIL_FROM || process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.EMAIL_FROM_NAME || 'CampusLib';

  if (!apiKey || !senderEmail) {
    return response.status(200).json({
      skipped: true,
      message: 'Email provider is not configured. Set BREVO_API_KEY and EMAIL_FROM.',
    });
  }

  const { book, users } = request.body || {};
  if (!book || !Array.isArray(users)) {
    return response.status(400).json({ error: 'Invalid payload.' });
  }

  const recipients = users.filter((user) => user?.email);
  if (recipients.length === 0) {
    return response.status(200).json({ sent: 0 });
  }

  const results = await Promise.allSettled(
    recipients.map((user) => {
      const body = [
        `Halo ${user.name || 'Member'},`,
        '',
        'Ada buku baru yang baru saja ditambahkan di CampusLib.',
        '',
        `Judul Buku: ${book.title || '-'}`,
        `Penulis: ${book.author || '-'}`,
        `Kategori: ${book.category || '-'}`,
        `Stok: ${book.stock ?? '-'}`,
        '',
        'Silakan login ke CampusLib untuk melihat dan meminjam buku tersebut.',
        '',
        'Terima kasih,',
        'CampusLib',
      ].join('\n');

      return fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: user.email, name: user.name || user.email }],
          subject: 'Buku Baru Tersedia di CampusLib',
          textContent: body,
        }),
      }).then(async (emailResponse) => {
        if (!emailResponse.ok) {
          const text = await emailResponse.text();
          throw new Error(text || 'Email provider request failed.');
        }
      });
    })
  );

  return response.status(200).json({
    sent: results.filter((result) => result.status === 'fulfilled').length,
    failed: results.filter((result) => result.status === 'rejected').length,
  });
}

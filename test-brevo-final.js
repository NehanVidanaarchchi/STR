// test-new-key.js
const apiKey = process.env.BREVO_API_KEY;

console.log('Testing NEW Brevo API Key...');
console.log('Key exists:', !!apiKey);
console.log('Key length:', apiKey?.length);
console.log('');

async function test() {
  if (!apiKey) {
    console.log('❌ BREVO_API_KEY is missing');
    return;
  }

  const response = await fetch('https://api.brevo.com/v3/account', {
    method: 'GET',
    headers: {
      'api-key': apiKey,
      'accept': 'application/json',
    },
  });

  console.log('Status:', response.status);

  if (response.ok) {
    const data = await response.json();
    console.log('✅ SUCCESS! Key is valid!');
    console.log('Account:', data.email);
  } else {
    const error = await response.text();
    console.log('❌ Key is invalid:', error);
  }
}

test().catch(console.error);
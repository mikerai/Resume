import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
const testAddress = 'Cuauhtemoc 22, Ciudad de Mexico';

async function testGeocode() {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(testAddress)}&key=${apiKey}`;

    console.log('Testing Geocoding API...');
    console.log('Address:', testAddress);
    console.log('API Key:', apiKey.substring(0, 20) + '...');
    console.log('\nRequest URL:', url);
    console.log('\nMaking request...\n');

    try {
        const response = await fetch(url);
        const data = await response.json();

        console.log('Status Code:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (data.status === 'OK') {
            console.log('\n[SUCCESS] Geocoding works!');
            console.log('Coordinates:', data.results[0].geometry.location);
        } else {
            console.log('\n[ERROR] Status:', data.status);
            if (data.error_message) {
                console.log('Error message:', data.error_message);
            }
        }
    } catch (error) {
        console.error('\n[FATAL ERROR]', error.message);
    }
}

testGeocode();

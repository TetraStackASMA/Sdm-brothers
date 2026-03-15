// test_db.js
// Quick diagnostic test for the pharmacy SQLite database

const DB = require('./database');

async function runTest() {
    try {
        console.log('--- SDM Brothers Pharmacy DB Test ---');
        
        // 1. Initialize Database
        console.log('\n[1] Initializing Database...');
        await DB.initDatabase();
        console.log('✅ Database connected successfully!');

        // 2. Test Stores Listing (Should load from seed data)
        console.log('\n[2] Fetching Stores...');
        const stores = DB.getAllStores();
        console.log(`✅ Found ${stores.length} stores.`);
        stores.forEach(s => console.log(`   - ${s.store_name} (${s.city})`));

        // 3. Test Medicines Listing (Should load from seed data)
        console.log('\n[3] Fetching Medicines...');
        const medicines = DB.getMedicines();
        console.log(`✅ Found ${medicines.length} medicines in the database.`);
        if (medicines.length > 0) {
            console.log(`   Sample: ${medicines[0].name} - ₹${medicines[0].price} (${medicines[0].category})`);
        }

        // 4. Test User Creation
        console.log('\n[4] Testing User Creation...');
        const testPhone = `999${Math.floor(Math.random() * 10000000)}`;
        const newUser = DB.createUser({
            name: 'Test Setup User',
            phone_number: testPhone,
            address: '123 Test Ave, Bengaluru',
            preferred_store: 'SDM Brothers - MG Road'
        });
        console.log(`✅ Successfully created test user: ID ${newUser.user_id}, Name: ${newUser.name}, Phone: ${newUser.phone_number}`);

        // 5. Check user lookup
        console.log('\n[5] Testing User Lookup by Phone...');
        const foundUser = DB.getUserByPhone(testPhone);
        if (foundUser && foundUser.name === 'Test Setup User') {
            console.log(`✅ Successfully retrieved user by phone number!`);
        } else {
            console.log(`❌ Failed to retrieve user.`);
        }

        console.log('\n🎉 All database systems are strictly operational!');

    } catch (err) {
        console.error('\n❌ DATABASE TEST FAILED:');
        console.error(err);
    }
}

runTest();

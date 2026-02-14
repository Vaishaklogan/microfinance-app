
const BASE_URL = 'http://localhost:8080/api';

async function runTest() {
    try {
        console.log('--- Starting Daily Collection Filter Test ---');

        // Use a unique group/member ID to avoid conflicts
        const timestamp = Date.now();
        const GROUP_NO = 'G_' + timestamp;
        const MEMBER_A_ID = 'M_A_' + timestamp;
        const MEMBER_B_ID = 'M_B_' + timestamp;

        // 1. Create a Group
        const groupRes = await fetch(BASE_URL + '/groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                groupNo: GROUP_NO,
                groupName: 'Filter Test Group ' + timestamp,
                meetingDay: 'Monday',
                formationDate: '2023-01-01'
            })
        });
        const group = await groupRes.json();
        console.log('Created Group:', group.groupNo);

        // 2. Create Members
        // Member A: Will be fully paid
        const memberA = {
            memberId: MEMBER_A_ID,
            memberName: 'Fully Paid Member',
            groupNo: GROUP_NO,
            loanAmount: 1000,
            totalInterest: 100,
            weeks: 10,
            startDate: '2023-01-01',
            status: 'Active'
        };
        await fetch(BASE_URL + '/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(memberA)
        });

        // Member B: Will be partially paid
        const memberB = {
            memberId: MEMBER_B_ID,
            memberName: 'Partial Paid Member',
            groupNo: GROUP_NO,
            loanAmount: 1000,
            totalInterest: 100,
            weeks: 10,
            startDate: '2023-01-01',
            status: 'Active'
        };
        await fetch(BASE_URL + '/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(memberB)
        });

        console.log('Created Members');

        // 3. Add Full Payment for Member A
        // Total Payable = 1100.
        await fetch(BASE_URL + '/collections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                collectionDate: '2023-01-08',
                memberId: MEMBER_A_ID,
                groupNo: GROUP_NO,
                weekNo: 1,
                amountPaid: 1100,
                status: 'Paid',
                collectedBy: 'Test'
            })
        });
        console.log('Added Full Payment for Member A');

        // 4. Add Partial Payment for Member B
        await fetch(BASE_URL + '/collections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                collectionDate: '2023-01-08',
                memberId: MEMBER_B_ID,
                groupNo: GROUP_NO,
                weekNo: 1,
                amountPaid: 100,
                status: 'Paid',
                collectedBy: 'Test'
            })
        });
        console.log('Added Partial Payment for Member B');

        // 5. Check Daily Collection (Due List)
        // We check for a date after the payments
        const dueRes = await fetch(BASE_URL + '/collections/due?date=2023-01-15');
        const dueList = await dueRes.json();

        // 6. Assertions
        const foundA = dueList.find(m => m.memberId === MEMBER_A_ID);
        const foundB = dueList.find(m => m.memberId === MEMBER_B_ID);

        if (foundA) {
            console.error('FAIL: Member A (Fully Paid) FOUND in Daily Collection list!', foundA);
        } else {
            console.log('PASS: Member A (Fully Paid) NOT found in Daily Collection list.');
        }

        if (foundB) {
            console.log('PASS: Member B (Partially Paid) FOUND in Daily Collection list.');
        } else {
            console.error('FAIL: Member B (Partially Paid) NOT found in Daily Collection list!');
        }

    } catch (error) {
        console.error('Test Error:', error);
    }
}

runTest();

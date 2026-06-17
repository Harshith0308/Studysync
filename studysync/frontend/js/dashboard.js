document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();

    const user = JSON.parse(localStorage.getItem('user'));
    document.getElementById('user-name').textContent = `Welcome, ${user.name}`;
    
    document.getElementById('logout-btn').addEventListener('click', logout);

    if (user.role === 'admin') {
        document.getElementById('admin-link').classList.remove('hidden');
    }

    // Modal logic
    const createModal = document.getElementById('create-modal');
    const joinModal = document.getElementById('join-modal');

    document.getElementById('open-create-modal').addEventListener('click', () => createModal.classList.remove('hidden'));
    document.getElementById('close-create-modal').addEventListener('click', () => createModal.classList.add('hidden'));
    
    document.getElementById('open-join-modal').addEventListener('click', () => joinModal.classList.remove('hidden'));
    document.getElementById('close-join-modal').addEventListener('click', () => joinModal.classList.add('hidden'));

    // Load Groups
    loadGroups();

    // Create Group Form
    document.getElementById('create-group-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('group-title').value;
        const subject = document.getElementById('group-subject').value;
        const description = document.getElementById('group-desc').value;

        try {
            await apiFetch('/groups', {
                method: 'POST',
                body: JSON.stringify({ title, subject, description })
            });
            createModal.classList.add('hidden');
            loadGroups();
        } catch (error) {
            alert(error.message);
        }
    });

    // Join Group Form
    document.getElementById('join-group-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const joinCode = document.getElementById('join-code').value;

        try {
            const result = await apiFetch('/groups/join', {
                method: 'POST',
                body: JSON.stringify({ joinCode })
            });
            joinModal.classList.add('hidden');
            if (result.status === 'pending' && result.groupId) {
                window.location.href = `group.html?id=${result.groupId}`;
                return;
            }
            loadGroups();
        } catch (error) {
            alert(error.message);
        }
    });
});

async function loadGroups() {
    const container = document.getElementById('groups-container');
    container.innerHTML = '<p class="text-center col-span-full">Loading...</p>';

    try {
        const groups = await apiFetch('/groups');
        
        if (groups.length === 0) {
            container.innerHTML = '<p class="text-center col-span-full text-gray-500">You haven\'t joined any groups yet.</p>';
            return;
        }

        container.innerHTML = groups.map(group => `
            <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer" onclick="window.location.href='group.html?id=${group._id}'">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-bold text-gray-800">${group.title}</h3>
                    <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">${group.subject}</span>
                </div>
                <p class="text-gray-600 mb-4 line-clamp-2">${group.description || 'No description'}</p>
                <p class="text-sm text-gray-500 mb-2">Created by: <span class="font-medium text-gray-700">${group.createdBy?.name || 'Unknown'}</span></p>
                <div class="flex justify-between items-center text-sm text-gray-500">
                    <span>Code: <span class="font-mono font-bold text-gray-700">${group.joinCode}</span></span>
                    <span>Members: ${group.members.length || 0}</span>
                </div>
            </div>
        `).join('');

    } catch (error) {
        container.innerHTML = `<p class="text-red-500 text-center col-span-full">Error loading groups: ${error.message}</p>`;
    }
}

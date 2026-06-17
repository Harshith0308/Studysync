document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();

    const user = JSON.parse(localStorage.getItem('user'));
    if (user.role !== 'admin') {
        window.location.href = 'dashboard.html';
        return;
    }

    document.getElementById('logout-btn').addEventListener('click', logout);

    await loadStats();
    await loadUsers();
    await loadGroups();
});

async function loadStats() {
    try {
        const stats = await apiFetch('/admin/stats');
        document.getElementById('user-count').textContent = stats.userCount;
        document.getElementById('group-count').textContent = stats.groupCount;
    } catch (error) {
        console.error(error);
    }
}

async function loadUsers() {
    try {
        const users = await apiFetch('/admin/users');
        const tbody = document.getElementById('users-table');
        
        tbody.innerHTML = users.map(u => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${u.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${u.email}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}">
                        ${u.role}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    ${u.role !== 'admin' ? `<button onclick="deleteUser('${u._id}')" class="text-red-600 hover:text-red-900">Delete</button>` : ''}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error(error);
    }
}

async function loadGroups() {
    try {
        const groups = await apiFetch('/admin/groups');
        const tbody = document.getElementById('groups-table');
        
        tbody.innerHTML = groups.map(g => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${g.title}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${g.subject}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${g.createdBy?.name || 'Unknown'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="deleteGroup('${g._id}')" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error(error);
    }
}

window.deleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
        await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
        loadUsers();
        loadStats();
    } catch (error) {
        alert(error.message);
    }
};

window.deleteGroup = async (id) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    try {
        await apiFetch(`/groups/${id}`, { method: 'DELETE' });
        loadGroups();
        loadStats();
    } catch (error) {
        alert(error.message);
    }
};

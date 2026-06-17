document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();

    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('id');

    if (!groupId) {
        window.location.href = 'dashboard.html';
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    const myId = user._id || user.id;
    let socket;

    // Elements
    const waitingRoom = document.getElementById('waiting-room');
    const chatSection = document.getElementById('chat-section');
    const notesSection = document.getElementById('notes-section');
    const aiSection = document.getElementById('ai-section');
    const tabChat = document.getElementById('tab-chat');
    const tabNotes = document.getElementById('tab-notes');
    const tabAi = document.getElementById('tab-ai');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const notesList = document.getElementById('notes-list');
    const uploadForm = document.getElementById('upload-form');
    const aiMessages = document.getElementById('ai-messages');
    const aiForm = document.getElementById('ai-form');
    const aiInput = document.getElementById('ai-input');
    const tasksList = document.getElementById('tasks-list');
    const taskModal = document.getElementById('task-modal');
    const taskForm = document.getElementById('task-form');
    const joinRequestsSection = document.getElementById('join-requests-section');
    const joinRequestsList = document.getElementById('join-requests-list');

    // Init
    const statusInfo = await loadGroupStatus();
    if (!statusInfo) {
        return;
    }

    if (statusInfo.status === 'pending') {
        waitingRoom.classList.remove('hidden');
        setInterval(async () => {
            const nextStatus = await loadGroupStatus();
            if (nextStatus && (nextStatus.status === 'member' || nextStatus.status === 'creator')) {
                window.location.reload();
            }
        }, 5000);
        return;
    }

    waitingRoom.classList.add('hidden');
    renderGroupFromStatus(statusInfo);

    await loadMessages();
    await loadNotes();
    await loadTasks();
    initSocket();

    // Tabs
    tabChat.addEventListener('click', () => {
        chatSection.classList.remove('hidden');
        notesSection.classList.add('hidden');
        aiSection.classList.add('hidden');
        tabChat.classList.add('bg-blue-100', 'text-blue-700');
        tabNotes.classList.remove('bg-blue-100', 'text-blue-700');
        tabAi.classList.remove('bg-blue-100', 'text-blue-700');
    });

    tabNotes.addEventListener('click', () => {
        chatSection.classList.add('hidden');
        notesSection.classList.remove('hidden');
        aiSection.classList.add('hidden');
        tabNotes.classList.add('bg-blue-100', 'text-blue-700');
        tabChat.classList.remove('bg-blue-100', 'text-blue-700');
        tabAi.classList.remove('bg-blue-100', 'text-blue-700');
    });

    tabAi.addEventListener('click', () => {
        chatSection.classList.add('hidden');
        notesSection.classList.add('hidden');
        aiSection.classList.remove('hidden');
        tabAi.classList.add('bg-blue-100', 'text-blue-700');
        tabChat.classList.remove('bg-blue-100', 'text-blue-700');
        tabNotes.classList.remove('bg-blue-100', 'text-blue-700');
    });

    // Chat
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (message) {
            socket.emit('sendMessage', {
                groupId,
                user,
                message,
                time: new Date()
            });
            chatInput.value = '';
        }
    });

    // File Upload
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titleInput = document.getElementById('note-title');
        const descInput = document.getElementById('note-desc');
        const fileInput = document.getElementById('note-file');
        const file = fileInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', titleInput.value.trim());
        formData.append('description', descInput.value.trim());
        formData.append('groupId', groupId);

        try {
            await apiFetch('/notes', {
                method: 'POST',
                body: formData
                // Content-Type header is automatically handled by browser for FormData
                // apiFetch handles this logic
            });
            fileInput.value = '';
            titleInput.value = '';
            descInput.value = '';
            loadNotes();
        } catch (error) {
            alert(error.message);
        }
    });

    aiForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const question = aiInput.value.trim();
        if (!question) return;

        appendAiMessage('user', question);
        aiInput.value = '';

        const loadingId = appendAiMessage('assistant', 'Thinking...');

        try {
            const data = await apiFetch('/ai/ask', {
                method: 'POST',
                body: JSON.stringify({ groupId, question })
            });
            replaceAiMessage(loadingId, data.answer);
        } catch (error) {
            replaceAiMessage(loadingId, error.message || 'AI request failed');
        }
    });

    // Task Modal
    document.getElementById('add-task-btn').addEventListener('click', () => {
        taskModal.classList.remove('hidden');
    });

    document.getElementById('close-task-modal').addEventListener('click', () => {
        taskModal.classList.add('hidden');
    });

    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('task-title').value;
        const deadline = document.getElementById('task-date').value;

        try {
            await apiFetch('/tasks', {
                method: 'POST',
                body: JSON.stringify({ title, deadline, groupId })
            });
            taskModal.classList.add('hidden');
            loadTasks();
            document.getElementById('task-title').value = '';
            document.getElementById('task-date').value = '';
        } catch (error) {
            alert(error.message);
        }
    });

    document.getElementById('leave-group-btn').addEventListener('click', async () => {
        if (confirm('Are you sure you want to leave this group?')) {
            try {
                await apiFetch(`/groups/${groupId}/leave`, { method: 'POST' });
                window.location.href = 'dashboard.html';
            } catch (error) {
                alert(error.message);
            }
        }
    });

    // Functions
    async function loadGroupStatus() {
        try {
            const info = await apiFetch(`/groups/${groupId}/status`);
            if (info.status === 'none') {
                alert('You do not have access to this group. Request to join from the dashboard using the invite code.');
                window.location.href = 'dashboard.html';
                return null;
            }
            return info;
        } catch (error) {
            alert('Failed to load group: ' + error.message);
            window.location.href = 'dashboard.html';
            return null;
        }
    }

    function renderGroupFromStatus(statusInfo) {
        const group = statusInfo.group;

        document.getElementById('group-title').textContent = group.title;
        document.getElementById('group-code').textContent = group.joinCode || '';
        document.getElementById('member-count').textContent = group.members.length;

        const membersList = document.getElementById('members-list');
        membersList.innerHTML = group.members.map(m => `
            <li class="flex items-center gap-2">
                <div class="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-700">
                    ${m.name.charAt(0).toUpperCase()}
                </div>
                <span>${m.name}</span>
            </li>
        `).join('');

        if (statusInfo.status === 'creator' && Array.isArray(statusInfo.joinRequests)) {
            joinRequestsSection.classList.remove('hidden');
            joinRequestsList.innerHTML = statusInfo.joinRequests.length
                ? statusInfo.joinRequests.map((r) => `
                    <div class="flex items-center justify-between gap-2 p-2 border rounded bg-white">
                        <div class="min-w-0">
                            <div class="text-gray-800 font-medium truncate">${r.user.name}</div>
                            <div class="text-xs text-gray-500 truncate">${r.user.email}</div>
                        </div>
                        <div class="flex gap-2 shrink-0">
                            <button class="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700" onclick="approveRequest('${r.user._id}')">Accept</button>
                            <button class="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700" onclick="rejectRequest('${r.user._id}')">Reject</button>
                        </div>
                    </div>
                `).join('')
                : `<div class="text-sm text-gray-500">No pending requests</div>`;
        } else {
            joinRequestsSection.classList.add('hidden');
        }
    }

    async function loadMessages() {
        try {
            const messages = await apiFetch(`/groups/${groupId}/messages`);
            chatMessages.innerHTML = '';
            messages.forEach(msg => appendMessage(msg));
            scrollToBottom();
        } catch (error) {
            console.error(error);
        }
    }

    function initSocket() {
        const backendOrigin = window.API_ORIGIN || window.location.origin;
        socket = io(backendOrigin);
        
        socket.emit('joinGroup', groupId);

        socket.on('receiveMessage', (data) => {
            appendMessage(data);
            scrollToBottom();
        });
    }

    function appendMessage(data) {
        const isMe = (data.sender && data.sender._id === myId) || data.sender === myId;
        const div = document.createElement('div');
        div.className = `flex flex-col ${isMe ? 'items-end' : 'items-start'}`;
        
        const time = new Date(data.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        div.innerHTML = `
            <div class="max-w-[80%] rounded-lg px-4 py-2 ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}">
                ${!isMe ? `<div class="text-xs font-bold mb-1 opacity-75">${data.sender.name || 'Unknown'}</div>` : ''}
                <p>${data.content}</p>
            </div>
            <span class="text-xs text-gray-400 mt-1">${time}</span>
        `;
        chatMessages.appendChild(div);
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function appendAiMessage(role, text) {
        const wrapper = document.createElement('div');
        wrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

        const bubble = document.createElement('div');
        bubble.className = `max-w-[85%] rounded-lg px-4 py-2 ${role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`;
        bubble.textContent = text;

        const id = `ai-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        bubble.dataset.msgId = id;

        wrapper.appendChild(bubble);
        aiMessages.appendChild(wrapper);
        aiMessages.scrollTop = aiMessages.scrollHeight;
        return id;
    }

    function replaceAiMessage(id, newText) {
        const bubble = aiMessages.querySelector(`[data-msg-id="${id}"]`);
        if (bubble) {
            bubble.textContent = newText;
        }
        aiMessages.scrollTop = aiMessages.scrollHeight;
    }

    async function loadNotes() {
        try {
            const notes = await apiFetch(`/notes/${groupId}`);
            notesList.innerHTML = notes.map(note => `
                <div class="bg-gray-50 border rounded p-3 flex flex-col justify-between hover:shadow-md transition">
                    <div class="flex items-start gap-3 mb-2">
                        <svg class="w-8 h-8 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H7a2 2 0 00-2 2v15a2 2 0 002 2z"></path></svg>
                        <div class="overflow-hidden">
                            <h4 class="font-bold text-gray-800 truncate" title="${note.title}">${note.title}</h4>
                            <div class="text-xs text-gray-500 truncate">${(note.originalName || '').split('.').pop().toUpperCase()}</div>
                            ${note.description ? `<p class="text-xs text-gray-600 mt-1 line-clamp-2">${note.description}</p>` : ''}
                            <p class="text-xs text-gray-500">By ${note.uploadedBy.name}</p>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 mt-2">
                        <a href="${(window.API_ORIGIN || window.location.origin)}/${note.filePath.replace(/\\/g, '/')}" target="_blank" class="text-blue-600 text-xs hover:underline">Download</a>
                        ${(user.role === 'admin' || note.uploadedBy._id === myId) ? 
                            `<button onclick="deleteNote('${note._id}')" class="text-red-500 text-xs hover:underline">Delete</button>` : ''}
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error(error);
        }
    }

    window.deleteNote = async (id) => {
        if (!confirm('Delete this note?')) return;
        try {
            await apiFetch(`/notes/${id}`, { method: 'DELETE' });
            loadNotes();
        } catch (error) {
            alert(error.message);
        }
    };

    async function loadTasks() {
        try {
            const tasks = await apiFetch(`/tasks/${groupId}`);
            tasksList.innerHTML = tasks.map(task => `
                <div class="flex items-start gap-2 p-2 hover:bg-gray-50 rounded group">
                    <input type="checkbox" ${task.status === 'completed' ? 'checked' : ''} 
                        onchange="toggleTask('${task._id}', this.checked)"
                        class="mt-1">
                    <div class="flex-1">
                        <p class="text-sm ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-700'}">${task.title}</p>
                        ${task.deadline ? `<span class="text-xs text-gray-400">${new Date(task.deadline).toLocaleDateString()}</span>` : ''}
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error(error);
        }
    }

    window.toggleTask = async (id, checked) => {
        try {
            await apiFetch(`/tasks/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: checked ? 'completed' : 'pending' })
            });
            loadTasks();
        } catch (error) {
            alert(error.message);
        }
    };

    window.approveRequest = async (userId) => {
        try {
            await apiFetch(`/groups/${groupId}/requests/${userId}/approve`, { method: 'POST' });
            const updated = await loadGroupStatus();
            if (updated && (updated.status === 'creator' || updated.status === 'member')) {
                renderGroupFromStatus(updated);
            }
        } catch (error) {
            alert(error.message);
        }
    };

    window.rejectRequest = async (userId) => {
        try {
            await apiFetch(`/groups/${groupId}/requests/${userId}/reject`, { method: 'POST' });
            const updated = await loadGroupStatus();
            if (updated && (updated.status === 'creator' || updated.status === 'member')) {
                renderGroupFromStatus(updated);
            }
        } catch (error) {
            alert(error.message);
        }
    };
});

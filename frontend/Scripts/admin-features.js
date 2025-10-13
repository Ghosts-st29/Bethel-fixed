// Modal functions - Make sure these are GLOBAL
window.showCreateEventModal = function() {
    console.log('showCreateEventModal called');
    document.getElementById('createEventModal').style.display = 'block';
}

window.showCreateAnnouncementModal = function() {
    console.log('showCreateAnnouncementModal called');
    document.getElementById('createAnnouncementModal').style.display = 'block';
}

window.closeModal = function(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

// Create Event Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const createEventForm = document.getElementById('create-event-form');
    if (createEventForm) {
        createEventForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Create event form submitted');
            
            const formData = new FormData(e.target);
            const eventData = Object.fromEntries(formData);
            const token = localStorage.getItem('token');
            
            try {
                const response = await fetch('/api/events', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(eventData)
                });

                const result = await response.json();

                if (result.success) {
                    alert('Event created successfully!');
                    closeModal('createEventModal');
                    e.target.reset();
                    window.location.reload();
                } else {
                    alert('Error creating event: ' + result.message);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    }

    // Create Announcement Form Handler
    const createAnnouncementForm = document.getElementById('create-announcement-form');
    if (createAnnouncementForm) {
        createAnnouncementForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Create announcement form submitted');
            
            const formData = new FormData(e.target);
            const announcementData = Object.fromEntries(formData);
            announcementData.isImportant = !!announcementData.isImportant;
            const token = localStorage.getItem('token');
            
            try {
                const response = await fetch('/api/announcements', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(announcementData)
                });

                const result = await response.json();

                if (result.success) {
                    alert('Announcement created successfully!');
                    closeModal('createAnnouncementModal');
                    e.target.reset();
                    window.location.reload();
                } else {
                    alert('Error creating announcement: ' + result.message);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    }
});
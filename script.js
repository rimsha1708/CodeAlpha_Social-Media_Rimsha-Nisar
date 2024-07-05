document.addEventListener('DOMContentLoaded', () => {
    const postBtn = document.getElementById('postBtn');
    const postsList = document.querySelector('.posts-list');
    const sendFriendRequestBtn = document.getElementById('sendFriendRequestBtn');
    const friendUsernameInput = document.getElementById('friendUsernameInput');
    const socket = new WebSocket('ws://your-websocket-server');

    // Handle WebSocket messages
    socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'newPost') {
            addPost(data.content, data.media);
        } else if (data.type === 'notification') {
            addNotification(data.content);
        } else if (data.type === 'friendRequest') {
            addFriendRequest(data.content);
        }
    });

    // Post button event listener
    postBtn.addEventListener('click', () => {
        const newPostText = document.querySelector('textarea').value;
        const mediaInput = document.querySelector('#mediaInput');
        const mediaFile = mediaInput.files[0];

        if (newPostText || mediaFile) {
            const postData = {
                type: 'newPost',
                content: newPostText,
                media: null
            };

            if (mediaFile) {
                const reader = new FileReader();
                reader.onload = () => {
                    postData.media = reader.result;
                    socket.send(JSON.stringify(postData));
                    addPost(newPostText, reader.result);
                };
                reader.readAsDataURL(mediaFile);
            } else {
                socket.send(JSON.stringify(postData));
                addPost(newPostText, null);
            }
            document.querySelector('textarea').value = '';
            mediaInput.value = '';
        }
    });

    function addPost(content, media) {
        const newPost = document.createElement('div');
        newPost.classList.add('post');
        newPost.innerHTML = `
            <p>${content}</p>
            ${media ? `<img src="${media}" alt="Post media" class="post-media">` : ''}
            <button class="likeBtn">Like</button>
            <span class="likeCount">0 likes</span>
            <div class="comments">
                <input type="text" class="commentInput" placeholder="Add a comment">
                <button class="commentBtn">Comment</button>
            </div>
            <div class="commentsList"></div>
        `;
        postsList.prepend(newPost);

        // Like button event listener
        newPost.querySelector('.likeBtn').addEventListener('click', () => {
            const likeCount = newPost.querySelector('.likeCount');
            let count = parseInt(likeCount.textContent.split(' ')[0]);
            count += 1;
            likeCount.textContent = `${count} likes`;
        });

        // Comment button event listener
        newPost.querySelector('.commentBtn').addEventListener('click', () => {
            const commentInput = newPost.querySelector('.commentInput');
            const commentsList = newPost.querySelector('.commentsList');
            if (commentInput.value) {
                const newComment = document.createElement('div');
                newComment.classList.add('comment');
                newComment.textContent = commentInput.value;
                commentsList.appendChild(newComment);
                commentInput.value = '';
            }
        });
    }

    function addNotification(content) {
        const notificationsList = document.querySelector('.notifications-list');
        const newNotification = document.createElement('div');
        newNotification.classList.add('notification');
        newNotification.textContent = content;
        notificationsList.prepend(newNotification);
    }

    function addFriendRequest(content) {
        const friendRequestsList = document.querySelector('.friend-requests');
        const newRequest = document.createElement('div');
        newRequest.classList.add('friend-request');
        newRequest.innerHTML = `
            <p>${content}</p>
            <button class="acceptBtn">Accept</button>
            <button class="declineBtn">Decline</button>
        `;
        friendRequestsList.prepend(newRequest);

        newRequest.querySelector('.acceptBtn').addEventListener('click', () => {
            socket.send(JSON.stringify({ type: 'acceptFriendRequest', content }));
            newRequest.remove();
            addNotification(`You accepted a friend request from ${content}`);
        });

        newRequest.querySelector('.declineBtn').addEventListener('click', () => {
            socket.send(JSON.stringify({ type: 'declineFriendRequest', content }));
            newRequest.remove();
            addNotification(`You declined a friend request from ${content}`);
        });
    }

    // Send Friend Request
    sendFriendRequestBtn.addEventListener('click', () => {
        const friendUsername = friendUsernameInput.value;
        if (friendUsername) {
            socket.send(JSON.stringify({ type: 'friendRequest', content: friendUsername }));
            addNotification(`Friend request sent to ${friendUsername}`);
            friendUsernameInput.value = '';
        }
    });

    // Privacy Settings
    const privacySettingsBtn = document.querySelector('#privacySettingsBtn');
    privacySettingsBtn.addEventListener('click', () => {
        alert('Privacy settings updated!');
        addNotification('Your privacy settings have been updated');
    });

    // Profile Picture Update
    const profilePicInput = document.querySelector('#profilePicInput');
    profilePicInput.addEventListener('change', () => {
        const file = profilePicInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                document.querySelector('.profile-info img').src = reader.result;
                socket.send(JSON.stringify({ type: 'updateProfilePic', content: reader.result }));
                addNotification('Your profile picture has been updated');
            };
            reader.readAsDataURL(file);
        }
    });

    // Change Password
    const changePasswordBtn = document.querySelector('#changePasswordBtn');
    changePasswordBtn.addEventListener('click', () => {
        const newPassword = prompt('Enter your new password:');
        if (newPassword) {
            socket.send(JSON.stringify({ type: 'changePassword', content: newPassword }));
            alert('Your password has been changed');
            addNotification('Your password has been changed');
        }
    });
});

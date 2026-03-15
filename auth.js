// auth.js
// Handles user authentication and profile management via localStorage

document.addEventListener('DOMContentLoaded', () => {
    
    // --- LOGIN / REGISTER PAGE LOGIC ---
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const authSuccessMsg = document.getElementById('auth-success-msg');

    if (tabLogin && tabRegister) {
        tabLogin.addEventListener('click', () => {
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            formLogin.style.display = 'block';
            formRegister.style.display = 'none';
        });

        tabRegister.addEventListener('click', () => {
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            formRegister.style.display = 'block';
            formLogin.style.display = 'none';
        });

        // Register Submit
        formRegister.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(formRegister);
            
            // Age Verification
            const dobString = formData.get('dob');
            if (dobString) {
                const dob = new Date(dobString);
                const today = new Date();
                let age = today.getFullYear() - dob.getFullYear();
                const m = today.getMonth() - dob.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                    age--;
                }
                
                if (age < 18) {
                    alert('You must be at least 18 years old to create an account and purchase medicines.');
                    return; // block registration
                }
            }

            const userProfile = {
                name: formData.get('name').trim(),
                phone: formData.get('phone').trim(),
                dob: dobString,
                address: formData.get('address').trim(),
                storeLocation: formData.get('storeLocation')
            };

            // Save to LocalStorage simulating DB Session
            localStorage.setItem('sdm_user_profile', JSON.stringify(userProfile));
            localStorage.setItem('sdm_auth_token', 'mock_token_123'); // Simulate logged in state

            showAuthSuccess('Account created successfully! Redirecting...');
        });

        // Login Submit
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const phone = document.getElementById('loginPhone').value.trim();
            
            // In a real app, this verifies against DB. Here we check if profile exists with this phone.
            const savedProfile = JSON.parse(localStorage.getItem('sdm_user_profile'));
            
            if (savedProfile && savedProfile.phone === phone) {
                localStorage.setItem('sdm_auth_token', 'mock_token_123');
                showAuthSuccess('Login successful! Redirecting...');
            } else {
                alert('No account found with this phone number. Please register first.');
            }
        });
    }

    function showAuthSuccess(msg) {
        if(authSuccessMsg) {
            authSuccessMsg.style.display = 'block';
            authSuccessMsg.querySelector('span').textContent = msg;
            setTimeout(() => {
                // Redirect back to referring page or index
                const redirectParams = new URLSearchParams(window.location.search);
                const redirectTo = redirectParams.get('redirect') || 'index.html';
                window.location.href = redirectTo;
            }, 1500);
        }
    }

    // --- PROFILE PAGE LOGIC (profile.html) ---
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        const savedProfile = JSON.parse(localStorage.getItem('sdm_user_profile'));
        const authToken = localStorage.getItem('sdm_auth_token');

        if (!authToken || !savedProfile) {
            // Not logged in
            window.location.href = 'login.html';
            return;
        }

        // Populate fields and set readonly by default
        const inputs = [
            document.getElementById('profileName'),
            document.getElementById('profilePhone'),
            document.getElementById('profileAddress'),
            document.getElementById('profileStore')
        ];
        
        const saveActions = document.getElementById('save-actions');
        const editBtn = document.getElementById('edit-profile-btn');
        const cancelBtn = document.getElementById('cancel-edit-btn');
        
        function setFormEditMode(isEditing) {
            inputs.forEach(input => {
                if (isEditing) {
                    input.removeAttribute('readonly');
                    input.removeAttribute('disabled'); // for select
                    input.classList.add('editing');
                } else {
                    input.setAttribute('readonly', 'true');
                    if (input.tagName === 'SELECT') input.setAttribute('disabled', 'true');
                    input.classList.remove('editing');
                }
            });
            
            saveActions.style.display = isEditing ? 'flex' : 'none';
            editBtn.style.display = isEditing ? 'none' : 'block';
        }
        
        function loadProfileData() {
            document.getElementById('profileName').value = savedProfile.name;
            document.getElementById('profilePhone').value = savedProfile.phone;
            document.getElementById('profileAddress').value = savedProfile.address;
            document.getElementById('profileStore').value = savedProfile.storeLocation;
        }

        loadProfileData();
        setFormEditMode(false); // start in read-only mode

        editBtn.addEventListener('click', () => setFormEditMode(true));
        
        cancelBtn.addEventListener('click', () => {
            loadProfileData(); // revert
            setFormEditMode(false);
        });

        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const updatedProfile = {
                name: document.getElementById('profileName').value.trim(),
                phone: document.getElementById('profilePhone').value.trim(),
                address: document.getElementById('profileAddress').value.trim(),
                storeLocation: document.getElementById('profileStore').value
            };

            // Update in mock DB/session
            Object.assign(savedProfile, updatedProfile);
            localStorage.setItem('sdm_user_profile', JSON.stringify(updatedProfile));
            
            const successMsg = document.getElementById('profile-success-msg');
            successMsg.style.display = 'block';
            setTimeout(() => { successMsg.style.display = 'none'; }, 3000);
            
            setFormEditMode(false);
            updateHeaderAuthUI();
        });

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('sdm_auth_token');
                window.location.href = 'index.html';
            });
        }
    }

    // --- GLOBAL AUTH UI UPDATE (Headers) ---
    updateHeaderAuthUI();

    function updateHeaderAuthUI() {
        const authToken = localStorage.getItem('sdm_auth_token');
        const savedProfile = JSON.parse(localStorage.getItem('sdm_user_profile'));
        const authLinksContainers = document.querySelectorAll('.auth-links-container');

        authLinksContainers.forEach(container => {
            if (authToken && savedProfile) {
                // Logged In
                container.innerHTML = `
                    <a href="profile.html" class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; display: flex; align-items: center; gap: 0.4rem;">
                        <div class="user-avatar">${savedProfile.name.charAt(0).toUpperCase()}</div> 
                        <span class="desktop-only">${savedProfile.name}</span>
                    </a>
                `;
            } else {
                // Logged Out
                container.innerHTML = `
                    <a href="login.html" class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;"><i class="fas fa-user"></i> Login / Sign Up</a>
                `;
            }
        });
    }
});

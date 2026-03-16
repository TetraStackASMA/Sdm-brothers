// auth.js
// Handles user authentication and profile management via real DB API
// Falls back to mock if API is unavailable.

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';

// Helper to get all users from localStorage
function getLocalUsers() {
    return JSON.parse(localStorage.getItem('sdm_users')) || [];
}

// Helper to save users to localStorage
function saveLocalUsers(users) {
    localStorage.setItem('sdm_users', JSON.stringify(users));
}

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
        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = formRegister.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            
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
                    alert('You must be at least 18 years old to create an account.');
                    return;
                }
            }

            const phone = formData.get('phone').trim();
            const name = formData.get('name').trim();
            const address = formData.get('address').trim();
            const store = formData.get('storeLocation');

            try {
                btn.textContent = 'Creating account...';
                btn.disabled = true;

                // Local DB Check
                const users = getLocalUsers();
                if (users.find(u => u.phone === phone)) {
                    throw new Error('A user with this phone number already exists.');
                }

                const newUser = {
                    user_id: Date.now(),
                    name,
                    phone,
                    address,
                    preferred_store: store
                };

                users.push(newUser);
                saveLocalUsers(users);

                // Log in automatically
                localStorage.setItem('sdm_user_profile', JSON.stringify(newUser));
                localStorage.setItem('sdm_auth_token', `local_token_${newUser.user_id}`);

                showAuthSuccess('Account created successfully! Redirecting...');
            } catch (err) {
                alert(err.message);
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });

        // Login Submit
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = formLogin.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            const phone = document.getElementById('loginPhone').value.trim();

            try {
                btn.textContent = 'Logging in...';
                btn.disabled = true;

                // Local DB Check
                const users = getLocalUsers();
                const user = users.find(u => u.phone === phone);

                if (!user) {
                    throw new Error('No account found. Please register first.');
                }

                // Success!
                localStorage.setItem('sdm_user_profile', JSON.stringify(user));
                localStorage.setItem('sdm_auth_token', `local_token_${user.user_id}`);

                showAuthSuccess('Login successful! Redirecting...');
            } catch (err) {
                alert(err.message);
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }

    function showAuthSuccess(msg) {
        if(authSuccessMsg) {
            authSuccessMsg.style.display = 'block';
            authSuccessMsg.querySelector('span').textContent = msg;
            setTimeout(() => {
                const redirectParams = new URLSearchParams(window.location.search);
                const redirectTo = redirectParams.get('redirect') || 'index.html';
                window.location.href = redirectTo;
            }, 1500);
        }
    }

    // --- PROFILE PAGE LOGIC (profile.html) ---
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        let savedProfile = JSON.parse(localStorage.getItem('sdm_user_profile'));
        const authToken = localStorage.getItem('sdm_auth_token');

        if (!authToken || !savedProfile) {
            window.location.href = 'login.html';
            return;
        }

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
                    // Phone is usually protected as ID
                    if (input.id !== 'profilePhone') {
                        input.removeAttribute('readonly');
                        if (input.tagName === 'SELECT') input.removeAttribute('disabled');
                        input.classList.add('editing');
                    }
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
            document.getElementById('profileStore').value = savedProfile.preferred_store || savedProfile.storeLocation || '';
        }

        loadProfileData();
        setFormEditMode(false);

        editBtn.addEventListener('click', () => setFormEditMode(true));
        
        cancelBtn.addEventListener('click', () => {
            loadProfileData();
            setFormEditMode(false);
        });

        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = profileForm.querySelector('button[type="submit"]');
            
            const updatedData = {
                name: document.getElementById('profileName').value.trim(),
                address: document.getElementById('profileAddress').value.trim(),
                preferred_store: document.getElementById('profileStore').value
            };

            try {
                btn.disabled = true;

                // Update local storage
                const users = getLocalUsers();
                const userIndex = users.findIndex(u => u.phone === savedProfile.phone);
                
                if (userIndex === -1) throw new Error('User not found in local database.');

                users[userIndex] = { ...users[userIndex], ...updatedData };
                saveLocalUsers(users);

                // Update active profile
                const newProfile = users[userIndex];
                localStorage.setItem('sdm_user_profile', JSON.stringify(newProfile));
                savedProfile = newProfile;
                
                const successMsg = document.getElementById('profile-success-msg');
                successMsg.style.display = 'block';
                setTimeout(() => { successMsg.style.display = 'none'; }, 3000);
                
                setFormEditMode(false);
                updateHeaderAuthUI();
                updateContactUsUI();
            } catch (err) {
                alert(err.message);
            } finally {
                btn.disabled = false;
            }
        });

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('sdm_auth_token');
                localStorage.removeItem('sdm_user_profile');
                window.location.href = 'index.html';
            });
        }
    }

    // --- GLOBAL AUTH UI UPDATE (Headers) ---
    updateHeaderAuthUI();
    updateContactUsUI();

    function updateHeaderAuthUI() {
        const authToken = localStorage.getItem('sdm_auth_token');
        const savedProfile = JSON.parse(localStorage.getItem('sdm_user_profile'));
        const authLinksContainers = document.querySelectorAll('.auth-links-container');

        authLinksContainers.forEach(container => {
            if (authToken && savedProfile) {
                container.innerHTML = `
                    <a href="profile.html" class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; display: flex; align-items: center; gap: 0.4rem;">
                        <div class="user-avatar">${savedProfile.name.charAt(0).toUpperCase()}</div> 
                        <span class="desktop-only">${savedProfile.name}</span>
                    </a>
                `;
            } else {
                container.innerHTML = `
                    <a href="login.html" class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;"><i class="fas fa-user"></i> Login / Sign Up</a>
                `;
            }
        });
    }

    function updateContactUsUI() {
        const authToken = localStorage.getItem('sdm_auth_token');
        const savedProfile = JSON.parse(localStorage.getItem('sdm_user_profile'));
        const contactContainers = document.querySelectorAll('.contact-us-container');
        
        const storeDetails = {
            "7204954221": "Medpolo Ram Murthy Nagar",
            "8123228221": "SDM Bros Varanasi Road",
            "9740854221": "SDM Bros Kithganur",
            "7353374221": "SDM Bros Chemist Banaswadi",
            "8904627221": "SDM Bros Hiranandalli",
            "9036674221": "SDM Bros Bile Shivalaya"
        };

        contactContainers.forEach(container => {
            const storeLoc = savedProfile ? (savedProfile.preferred_store || savedProfile.storeLocation) : null;
            if (authToken && savedProfile && storeLoc) {
                const storeName = storeDetails[storeLoc] || 'Preferred Store';
                container.innerHTML = `
                    <a href="tel:${storeLoc}" class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" title="Call Store">
                        <i class="fas fa-phone-alt"></i> <span class="desktop-only">${storeName}</span>
                    </a>
                `;
            } else {
                let optionsHtml = '<option value="" disabled selected>📞 Contact Us</option>';
                for (const [phone, name] of Object.entries(storeDetails)) {
                    optionsHtml += `<option value="${phone}">${name}</option>`;
                }
                
                container.innerHTML = `
                    <select class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; appearance: auto; cursor: pointer; max-width: 170px; text-overflow: ellipsis;" onchange="if(this.value) window.location.href='tel:'+this.value;">
                        ${optionsHtml}
                    </select>
                `;
            }
        });
    }
});

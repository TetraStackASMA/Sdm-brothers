// auth.js
// Handles user authentication and profile management via real DB API
// Falls back to mock if API is unavailable.

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';

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

            const payload = {
                name: formData.get('name').trim(),
                phone_number: formData.get('phone').trim(),
                address: formData.get('address').trim(),
                preferred_store: formData.get('storeLocation')
            };

            try {
                btn.textContent = 'Creating account...';
                btn.disabled = true;

                const response = await fetch(`${API_BASE}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Registration failed.');
                }

                // Success!
                // Map API field 'phone_number' back to frontend 'phone' for compatibility
                const profile = { ...data.user, phone: data.user.phone_number };
                localStorage.setItem('sdm_user_profile', JSON.stringify(profile));
                localStorage.setItem('sdm_auth_token', data.token);

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

                const response = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone_number: phone })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Login failed.');
                }

                // Success!
                const profile = { ...data.user, phone: data.user.phone_number };
                localStorage.setItem('sdm_user_profile', JSON.stringify(profile));
                localStorage.setItem('sdm_auth_token', data.token);

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
                const response = await fetch(`${API_BASE}/user/profile`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(updatedData)
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Update failed.');

                // Update local storage
                const newProfile = { ...data.user, phone: data.user.phone_number };
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

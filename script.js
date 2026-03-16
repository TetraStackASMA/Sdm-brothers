// script.js

document.addEventListener('DOMContentLoaded', () => {

    // Initialize cart from localStorage
    let cart = JSON.parse(localStorage.getItem('sdm_cart')) || [];
    
    // Update Cart Count in Header
    function updateCartCount() {
        const countSpan = document.getElementById('cart-count');
        if (countSpan) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            countSpan.textContent = totalItems;
        }
    }
    
    updateCartCount();

    // ============================================
    // STOREFRONT LOGIC (index.html)
    // ============================================
    const productsContainer = document.getElementById('products-container');
    const categoryList = document.getElementById('category-list');
    
    if (productsContainer && typeof products !== 'undefined') {
        let currentCategory = 'All';
        let searchQuery = '';
        let sortOption = 'default';
        
        // Search Logic
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.toLowerCase();
                renderProducts();
            });
        }
        
        // Sort Logic
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                sortOption = e.target.value;
                renderProducts();
            });
        }
        
        // Populate Categories
        const categories = [...new Set(products.map(p => p.category))].sort();
        
        categories.forEach(cat => {
            const li = document.createElement('li');
            li.textContent = cat;
            li.dataset.cat = cat;
            li.addEventListener('click', () => {
                document.querySelectorAll('#category-list li').forEach(el => el.classList.remove('active'));
                li.classList.add('active');
                currentCategory = cat;
                renderProducts();
            });
            categoryList.appendChild(li);
        });
        
        // Handle "All" category click
        document.querySelector('li[data-cat="All"]').addEventListener('click', (e) => {
            document.querySelectorAll('#category-list li').forEach(el => el.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = 'All';
            renderProducts();
        });

        // Add to Cart
        window.addToCart = function(productId, isFromPrescription = false) {
            const product = products.find(p => p.id === productId);
            if (!product) return;
            
            // Antibiotics disclaimer logic handled during checkout or on-card

            const existingItem = cart.find(item => item.id === productId);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: 1
                });
            }
            
            localStorage.setItem('sdm_cart', JSON.stringify(cart));
            updateCartCount();
            showToast(`${product.name} added to cart`);
        };

        // View Details Modal
        window.viewDetails = function(productId) {
            const modal = document.getElementById('product-modal');
            const modalBody = document.getElementById('modal-body');
            const product = products.find(p => p.id === productId);
            
            const vis = getCategoryVisual(product.category);
            modalBody.innerHTML = `
                <div class="modal-body-content">
                    <div class="modal-info">
                        <div class="product-cat">${product.category}</div>
                        <h2>${product.name}</h2>
                        <div class="product-rating"><i class="fas fa-star"></i> ${product.rating} / 5.0</div>
                        <div class="product-price" style="margin: 1rem 0;">₹${product.price.toLocaleString('en-IN')}</div>
                        <p style="color: var(--text-muted); line-height: 1.6;">${product.description}</p>
                        
                        <div class="btn-group" style="margin-top: 2rem;">
                            <button class="btn btn-primary" onclick="addToCart(${product.id}); document.getElementById('product-modal').style.display='none';">Add to Cart</button>
                            <button class="btn btn-outline" onclick="document.getElementById('product-modal').style.display='none';">Close</button>
                        </div>
                    </div>
                </div>
            `;
            modal.style.display = 'block';
        };

        // Category → icon + gradient mapping
        function getCategoryVisual(category) {
            const map = {
                'Pain Relief': { icon: 'fa-head-side-virus', grad: 'linear-gradient(135deg, #f97316, #fb923c)' },
                'Cold and Flu': { icon: 'fa-wind', grad: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' },
                'Digestive Health': { icon: 'fa-stomach', grad: 'linear-gradient(135deg, #a78bfa, #7c3aed)' },
                'Vitamins and Supplements': { icon: 'fa-capsules', grad: 'linear-gradient(135deg, #facc15, #eab308)' },
                'Antibiotics (Prescription Required)': { icon: 'fa-shield-virus', grad: 'linear-gradient(135deg, #f43f5e, #be123c)' },
                'Diabetes Care': { icon: 'fa-droplet', grad: 'linear-gradient(135deg, #60a5fa, #2563eb)' },
                'Heart and Blood Pressure': { icon: 'fa-heart-pulse', grad: 'linear-gradient(135deg, #f87171, #dc2626)' },
                'Skin Care': { icon: 'fa-spa', grad: 'linear-gradient(135deg, #86efac, #16a34a)' },
                'Eye Care': { icon: 'fa-eye', grad: 'linear-gradient(135deg, #5eead4, #0d9488)' },
                'Ear Care': { icon: 'fa-ear-listen', grad: 'linear-gradient(135deg, #fda4af, #e11d48)' },
                'Dental Care': { icon: 'fa-tooth', grad: 'linear-gradient(135deg, #c4b5fd, #6d28d9)' },
                'Baby and Child Care': { icon: 'fa-baby', grad: 'linear-gradient(135deg, #fdba74, #ea580c)' },
                'Women\'s Health': { icon: 'fa-venus', grad: 'linear-gradient(135deg, #f9a8d4, #db2777)' },
                'Men\'s Health': { icon: 'fa-mars', grad: 'linear-gradient(135deg, #93c5fd, #1d4ed8)' },
                'Respiratory': { icon: 'fa-lungs', grad: 'linear-gradient(135deg, #6ee7b7, #059669)' },
                'Allergy': { icon: 'fa-allergies', grad: 'linear-gradient(135deg, #fcd34d, #d97706)' },
                'Mental Health': { icon: 'fa-brain', grad: 'linear-gradient(135deg, #a5b4fc, #4338ca)' },
                'Sleep Aids': { icon: 'fa-moon', grad: 'linear-gradient(135deg, #818cf8, #312e81)' },
                'First Aid': { icon: 'fa-kit-medical', grad: 'linear-gradient(135deg, #fb7185, #be185d)' },
                'Personal Care': { icon: 'fa-pump-soap', grad: 'linear-gradient(135deg, #34d399, #047857)' },
            };
            return map[category] || { icon: 'fa-pills', grad: 'linear-gradient(135deg, #10b981, #059669)' };
        }

        // Close Modal logic
        const closeModal = document.querySelector('.close-modal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                document.getElementById('product-modal').style.display = 'none';
            });
        }
        window.onclick = function(event) {
            const modal = document.getElementById('product-modal');
            if (event.target == modal) {
                modal.style.display = "none";
            }
        };

        // Render Products
        function renderProducts() {
            productsContainer.innerHTML = '';
            
            let filteredProducts = currentCategory === 'All' 
                ? [...products] 
                : products.filter(p => p.category === currentCategory);
                
            if (searchQuery) {
                filteredProducts = filteredProducts.filter(p => 
                    p.name.toLowerCase().includes(searchQuery) || 
                    (p.description && p.description.toLowerCase().includes(searchQuery))
                );
            }
            
            if (sortOption === 'asc') {
                filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            } else if (sortOption === 'desc') {
                filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
            } else if (sortOption === 'price_asc') {
                filteredProducts.sort((a, b) => a.price - b.price);
            }
                
            document.getElementById('current-category-title').textContent = currentCategory === 'All' ? 'All Products' : currentCategory;
            document.getElementById('product-count').textContent = `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} found`;
            
            filteredProducts.forEach(product => {
                const isAntibiotic = product.category === "Antibiotics (Prescription Required)";
                const card = document.createElement('div');
                card.className = 'product-card product-card-minimal';
                card.innerHTML = `
                    <div class="product-content">
                        <div class="product-cat">${product.category}</div>
                        <h3 class="product-title">${product.name}</h3>
                        ${isAntibiotic ? '<div class="rx-disclaimer"><i class="fas fa-file-medical"></i> Prescription Required</div>' : ''}
                        <div class="product-price">₹${product.price.toLocaleString('en-IN')}</div>
                        <div class="btn-group">
                            <button class="btn btn-primary" onclick="addToCart(${product.id})">Add to Cart</button>
                            <button class="btn btn-outline" onclick="viewDetails(${product.id})">Details</button>
                        </div>
                    </div>
                `;
                productsContainer.appendChild(card);
            });

        }
        
        renderProducts();
    }

    // Toast Notification logic
    function showToast(message) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fas fa-check-circle" style="color:var(--primary)"></i> <span>${message}</span>`;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3500);
    }
    
    // ============================================
    // CHECKOUT LOGIC (checkout.html)
    // ============================================
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        const storeNames = {
            "7204954221": "Medpolo Ram Murthy Nagar",
            "8123228221": "SDM Brothers Varanasi Road Ram Murthy Nagar",
            "9740854221": "SDM Brothers Kithganur",
            "7353374221": "SDM Brothers Chemist Banaswadi",
            "8904627221": "SDM Brothers Hiranandalli",
            "9036674221": "SDM Brothers Bile Shivalaya"
        };

        let totalAmount = 0;

        function renderCartPage() {
            const cartItemsContainer = document.getElementById('cart-items');
            cartItemsContainer.innerHTML = '';
            totalAmount = 0;

            if (cart.length === 0) {
                cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Your cart is empty. <br><a href="index.html" style="color:var(--primary);text-decoration:none;margin-top:10px;display:inline-block;">Go back to store</a></div>';
                document.getElementById('subtotal').textContent = '₹0';
                document.getElementById('grand-total').textContent = '₹0';
                return;
            }

            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                totalAmount += itemTotal;

                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';
                itemEl.innerHTML = `
                    <div class="item-info">
                        <span class="item-name">${item.name}</span>
                        <span class="item-qty">Qty: ${item.quantity}</span>
                    </div>
                    <div class="item-price">₹${itemTotal.toLocaleString('en-IN')}</div>
                `;
                cartItemsContainer.appendChild(itemEl);
            });

            document.getElementById('subtotal').textContent = `₹${totalAmount.toLocaleString('en-IN')}`;
            document.getElementById('grand-total').textContent = `₹${totalAmount.toLocaleString('en-IN')}`;
        }

        renderCartPage();

        const useSavedAddress = document.getElementById('useSavedAddress');
        const autofillContainer = document.getElementById('autofill-container');
        
        // Show autofill option only if logged in
        const savedProfile = JSON.parse(localStorage.getItem('sdm_user_profile'));
        const authToken = localStorage.getItem('sdm_auth_token');
        
        if (savedProfile && authToken && autofillContainer) {
            autofillContainer.style.display = 'block';
            
            useSavedAddress.addEventListener('change', (e) => {
                if(e.target.checked) {
                    document.getElementById('fullName').value = savedProfile.name;
                    document.getElementById('phone').value = savedProfile.phone;
                    document.getElementById('address').value = savedProfile.address;
                    document.getElementById('storeLocation').value = savedProfile.storeLocation;
                } else {
                    document.getElementById('fullName').value = '';
                    document.getElementById('phone').value = '';
                    document.getElementById('address').value = '';
                    document.getElementById('storeLocation').value = '';
                }
            });
        }

        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (cart.length === 0) {
                alert("Your cart is empty! Please add items before checking out.");
                window.location.href = "index.html";
                return;
            }

            const formData = new FormData(checkoutForm);
            const customerName = formData.get('fullName').trim();
            const phoneNumber = formData.get('phone').trim();
            const address = formData.get('address').trim();
            const storePhone = formData.get('storeLocation');
            
            if (!storePhone) {
                alert('Please select a nearest store.');
                return;
            }

            const storeName = storeNames[storePhone];

            // Format Cart Items for WhatsApp
            let orderDetails = '';
            cart.forEach((item) => {
                orderDetails += `• ${item.name} (x${item.quantity}) - ₹${(item.price * item.quantity).toLocaleString('en-IN')}\n`;
            });

            // Build the WhatsApp message
            const message = 
`*New Order from SDM Brothers!* 📦

*Customer Details:*
👤 Name: ${customerName}
📞 Phone: ${phoneNumber}
📍 Address: ${address}

*Order Summary:*
${orderDetails}
*Total Amount:* ₹${totalAmount.toLocaleString('en-IN')}

*Selected Store Location:* 
🏪 ${storeName}`;

            // URL Encode the message
            const encodedMessage = encodeURIComponent(message);
            
            // Target phone processing
            let targetPhone = storePhone;
            targetPhone = targetPhone.replace(/[^0-9]/g, ''); // strip non-numeric
            if (targetPhone.length === 10) {
                targetPhone = '91' + targetPhone; // Default to India country code if 10 digits
            }

            // WhatsApp redirect URL
            const waUrl = `https://wa.me/${targetPhone}?text=${encodedMessage}`;
            
            // Clear cart upon successful order preparation
            localStorage.removeItem('sdm_cart');
            
            // Redirect logic 
            window.location.href = waUrl;
        });
    }

});

// script.js

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';

document.addEventListener('DOMContentLoaded', async () => {

    // Initialize cart from localStorage
    let cart = JSON.parse(localStorage.getItem('sdm_cart')) || [];
    
    // Global data stores
    let allMedicines = [];
    let allStores = [];

    // Helper to map DB medicine to Frontend product
    function mapMedicine(m) {
        return {
            id: m.medicine_id,
            name: m.name,
            description: m.description,
            category: m.category,
            price: Number(m.price),
            rating: 4.5 + (Math.random() * 0.5), // Simulate rating
            image: m.image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
            prescription_required: m.prescription_required
        };
    }

    // Fetch Initial Data
    try {
        const [medRes, storeRes] = await Promise.all([
            fetch(`${API_BASE}/medicines`),
            fetch(`${API_BASE}/stores`)
        ]);
        
        if (medRes.ok) {
            const medData = await medRes.json();
            allMedicines = medData.map(mapMedicine);
        }
        
        if (storeRes.ok) {
            allStores = await storeRes.json();
        }
    } catch (err) {
        console.error('Failed to fetch store data:', err);
        // Fallback to hardcoded products if global 'products' exists from products.js
        if (typeof products !== 'undefined') allMedicines = products;
    }

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
    
    if (productsContainer) {
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
        const categories = [...new Set(allMedicines.map(p => p.category))].sort();
        
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
        const allTab = document.querySelector('li[data-cat="All"]');
        if (allTab) {
            allTab.addEventListener('click', (e) => {
                document.querySelectorAll('#category-list li').forEach(el => el.classList.remove('active'));
                e.target.classList.add('active');
                currentCategory = 'All';
                renderProducts();
            });
        }

        // Add to Cart
        window.addToCart = function(productId, isFromPrescription = false) {
            const product = allMedicines.find(p => p.id === productId);
            if (!product) return;
            
            // Prescription requirement blocker
            if (!isFromPrescription && product.prescription_required === 1) {
                alert(`⚠️ ${product.name} is a prescription-only medicine.\n\nPlease upload a prescription first.`);
                return;
            }

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
            const product = allMedicines.find(p => p.id === productId);
            if (!product) return;

            const vis = getCategoryVisual(product.category);
            modalBody.innerHTML = `
                <div class="modal-body-content">
                    <div class="product-img-tile modal-tile" style="background: ${vis.grad};">
                        <i class="fas ${vis.icon} product-tile-icon" style="font-size: 4rem;"></i>
                    </div>
                    <div class="modal-info">
                        <h2>${product.name}</h2>
                        <div class="product-cat">${product.category}</div>
                        <div class="product-rating"><i class="fas fa-star"></i> ${product.rating.toFixed(1)} / 5.0</div>
                        <div class="product-price" style="margin: 1rem 0;">₹${product.price.toLocaleString('en-IN')}</div>
                        <p>${product.description}</p>
                        
                        <div class="btn-group" style="margin-top: 2rem;">
                            <button class="btn btn-primary" onclick="addToCart(${product.id}); document.getElementById('product-modal').style.display='none';">Add to Cart</button>
                        </div>
                    </div>
                </div>
            `;
            modal.style.display = 'block';
        };

        // Category → icon + gradient mapping
        function getCategoryVisual(category) {
            const map = {
                'Pain Relief Medicines': { icon: 'fa-head-side-virus', grad: 'linear-gradient(135deg, #f97316, #fb923c)' },
                'Cold and Flu Medicines': { icon: 'fa-wind', grad: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' },
                'Digestive Health': { icon: 'fa-stomach', grad: 'linear-gradient(135deg, #a78bfa, #7c3aed)' },
                'Skincare and Dermatology': { icon: 'fa-spa', grad: 'linear-gradient(135deg, #86efac, #16a34a)' },
                'Antibiotics (Prescription Required)': { icon: 'fa-shield-virus', grad: 'linear-gradient(135deg, #f43f5e, #be123c)' },
                'Diabetes Care': { icon: 'fa-droplet', grad: 'linear-gradient(135deg, #60a5fa, #2563eb)' },
                'Heart Health': { icon: 'fa-heart-pulse', grad: 'linear-gradient(135deg, #f87171, #dc2626)' },
                'Nutrition Supplements': { icon: 'fa-capsules', grad: 'linear-gradient(135deg, #facc15, #eab308)' },
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
                ? [...allMedicines] 
                : allMedicines.filter(p => p.category === currentCategory);
                
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
                const card = document.createElement('div');
                card.className = 'product-card product-card-minimal';
                card.innerHTML = `
                    <div class="product-content">
                        <h3 class="product-title">${product.name}</h3>
                        <div class="product-price">₹${product.price.toLocaleString('en-IN')}</div>
                        <p style="font-size: 0.8rem; color: #666; margin: 0.5rem 0; height: 3rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${product.description}</p>
                        <button class="btn btn-primary" style="width:100%; margin-top:0.75rem;" onclick="addToCart(${product.id})">Add to Cart</button>
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
        setTimeout(() => { toast.remove(); }, 3500);
    }
    
    // ============================================
    // CHECKOUT LOGIC (checkout.html)
    // ============================================
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        let totalAmount = 0;

        // Populate Store Dropdown from DB
        const storeSelect = document.getElementById('storeLocation');
        if (storeSelect && allStores.length > 0) {
            storeSelect.innerHTML = '<option value="" disabled selected>Select Nearest Store</option>';
            allStores.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.store_id; // Use ID for DB, but keep phone for WhatsApp?
                opt.textContent = `${s.store_name} (${s.city})`;
                opt.dataset.phone = s.phone_number;
                storeSelect.appendChild(opt);
            });
        }

        function renderCartPage() {
            const cartItemsContainer = document.getElementById('cart-items');
            if (!cartItemsContainer) return;

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
        
        const savedProfile = JSON.parse(localStorage.getItem('sdm_user_profile'));
        const authToken = localStorage.getItem('sdm_auth_token');
        
        if (savedProfile && authToken && autofillContainer) {
            autofillContainer.style.display = 'block';
            
            useSavedAddress.addEventListener('change', (e) => {
                if(e.target.checked) {
                    document.getElementById('fullName').value = savedProfile.name;
                    document.getElementById('phone').value = savedProfile.phone;
                    document.getElementById('address').value = savedProfile.address;
                    // Try to match store ID
                    if (savedProfile.preferred_store) {
                        document.getElementById('storeLocation').value = savedProfile.preferred_store;
                    }
                }
            });
        }

        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = checkoutForm.querySelector('button[type="submit"]');
            
            if (cart.length === 0) {
                alert("Your cart is empty!");
                return;
            }

            const storeId = document.getElementById('storeLocation').value;
            const selectedStore = allStores.find(s => s.store_id == storeId);
            
            if (!selectedStore) {
                alert('Please select a store.');
                return;
            }

            try {
                btn.textContent = 'Processing Order...';
                btn.disabled = true;

                // 1. Save to Database if logged in
                let orderSuccess = false;
                if (authToken && savedProfile) {
                    const orderPayload = {
                        user_id: savedProfile.user_id,
                        store_id: storeId,
                        delivery_address: document.getElementById('address').value.trim(),
                        items: cart.map(item => ({
                            medicine_id: item.id,
                            quantity: item.quantity
                        }))
                    };

                    const response = await fetch(`${API_BASE}/orders`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: JSON.stringify(orderPayload)
                    });

                    if (response.ok) orderSuccess = true;
                }

                // 2. Prepare WhatsApp Message
                let orderDetails = '';
                cart.forEach((item) => {
                    orderDetails += `• ${item.name} (x${item.quantity}) - ₹${(item.price * item.quantity).toLocaleString('en-IN')}\n`;
                });

                const message = `*New Order from SDM Brothers!* 📦\n\n*Customer:* ${document.getElementById('fullName').value}\n*Phone:* ${document.getElementById('phone').value}\n*Address:* ${document.getElementById('address').value}\n\n*Summary:* \n${orderDetails}\n*Total:* ₹${totalAmount.toLocaleString('en-IN')}\n\n*Store:* ${selectedStore.store_name}`;
                
                const waUrl = `https://wa.me/91${selectedStore.phone_number}?text=${encodeURIComponent(message)}`;
                
                localStorage.removeItem('sdm_cart');
                window.location.href = waUrl;
            } catch (err) {
                alert('Order failed to save to database, but you can still proceed via WhatsApp.');
                console.error(err);
                // Fallback to WhatsApp anyway
                localStorage.removeItem('sdm_cart');
                window.location.href = `https://wa.me/91${selectedStore.phone_number}?text=Order Failure Fallback`;
            }
        });
    }

});
